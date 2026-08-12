import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faLock,
  faLockOpen,
  faBoxOpen,
  faCircleNotch,
  faTriangleExclamation,
} from "@fortawesome/free-solid-svg-icons";
import {
  collection,
  query,
  where,
  orderBy,
  getDocs,
  Timestamp,
} from "firebase/firestore";
import { db } from "../lib/firebase";
import type { User } from "firebase/auth";

interface Capsule {
  id: string;
  videoUrl: string;
  createdAt: Timestamp;
  openAt: Timestamp;
  userId: string;
}

type Props = {
  user: User | null;
};

export function CapsuleList({ user }: Props) {
  const [capsules, setCapsules] = useState<Capsule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user?.uid) {
      setLoading(false);
      return;
    }

    async function fetchCapsules() {
      try {
        setLoading(true);
        setError(null);

        const q = query(
          collection(db, "capsulas"),
          where("userId", "==", user?.uid),
          orderBy("createdAt", "desc"),
        );

        const snapshot = await getDocs(q);

        const data = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Capsule[];

        setCapsules(data);
      } catch (err: unknown) {
        console.error("Erro ao carregar cápsulas:", err);
        setError(
          err instanceof Error
            ? `Não foi possível carregar suas cápsulas: ${err.message}`
            : "Não foi possível carregar suas cápsulas.",
        );
      } finally {
        setLoading(false);
      }
    }

    fetchCapsules();
  }, [user?.uid]);

  function isUnlocked(openAt: Timestamp) {
    return new Date() >= openAt.toDate();
  }

  function daysLeft(openAt: Timestamp) {
    const diff = openAt.toDate().getTime() - new Date().getTime();
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    return days > 0 ? days : 0;
  }

  if (loading) {
    return (
      <p className="flex items-center justify-center gap-2 text-center text-muted">
        <FontAwesomeIcon icon={faCircleNotch} className="size-4 animate-spin" />
        Carregando cápsulas…
      </p>
    );
  }

  if (error) {
    return (
      <p className="flex items-center justify-center gap-2 rounded-lg bg-seal/10 px-3 py-2 text-center text-sm text-seal-light">
        <FontAwesomeIcon icon={faTriangleExclamation} className="size-3.5 shrink-0" />
        {error}
      </p>
    );
  }

  if (capsules.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 py-6 text-center text-muted">
        <FontAwesomeIcon icon={faBoxOpen} className="size-6 text-gold" />
        <p>Nenhuma cápsula ainda.</p>
        <p className="text-sm">Grave a primeira mensagem para o seu eu do futuro.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {capsules.map((capsule, index) => {
        const unlocked = isUnlocked(capsule.openAt);

        return (
          <motion.div
            key={capsule.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: index * 0.06, ease: "easeOut" }}
            className="rounded-xl border border-white/5 bg-surface/60 p-4 transition-colors hover:border-white/15"
          >
            {!unlocked ? (
              <div className="flex flex-col items-center gap-2 py-2 text-center">
                <motion.span
                  initial={{ scale: 0.7, rotate: -8 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: "spring", stiffness: 260, damping: 18 }}
                  className="flex size-10 items-center justify-center rounded-full bg-seal/15 text-seal-light"
                >
                  <FontAwesomeIcon icon={faLock} className="size-4" />
                </motion.span>
                <strong className="font-display text-parchment">Cápsula lacrada</strong>
                <p className="text-sm text-muted">
                  Abre em{" "}
                  <span className="font-mono font-medium text-gold">
                    {daysLeft(capsule.openAt)} dias
                  </span>
                </p>
                <p className="font-mono text-xs text-muted/70">
                  Disponível em {capsule.openAt.toDate().toLocaleDateString("pt-BR")}
                </p>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-2 text-sm font-medium text-gold">
                  <span className="flex size-6 items-center justify-center rounded-full bg-gold/15">
                    <FontAwesomeIcon icon={faLockOpen} className="size-3" />
                  </span>
                  Cápsula aberta
                </div>
                <video
                  src={capsule.videoUrl}
                  controls
                  className="aspect-video w-full rounded-lg bg-ink shadow-lg"
                />
                <span className="font-mono text-xs text-muted/70">
                  Criada em {capsule.createdAt.toDate().toLocaleDateString("pt-BR")}
                </span>
              </div>
            )}
          </motion.div>
        );
      })}
    </div>
  );
}
