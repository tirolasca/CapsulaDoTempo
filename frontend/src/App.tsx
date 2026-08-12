import { motion, useReducedMotion } from "framer-motion";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faHourglassHalf, faCircleNotch } from "@fortawesome/free-solid-svg-icons";
import { VideoRecorder } from "./components/VideoRecorder";
import { CapsuleList } from "./components/CapsuleList";
import { AuthButton } from "./components/AuthButton";
import { useAuth } from "./hooks/useAuth";

function App() {
  const { user, loading } = useAuth();
  const reduceMotion = useReducedMotion();

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center gap-2 text-parchment">
        <FontAwesomeIcon icon={faCircleNotch} className="size-4 animate-spin" />
        Carregando…
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6">
      <div className="mx-auto flex max-w-xl flex-col gap-8">
        <header className="flex items-center justify-between">
          <h1 className="flex items-center gap-2 font-display text-lg font-semibold tracking-wide text-parchment">
            <motion.span
              animate={reduceMotion ? {} : { rotate: [0, 180, 180, 360, 360] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", times: [0, 0.4, 0.6, 1, 1] }}
              className="text-gold"
            >
              <FontAwesomeIcon icon={faHourglassHalf} />
            </motion.span>
            Cápsula do Tempo
          </h1>
          <AuthButton user={user} />
        </header>

        {user ? (
          <>
            <VideoRecorder user={user} />

            <motion.section
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.15, ease: "easeOut" }}
              className="flex flex-col gap-3"
            >
              <h2 className="font-mono text-xs uppercase tracking-[0.2em] text-gold">
                Minhas cápsulas
              </h2>
              <CapsuleList user={user} />
            </motion.section>
          </>
        ) : (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="mt-10 text-center text-muted"
          >
            Faça login para gravar e abrir suas cápsulas do tempo.
          </motion.p>
        )}
      </div>
    </div>
  );
}

export default App;
