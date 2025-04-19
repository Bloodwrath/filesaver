// 🔹 Inicializar Firebase
import {
    getAuth,
    onAuthStateChanged,
    signOut,
    signInWithEmailAndPassword,
    signInWithPopup,
    GoogleAuthProvider
} from "https://www.gstatic.com/firebasejs/9.6.1/firebase-auth.js";
import {
    getFirestore,
    collection,
    query,
    where,
    getDocs
} from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js";

import { app } from "./firebaseKey.js";

// 🔹 Función principal que se ejecuta al cargar el DOM
document.addEventListener("DOMContentLoaded", function () {
    const header = document.getElementById("header");
    const auth = getAuth(app);

    const observer = new MutationObserver(() => {
        const loginButton = document.getElementById("INICIAR SESION");
        const googleLoginButton = document.getElementById("google-login");
        const emailInput = document.getElementById("email");
        const passwordInput = document.getElementById("password");

        if (loginButton && googleLoginButton && emailInput && passwordInput) {
            observer.disconnect();
            initializeLoginEvents(loginButton, googleLoginButton, emailInput, passwordInput);
        }
    });

    observer.observe(header, { childList: true, subtree: true });

    onAuthStateChanged(auth, (user) => {
        if (user) {
            header.id = "header2";
            fetch("header2.html")
                .then(response => response.text())
                .then(data => {
                    document.getElementById("header2").innerHTML = data;
                    const usernameElement = document.getElementById("username");
                    if (usernameElement) {
                        usernameElement.textContent = user.displayName || user.email;
                    }

                    const logoutButton = document.getElementById("logout");
                    if (logoutButton) {
                        logoutButton.addEventListener("click", function () {
                            signOut(auth)
                                .then(() => mensajeDeExitoR(""))
                                .catch((error) => console.error("Error al cerrar sesión:", error));
                        });
                    }
                })
                .catch(error => console.error("Error al cargar header2.html:", error));
        } else {
            fetch("header.html")
                .then(response => response.text())
                .then(data => {
                    header.innerHTML = data;
                })
                .catch(error => console.error("Error al cargar header.html:", error));
        }
    });
});

// 🔹 Función para inicializar eventos de login
function initializeLoginEvents(loginButton, googleLoginButton, emailInput, passwordInput) {
    const auth = getAuth(app);
    const db = getFirestore(app);
    const provider = new GoogleAuthProvider();

    // 🔹 Login con correo y contraseña
    loginButton.addEventListener("click", async function (event) {
        event.preventDefault();

        const email = emailInput.value;
        const password = passwordInput.value;

        if (!email || !password) {
            mensajeAdvertencia("Por favor, ingresa tu correo y contraseña.");
            return;
        }

        try {
            mostrarPantallaDeCarga(); // 🌀

            const usersRef = collection(db, "USUARIOS");
            const q = query(usersRef, where("email", "==", email));
            const querySnapshot = await getDocs(q);

            if (querySnapshot.empty) {
                ocultarPantallaDeCarga(); // 🛑
                mensajeErrorR("El correo no está registrado. Regístrate primero.", "registro.html");
                return;
            }

            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            console.log("Usuario autenticado:", userCredential.user);
            ocultarPantallaDeCarga();
            mensajeDeExitoR("Inicio de sesión exitoso.");

        } catch (error) {
            ocultarPantallaDeCarga();
            console.error("Error:", error.message);
            mensajeErrorR("Error: " + error.message, "index.html");
        }
    });

    // 🔹 Login con Google
    googleLoginButton.addEventListener("click", async function (event) {
        event.preventDefault();

        try {
            mostrarPantallaDeCarga();

            const result = await signInWithPopup(auth, provider);
            const user = result.user;

            const usersRef = collection(db, "USUARIOS");
            const q = query(usersRef, where("email", "==", user.email));
            const querySnapshot = await getDocs(q);

            if (querySnapshot.empty) {
                await signOut(auth);
                ocultarPantallaDeCarga();
                mensajeErrorR("El correo no está registrado. Regístrate primero.", "registro.html");
                return;
            }

            console.log("Usuario autenticado con Google:", user);
            ocultarPantallaDeCarga();
            mensajeDeExitoR("Inicio de sesión exitoso.");

        } catch (error) {
            console.error("Error en el login con Google:", error.message);
            ocultarPantallaDeCarga();
            mensajeAdvertencia("Error: " + error.message);
        }
    });
}

// 🔹 Loader UI
function mostrarPantallaDeCarga() {
    const pantalla = document.getElementById("pantalla-cargando");
    if (pantalla) pantalla.style.display = "flex";
}

function ocultarPantallaDeCarga() {
    const pantalla = document.getElementById("pantalla-cargando");
    if (pantalla) pantalla.style.display = "none";
}
