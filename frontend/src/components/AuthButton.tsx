import { auth } from "../lib/firebase";
import { GoogleAuthProvider, signInWithPopup, signOut, type User } from "firebase/auth";

type Props = {
  user: User | null; // Use o tipo real aqui
};

export function AuthButton({ user }: Props) {
  async function login() {
    const provider = new GoogleAuthProvider();
    await signInWithPopup(auth, provider);
  }

  async function logout() {
    await signOut(auth);
  }

  return user ? (
    <button
      onClick={logout}
      className="px-4 py-2 rounded-xl bg-red-500 text-white text-sm"
    >
      Sair
    </button>
  ) : (
    <button
      onClick={login}
      className="px-4 py-2 rounded-xl bg-white text-black text-sm"
    >
      Entrar com Google
    </button>
  );
}
