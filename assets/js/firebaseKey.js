// firebaseKey.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.1.2/firebase-app.js";
import { getAuth, GoogleAuthProvider, signInWithPopup } from "https://www.gstatic.com/firebasejs/9.1.2/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyDjQskrX2aCrvexZmv0he6C6WeVOxkd-EU",
  authDomain: "organizador-3e655.firebaseapp.com",
  projectId: "organizador-3e655",
  storageBucket: "organizador-3e655.firebasestorage.app",
  messagingSenderId: "338275772764",
  appId: "1:338275772764:web:c7962904d1f990867a3999",
  measurementId: "G-7GMHTZYQLD"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

export { auth, GoogleAuthProvider, signInWithPopup };
