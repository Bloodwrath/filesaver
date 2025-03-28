// 🔹 Inicializar Firebase
import { getAuth, onAuthStateChanged, signOut, signInWithEmailAndPassword, signInWithPopup, GoogleAuthProvider } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-auth.js";
import { app } from "./firebaseKey.js";

// 🔹 Función principal que se ejecuta al cargar el DOM
document.addEventListener("DOMContentLoaded", function () {
    const header = document.getElementById("header");
    const auth = getAuth(app);

    // 🔹 Actualizar el header según el estado de autenticación
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
                                .then(() => {
                                    console.log("Usuario cerró sesión.");
                                    location.reload();
                                })
                                .catch((error) => console.error("Error al cerrar sesión:", error));
                        });
                    } else {
                        console.error("El botón de logout no se encontró en header2.html.");
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

    // 🔹 Manejo del formulario de login
    const loginButton = document.getElementById("INICIAR SESION");
    const googleLoginButton = document.getElementById("google-login");
    const emailInput = document.getElementById("email");
    const passwordInput = document.getElementById("password");

    if (!loginButton || !googleLoginButton || !emailInput || !passwordInput) {
        console.error("Error: No se encontraron los elementos del formulario de login.");
        return;
    }

    const provider = new GoogleAuthProvider();

    // 🔹 Login con correo y contraseña
    loginButton.addEventListener("click", function (event) {
        event.preventDefault();

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
                window.location.href = "index.html";
            })
            .catch((error) => {
                console.error("Error en el inicio de sesión:", error.message);
                alert("Error: " + error.message);
            });
    });

    // 🔹 Login con Google
    googleLoginButton.addEventListener("click", function (event) {
        event.preventDefault();

        signInWithPopup(auth, provider)
            .then((result) => {
                console.log("Usuario autenticado con Google:", result.user);
                alert("Inicio de sesión con Google exitoso.");
                window.location.href = "index.html";
            })
            .catch((error) => {
                console.error("Error en el login con Google:", error.message);
                alert("Error: " + error.message);
            });
    });
});

