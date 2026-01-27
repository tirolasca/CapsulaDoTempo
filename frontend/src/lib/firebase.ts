import { initializeApp } from "firebase/app";
import { getStorage } from "firebase/storage";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
 apiKey: "AIzaSyDA0UGbHoppq34DRCJwDYW249LQdrOOh7c",
  authDomain: "capsuladotempo-e2ed2.firebaseapp.com",
  projectId: "capsuladotempo-e2ed2",
  storageBucket: "capsuladotempo-e2ed2.firebasestorage.app",
  messagingSenderId: "155874546908",
  appId: "1:155874546908:web:caf5049b6d9cbbdded5019",
  measurementId: "G-V060L64EGS"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);