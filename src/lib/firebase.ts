import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyDFwhQ9X9bCM3GxtaS0PWa3qdae3idMxuE",
  authDomain: "neofix-676da.firebaseapp.com",
  databaseURL: "https://neofix-676da-default-rtdb.firebaseio.com",
  projectId: "neofix-676da",
  storageBucket: "neofix-676da.firebasestorage.app",
  messagingSenderId: "186891137448",
  appId: "1:186891137448:web:d8b6388e829e0a964fed9d",
  measurementId: "G-8D819P5JP2"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Auth
export const auth = getAuth(app);

// Initialize Google Auth Provider
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account'
});

export default app;