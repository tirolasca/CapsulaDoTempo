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

type Capsule = {
  id: string;
  videoUrl: string;
  createdAt: Timestamp;
  unlockDate: Timestamp;
};

type Props = {
  user: User;
};

export function CapsuleList({ user }: Props) {
  const [capsules, setCapsules] = useState<Capsule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchCapsules() {
      try {
        const q = query(
          collection(db, "capsules"), 
          where("userId", "==", user.uid),
          orderBy("createdAt", "desc")
        );

        const snapshot = await getDocs(q);

        const data: Capsule[] = snapshot.docs.map((doc) => {
          const d = doc.data();

          return {
            id: doc.id,
            videoUrl: d.videoUrl,
            createdAt: d.createdAt,
            unlockDate: d.unlockDate, 
          };
        });

        setCapsules(data);
      } catch (err) {
        console.error("Erro ao buscar cápsulas:", err);
        setError("Erro ao carregar cápsulas.");
      } finally {
        setLoading(false);
      }
    }

    fetchCapsules();
  }, [user.uid]);

  function isUnlocked(unlockDate: Timestamp) {
    return new Date() >= unlockDate.toDate();
  }

  function daysLeft(unlockDate: Timestamp) {
    const diff =
      unlockDate.toDate().getTime() - new Date().getTime();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  }

  if (loading) {
    return (
      <p className="text-gray-400 text-center">
        Carregando cápsulas…
      </p>
    );
  }

  if (error) {
    return (
      <p className="text-red-400 text-center">
        {error}
      </p>
    );
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
        const unlocked = isUnlocked(capsule.unlockDate);

        return (
          <div
            key={capsule.id}
            className="rounded-xl border border-white/10 bg-white/5 p-4"
          >
            {!unlocked ? (
              <div className="text-center text-gray-300">
                🔒 <strong>Cápsula bloqueada</strong>

                <p className="text-sm mt-1">
                  Abre em{" "}
                  <span className="font-semibold">
                    {daysLeft(capsule.unlockDate)} dias
                  </span>
                </p>

                <p className="text-xs text-gray-500 mt-1">
                  Data:{" "}
                  {capsule.unlockDate
                    .toDate()
                    .toLocaleDateString()}
                </p>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                <video
                  src={capsule.videoUrl}
                  controls
                  className="rounded-lg w-full aspect-video bg-black"
                />

                <span className="text-xs text-gray-400">
                  Aberta em{" "}
                  {capsule.unlockDate
                    .toDate()
                    .toLocaleDateString()}
                </span>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
