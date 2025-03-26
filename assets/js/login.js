import { app } from "./firebaseKey.js";
import { getAuth, signInWithEmailAndPassword, signInWithPopup, GoogleAuthProvider } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-auth.js";

document.addEventListener("DOMContentLoaded", function () {
    console.log("Login.js cargado correctamente.");

    // Esperar a que el header se cargue antes de obtener los elementos
    setTimeout(() => {
        const loginButton = document.getElementById("INICIAR SESION");
        const googleLoginButton = document.getElementById("google-login");
        const emailInput = document.getElementById("email"); // 🔹 Cambio de ID aquí
        const passwordInput = document.getElementById("password");

        if (!loginButton || !googleLoginButton || !emailInput || !passwordInput) {
            console.error("Error: No se encontraron los elementos del formulario de login.");
            return;
        }

        const auth = getAuth(app);
        const provider = new GoogleAuthProvider();

        // 🔹 Login con correo y contraseña
        loginButton.addEventListener("click", function (event) {
            event.preventDefault(); // Evita que el formulario se recargue

            const email = emailInput.value;
            const password = passwordInput.value;

            if (!email || !password) {
                alert("Por favor, ingresa tu correo y contraseña.");
                return;
            }

            signInWithEmailAndPassword(auth, email, password)
                .then((userCredential) => {
                    console.log("Usuario autenticado:", userCredential.user);
                    alert("Inicio de sesión exitoso.");
                    window.location.href = "index.html"; // Redirigir después del login
                })
                .catch((error) => {
                    console.error("Error en el inicio de sesión:", error.message);
                    alert("Error: " + error.message);
                });
        });

        // 🔹 Login con Google
        document.addEventListener("click", function (event) {
            if (event.target.id === "google-login") {
                event.preventDefault();

                const auth = getAuth(app);
                const provider = new GoogleAuthProvider();

                signInWithPopup(auth, provider)
                    .then((result) => {
                        console.log("Usuario autenticado con Google:", result.user);
                        alert("Inicio de sesión con Google exitoso.");
                        window.location.href = "index.html"; // 🔹 Redirige automáticamente a index.html
                    })
                    .catch((error) => {
                        console.error("Error en el login con Google:", error.message);
                        alert("Error: " + error.message);
                    });
            }
        });


    }, 500); // Se da un pequeño retraso para que el header cargue correctamente
});
