import { initializeApp } from "firebase/app";
import { getFirestore, initializeFirestore, persistentLocalCache, persistentMultipleTabManager } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyD5bn-qzFwKQScQW3Xq5SmA717Mt-9J7-g",
  authDomain: "swimdq-35596.firebaseapp.com",
  projectId: "swimdq-35596",
  storageBucket: "swimdq-35596.firebasestorage.app",
  messagingSenderId: "989686834542",
  appId: "1:989686834542:web:3146cc7b04c90509c18d7f",
  measurementId: "G-28GL4F8MHB"
};

const app = initializeApp(firebaseConfig);
export const db = initializeFirestore(app, {
  experimentalForceLongPolling: true
});