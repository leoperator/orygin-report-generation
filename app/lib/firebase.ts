import { initializeApp, getApps, getApp, FirebaseApp } from "firebase/app";
import { getFirestore, Firestore } from "firebase/firestore";

const firebaseConfigString = process.env.NEXT_PUBLIC_FIREBASE_CONFIG;

if (!firebaseConfigString) {
  throw new Error("Firebase config not found in environment variables. Please check your .env.local file.");
}

const firebaseConfig = JSON.parse(firebaseConfigString);

// A more robust way to initialize Firebase, especially for server-side code.
// This ensures we don't re-initialize the app unnecessarily.
let app: FirebaseApp;
let db: Firestore;

if (getApps().length === 0) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApp();
}

db = getFirestore(app);

export { db };