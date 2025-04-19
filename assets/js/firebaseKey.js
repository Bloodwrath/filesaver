// Importamos Firebase correctamente
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-app.js";

// Configuración de Firebase
const firebaseConfig = {
  apiKey: "AIzaSyDjQskrX2aCrvexZmv0he6C6WeVOxkd-EU",
  authDomain: "organizador-3e655.firebaseapp.com",
  projectId: "organizador-3e655",
  storageBucket: "organizador-3e655.firebasestorage.app",
  messagingSenderId: "338275772764",
  appId: "1:338275772764:web:c7962904d1f990867a3999",
  measurementId: "G-7GMHTZYQLD"
};

// Inicializamos Firebase
const app = initializeApp(firebaseConfig);

// Exportamos la instancia de Firebase correctamente
export { app };
