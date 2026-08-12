import { motion } from "framer-motion";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faGoogle } from "@fortawesome/free-brands-svg-icons";
import { faRightFromBracket } from "@fortawesome/free-solid-svg-icons";
import { auth } from "../lib/firebase";
import { GoogleAuthProvider, signInWithPopup, signOut, type User } from "firebase/auth";

type Props = {
  user: User | null;
};

async function login() {
  const provider = new GoogleAuthProvider();
  await signInWithPopup(auth, provider);
}

async function logout() {
  await signOut(auth);
}

export function AuthButton({ user }: Readonly<Props>) {
  if (user) {
    return (
      <motion.button
        whileHover={{ scale: 1.03 }}
        whileTap={{ scale: 0.97 }}
        onClick={logout}
        className="flex items-center gap-2 rounded-full border border-seal/40 bg-seal/10 px-4 py-2 text-sm font-medium text-seal-light transition-colors hover:bg-seal/20"
      >
        <FontAwesomeIcon icon={faRightFromBracket} className="size-3.5" />
        Sair
      </motion.button>
    );
  }

  return (
    <motion.button
      whileHover={{ scale: 1.03 }}
      whileTap={{ scale: 0.97 }}
      onClick={login}
      className="flex items-center gap-2 rounded-full bg-parchment px-4 py-2 text-sm font-medium text-ink shadow-sm transition-colors hover:bg-gold-light"
    >
      <FontAwesomeIcon icon={faGoogle} className="size-3.5" />
      Entrar com Google
    </motion.button>
  );
}
