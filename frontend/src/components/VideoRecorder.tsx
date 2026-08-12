import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faVideo,
  faStop,
  faPlay,
  faCalendarDays,
  faCircleNotch,
  faTriangleExclamation,
  faCircle,
} from "@fortawesome/free-solid-svg-icons";
import type { User } from "firebase/auth";

type Props = {
  user: User;
};

const API_URL = (import.meta as ImportMeta & { env?: { VITE_API_URL?: string } }).env?.VITE_API_URL || "http://localhost:3333";

export function VideoRecorder({ user }: Readonly<Props>) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunks = useRef<Blob[]>([]);

  const [recording, setRecording] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [openDate, setOpenDate] = useState<string>("");
  const [error, setError] = useState<string | null>(null);

  function getSupportedMimeType() {
    const types = [
      "video/webm;codecs=vp9,opus",
      "video/webm;codecs=vp8,opus",
      "video/webm",
    ];
    return types.find((t) => MediaRecorder.isTypeSupported(t));
  }

  function cleanup() {
    mediaRecorderRef.current = null;
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }

  async function saveCapsule(blob: Blob) {
    setUploading(true);
    try {
      const idToken = await user.getIdToken();

      const formData = new FormData();
      formData.append("video", blob, "capsula.webm");
      formData.append("openDate", openDate);

      const res = await fetch(`${API_URL}/capsulas`, {
        method: "POST",
        headers: { Authorization: `Bearer ${idToken}` },
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(
          data?.error || `Não foi possível salvar a cápsula (erro ${res.status}).`,
        );
      }

      const data = (await res.json()) as { videoUrl: string };
      setVideoUrl(data.videoUrl);
    } catch (err) {
      console.error(err);
      setError(
        err instanceof Error
          ? err.message
          : "Erro ao salvar a cápsula. Verifique sua conexão e tente novamente.",
      );
    } finally {
      setUploading(false);
    }
  }

  async function startRecording() {
    if (!openDate) {
      setError("Escolha uma data para abrir a cápsula.");
      return;
    }

    try {
      setError(null);
      setVideoUrl(null);
      chunks.current = [];

      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.muted = true;
        await videoRef.current.play();
      }

      const mimeType = getSupportedMimeType();
      const mediaRecorder = new MediaRecorder(
        stream,
        mimeType ? { mimeType } : undefined,
      );

      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.current.push(e.data);
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks.current, { type: mediaRecorder.mimeType });
        cleanup();
        void saveCapsule(blob);
      };

      mediaRecorder.start(1000);
      setRecording(true);
    } catch (err) {
      console.error(err);
      setError("Erro ao acessar câmera ou microfone.");
    }
  }

  function stopRecording() {
    mediaRecorderRef.current?.stop();
    setRecording(false);
  }

  useEffect(() => {
    return () => cleanup();
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="w-full max-w-lg rounded-2xl border border-white/5 bg-surface/80 p-6 shadow-2xl shadow-black/40 backdrop-blur-xl"
    >
      <header className="mb-5 text-center">
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-gold">
          Nova cápsula
        </p>
        <h1 className="font-display text-2xl font-semibold text-parchment">
          Grave uma mensagem para o futuro
        </h1>
      </header>

      <label className="mb-1 flex items-center gap-2 text-sm text-muted">
        <FontAwesomeIcon icon={faCalendarDays} className="size-3.5" />
        Abrir cápsula em
      </label>
      <input
        type="date"
        value={openDate}
        min={new Date().toISOString().split("T")[0]}
        onChange={(e) => setOpenDate(e.target.value)}
        disabled={recording || uploading}
        className="mb-5 w-full rounded-lg border border-white/10 bg-ink/60 px-3 py-2 font-mono text-parchment focus:outline-none focus:ring-2 focus:ring-gold disabled:opacity-50"
      />

      <div className="relative aspect-video overflow-hidden rounded-xl bg-ink">
        <video
          ref={videoRef}
          src={videoUrl ?? undefined}
          autoPlay
          playsInline
          muted={!videoUrl}
          controls={!!videoUrl}
          className="h-full w-full object-cover"
        >
          <track kind="captions" label="Português" srcLang="pt" src="data:text/vtt,WEBVTT" />
        </video>

        <AnimatePresence>
          {recording && (
            <motion.span
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="absolute left-3 top-3 flex items-center gap-2 rounded-full bg-seal/90 px-3 py-1 text-xs text-parchment"
            >
              <span className="relative flex size-2">
                <FontAwesomeIcon icon={faCircle} className="animate-seal-pulse size-2 rounded-full text-parchment" />
              </span>
              {" "}
              Gravando
            </motion.span>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {uploading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-ink/80 backdrop-blur-sm"
            >
              <FontAwesomeIcon icon={faCircleNotch} className="size-6 animate-spin text-gold" />
              <p className="font-mono text-xs text-parchment">Selando a cápsula…</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {error && (
          <motion.p
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-4 flex items-center gap-2 rounded-lg bg-seal/10 px-3 py-2 text-sm text-seal-light"
          >
            <FontAwesomeIcon icon={faTriangleExclamation} className="size-3.5 shrink-0" />
            {error}
          </motion.p>
        )}
      </AnimatePresence>

      <div className="mt-5 flex justify-center gap-3">
        {!recording ? (
          <motion.button
            whileHover={{ scale: uploading ? 1 : 1.03 }}
            whileTap={{ scale: uploading ? 1 : 0.97 }}
            onClick={startRecording}
            disabled={uploading}
            className="flex items-center gap-2 rounded-xl bg-seal px-5 py-2.5 font-medium text-parchment transition-colors hover:bg-seal-light disabled:cursor-not-allowed disabled:opacity-50"
          >
            <FontAwesomeIcon icon={faVideo} className="size-4" />
            Gravar
          </motion.button>
        ) : (
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={stopRecording}
            className="flex items-center gap-2 rounded-xl bg-white/10 px-5 py-2.5 font-medium text-parchment transition-colors hover:bg-white/20"
          >
            <FontAwesomeIcon icon={faStop} className="size-4" />
            Parar
          </motion.button>
        )}

        {videoUrl && (
          <motion.a
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            href={videoUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 rounded-xl bg-gold px-5 py-2.5 font-medium text-ink transition-colors hover:bg-gold-light"
          >
            <FontAwesomeIcon icon={faPlay} className="size-4" />
            Ver vídeo
          </motion.a>
        )}
      </div>
    </motion.div>
  );
}
