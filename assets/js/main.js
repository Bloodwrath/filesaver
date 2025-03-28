// 🔹 Inicializar Firebase
import { getAuth, onAuthStateChanged, signOut, signInWithEmailAndPassword, signInWithPopup, GoogleAuthProvider } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-auth.js";
import { app } from "./firebaseKey.js";

// 🔹 Función para actualizar el header con los datos del usuario autenticado
document.addEventListener("DOMContentLoaded", function () {
    const header = document.getElementById("header");
    if (!header) {
        console.error("El elemento con id 'header' no existe.");
        return;
    }

    const auth = getAuth(app);
    onAuthStateChanged(auth, (user) => {
        if (user) {
            header.id = "header2";
            fetch("header2.html")
                .then(response => response.text())
                .then(data => {
                    document.getElementById("header2").innerHTML = data;

                    // Agregar el evento al botón logout después de cargar el contenido
                    const logoutButton = document.getElementById("logout");
                    if (logoutButton) {
                        logoutButton.addEventListener("click", function () {
                            signOut(auth)
                                .then(() => {
                                    console.log("Usuario cerró sesión.");
                                    location.reload(); // Recargar la página para mostrar el header original
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
});

document.addEventListener("DOMContentLoaded", function () {

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

// 🔹 Mostrar el nombre del usuario autenticado
const auth = getAuth();

onAuthStateChanged(auth, (user) => {
    const usernameElement = document.getElementById("username");
    if (user) {
        // Si el usuario está autenticado, muestra su nombre o correo
        usernameElement.textContent = user.displayName || user.email;
    } else {
        // Si no hay usuario autenticado, redirige al login o muestra un mensaje
        usernameElement.textContent = "Invitado";
    }
});

