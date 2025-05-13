// src/firebase/firebase.ts
import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyAaVx-4bNG99wX-VkXx9qI7CBkPmTr50xY",
  authDomain: "lexio-firebase.firebaseapp.com",
  projectId: "lexio-firebase",
  storageBucket: "lexio-firebase.firebasestorage.app",
  messagingSenderId: "199850194972",
  appId: "1:199850194972:web:42a2ee2beee60fb90cc7d9",
  measurementId: "G-REZ12RZXZE",
  databaseURL: "https://lexio-firebase-default-rtdb.asia-southeast1.firebasedatabase.app",
};

const app = initializeApp(firebaseConfig);
export const db = getDatabase(app);
