import { useEffect, useState } from "react";
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
        setError("Não foi possível carregar suas cápsulas.");
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
      <p className="text-gray-400 text-center animate-pulse">
        Carregando cápsulas…
      </p>
    );
  }

  if (error) {
    return <p className="text-red-400 text-center">{error}</p>;
  }

  if (capsules.length === 0) {
    return (
      <p className="text-gray-400 text-center">
        Você ainda não criou nenhuma cápsula.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {capsules.map((capsule) => {
        const unlocked = isUnlocked(capsule.openAt);

        return (
          <div
            key={capsule.id}
            className="rounded-xl border border-white/10 bg-white/5 p-4 transition-all hover:border-white/20"
          >
            {!unlocked ? (
              <div className="text-center text-gray-300">
                <div className="text-2xl mb-2">🔒</div>
                <strong>Cápsula bloqueada</strong>
                <p className="text-sm mt-1">
                  Abre em{" "}
                  <span className="font-semibold text-blue-400">
                    {daysLeft(capsule.openAt)} dias
                  </span>
                </p>
                <p className="text-xs text-gray-500 mt-2">
                  Disponível em: {capsule.openAt.toDate().toLocaleDateString()}
                </p>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-2 text-green-400 text-sm font-medium">
                  <span>🔓 Cápsula Liberada!</span>
                </div>
                <video
                  src={capsule.videoUrl}
                  controls
                  className="rounded-lg w-full aspect-video bg-black shadow-lg"
                />
                <span className="text-xs text-gray-500">
                  Criada em: {capsule.createdAt.toDate().toLocaleDateString()}
                </span>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
