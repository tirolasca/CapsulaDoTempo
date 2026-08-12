import express from "express";
import cors from "cors";
import multer from "multer";
import { randomUUID } from "crypto";
import { FieldValue, Timestamp } from "firebase-admin/firestore";
import type { DecodedIdToken } from "firebase-admin/auth";
import { adminAuth, adminDb, adminBucket, describeAdminError } from "./firebaseAdmin";

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: DecodedIdToken;
    }
  }
}

const app = express();

app.use(cors({ origin: process.env.FRONTEND_ORIGIN || "http://localhost:5173" }));
app.use(express.json());

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 200 * 1024 * 1024 }, // 200MB
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith("video/")) {
      cb(null, true);
    } else {
      cb(new Error("O arquivo enviado precisa ser um vídeo."));
    }
  },
});

/** Exige um ID token válido do Firebase no header Authorization: Bearer <token> */
async function verifyFirebaseToken(
  req: express.Request,
  res: express.Response,
  next: express.NextFunction,
) {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;

  if (!token) {
    res.status(401).json({ error: "Token de autenticação ausente." });
    return;
  }

  try {
    req.user = await adminAuth().verifyIdToken(token);
    next();
  } catch (err) {
    console.error("Falha ao verificar token:", err);
    const { configIssue, message } = describeAdminError(err);
    res.status(configIssue ? 500 : 401).json({
      error: configIssue ? message : "Token de autenticação inválido ou expirado.",
    });
  }
}

// Faz uma chamada real ao Firebase Admin (não só confere se o app foi
// inicializado) — é a única forma confiável de saber se as credenciais
// estão de fato válidas, já que initializeApp() nunca falha sozinho.
app.get("/health", async (_req, res) => {
  try {
    await adminAuth().listUsers(1);
    res.json({ ok: true, firebaseAdmin: "pronto" });
  } catch (err) {
    const { message } = describeAdminError(err);
    res.json({ ok: true, firebaseAdmin: `indisponível — ${message}` });
  }
});

app.post(
  "/capsulas",
  verifyFirebaseToken,
  upload.single("video"),
  async (req, res) => {
    try {
      if (!req.file) {
        res.status(400).json({ error: "Nenhum vídeo enviado." });
        return;
      }

      const { openDate } = req.body as { openDate?: string };
      const openAtDate = openDate ? new Date(openDate) : null;

      if (!openAtDate || Number.isNaN(openAtDate.getTime())) {
        res.status(400).json({ error: "Informe uma data de abertura válida." });
        return;
      }

      const user = req.user!;
      const downloadToken = randomUUID();
      const filePath = `videos/${user.uid}/${randomUUID()}.webm`;
      const bucket = adminBucket();
      const file = bucket.file(filePath);

      await file.save(req.file.buffer, {
        metadata: {
          contentType: req.file.mimetype,
          metadata: { firebaseStorageDownloadTokens: downloadToken },
        },
      });

      const videoUrl = `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(filePath)}?alt=media&token=${downloadToken}`;

      const docRef = await adminDb()
        .collection("capsulas")
        .add({
          userId: user.uid,
          userName: user.name ?? null,
          videoUrl,
          createdAt: FieldValue.serverTimestamp(),
          openAt: Timestamp.fromDate(openAtDate),
        });

      res.status(201).json({ id: docRef.id, videoUrl });
    } catch (err) {
      console.error("Erro ao salvar cápsula:", err);
      const { message } = describeAdminError(err);
      res.status(500).json({ error: message || "Erro ao salvar a cápsula no servidor." });
    }
  },
);

// Middleware de erro — pega falhas do multer (arquivo grande demais, tipo inválido)
// e devolve JSON em vez da página de erro padrão do Express.
app.use(
  (err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    if (err instanceof multer.MulterError) {
      res.status(400).json({ error: `Erro no upload: ${err.message}` });
      return;
    }
    if (err instanceof Error) {
      res.status(400).json({ error: err.message });
      return;
    }
    console.error("Erro não tratado:", err);
    res.status(500).json({ error: "Erro inesperado no servidor." });
  },
);

const PORT = Number(process.env.PORT) || 3333;

app.listen(PORT, () => {
  console.log(`🚀 Backend rodando em http://localhost:${PORT}`);
  console.log(`   Verifique a configuração do Firebase em http://localhost:${PORT}/health`);
});
