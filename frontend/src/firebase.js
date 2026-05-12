import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyBPIWdySKvIuYO2xA9ZikiFittzvdaDw1A",
  authDomain: "zemo-e682f.firebaseapp.com",
  projectId: "zemo-e682f",
  storageBucket: "zemo-e682f.firebasestorage.app",
  messagingSenderId: "536388959945",
  appId: "1:536388959945:web:9abc2c5a8d413016765718",
  measurementId: "G-J8KJ7YJG4W"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const provider = new GoogleAuthProvider();