import { useEffect, useState } from "react";
import { motion } from "framer-motion";

type Props = {
  targetDate: Date;
};

function getTimeLeft(targetDate: Date) {
  const now = new Date().getTime();
  const target = targetDate.getTime();
  const diff = target - now;

  if (isNaN(diff) || diff <= 0) {
    return null;
  }

  return {
    days: Math.floor(diff / (1000 * 60 * 60 * 24)),
    hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((diff / (1000 * 60)) % 60),
    seconds: Math.floor((diff / 1000) % 60),
  };
}

export function Countdown({ targetDate }: Props) {
  const [time, setTime] = useState(() => getTimeLeft(targetDate));

  useEffect(() => {
    const interval = setInterval(() => {
      setTime(getTimeLeft(targetDate));
    }, 1000);

    return () => clearInterval(interval);
  }, [targetDate]);

  if (!time) {
    return (
      <p className="text-center text-emerald-400 text-sm font-medium">
        🎉 Cápsula liberada!
      </p>
    );
  }

  return (
    <div className="flex justify-center gap-3">
      {Object.entries(time).map(([label, value]) => (
        <motion.div
          key={label}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-center min-w-[64px]"
        >
          <p className="text-lg font-semibold text-white">{value}</p>
          <p className="text-[10px] uppercase text-gray-400">{label}</p>
        </motion.div>
      ))}
    </div>
  );
}
