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
  openAt: Timestamp;
};

type Props = {
  user: User;
};

export function CapsuleList({ user }: Props) {
  const [capsules, setCapsules] = useState<Capsule[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchCapsules() {
      const q = query(
        collection(db, "capsulas"),
        where("userId", "==", user.uid),
        orderBy("createdAt", "desc")
      );

      const snapshot = await getDocs(q);

      const data: Capsule[] = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...(doc.data() as Omit<Capsule, "id">),
      }));

      setCapsules(data);
      setLoading(false);
    }

    fetchCapsules();
  }, [user.uid]);

  function isUnlocked(openAt: Timestamp) {
    return new Date() >= openAt.toDate();
  }

  function daysLeft(openAt: Timestamp) {
    const diff =
      openAt.toDate().getTime() - new Date().getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  }

  if (loading) {
    return <p className="text-gray-400 text-center">Carregando cápsulas…</p>;
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
            className="rounded-xl border border-white/10 bg-white/5 p-4"
          >
            {!unlocked ? (
              <div className="text-center text-gray-300">
                🔒 <strong>Cápsula bloqueada</strong>
                <p className="text-sm mt-1">
                  Abre em{" "}
                  <span className="font-semibold">
                    {daysLeft(capsule.openAt)} dias
                  </span>
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Data:{" "}
                  {capsule.openAt
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
                  {capsule.openAt
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
