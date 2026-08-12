import "dotenv/config";
import { initializeApp, applicationDefault, getApps } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import { getStorage } from "firebase-admin/storage";

if (getApps().length === 0) {
  initializeApp({
    credential: applicationDefault(),
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  });
}

export function adminAuth() {
  return getAuth();
}

export function adminDb() {
  return getFirestore();
}

export function adminBucket() {
  return getStorage().bucket();
}

/**
 * initializeApp() nunca falha sozinho, mesmo sem NENHUMA credencial
 * configurada — o erro real só aparece na primeira chamada de verdade
 * (verifyIdToken, Firestore, Storage), disfarçado de erro genérico.
 * Essa função reconhece essas mensagens e devolve um aviso claro,
 * em vez de deixar o usuário achar que é um problema de token/rede.
 */
export function describeAdminError(err: unknown): { configIssue: boolean; message: string } {
  const raw = err instanceof Error ? err.message : String(err);
  const isConfigIssue =
    /Unable to detect a Project Id|Could not load the default credentials|GOOGLE_APPLICATION_CREDENTIALS|Unable to read the credential file/i.test(
      raw,
    );

  if (isConfigIssue) {
    return {
      configIssue: true,
      message:
        "Firebase Admin não está configurado no servidor. Defina GOOGLE_APPLICATION_CREDENTIALS no backend/.env (veja backend/.env.example).",
    };
  }

  return { configIssue: false, message: raw };
}
