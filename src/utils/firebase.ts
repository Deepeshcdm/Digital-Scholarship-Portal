// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBNOI6vCzNN5JY52eGPvHqsnNvy3JDxKw4",
  authDomain: "digital-scholarship-port-4e362.firebaseapp.com",
  projectId: "digital-scholarship-port-4e362",
  storageBucket: "digital-scholarship-port-4e362.firebasestorage.app",
  messagingSenderId: "853781759924",
  appId: "1:853781759924:web:ef62bf0da4770df047d4e1"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

export default app;