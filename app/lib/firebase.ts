// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDY_cyuMOlNQk4dSWMTClmHJuF-qOwxHtc",
  authDomain: "stock-controller-8b62d.firebaseapp.com",
  projectId: "stock-controller-8b62d",
  storageBucket: "stock-controller-8b62d.firebasestorage.app",
  messagingSenderId: "1080293816959",
  appId: "1:1080293816959:web:0da4728d276a60d0fa1d4a",
  measurementId: "G-QBEECK0NEC"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export { app, db };