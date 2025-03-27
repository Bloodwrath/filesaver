import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-auth.js";
import { app } from "./firebaseKey.js";

document.addEventListener("DOMContentLoaded", function () {
    fetch("header.html")
        .then(response => response.text())
        .then(data => {
            document.getElementById("header").innerHTML = data;
            inicializarAuth(); // Llamamos la autenticación después de cargar el header
        })
        .catch(error => console.error("Error al cargar el header:", error));
});

function inicializarAuth() {
    const auth = getAuth(app);

    // Detectar si el usuario está autenticado en Firebase
    onAuthStateChanged(auth, (user) => {
        if (user) {
            console.log("Usuario autenticado:", user);
            actualizarHeader(user); // Si hay usuario, actualizar el header
        } else {
            console.log("Usuario no autenticado.");
        }
    });
}

// 🔹 Función para actualizar el header con los datos del usuario autenticado
function actualizarHeader(user) {
    const headerContainer = document.getElementById("header");

    if (headerContainer) {
        headerContainer.innerHTML = `
    <div class="container">
        <div class="d-flex flex-wrap align-items-center justify-content-center justify-content-lg-start">
            <a href="/" class="d-flex">
                <img class="logotipo" src="assets/img/LOGO.png">
            </a>

            <ul id="cabecera" class="nav col-12 col-lg-auto active me-lg-auto mb-2 justify-content-center mb-md-0">
                <li><a href="index.html" class="nav-link px-2 text-white">Home</a></li>
                <li><a href="#" class="nav-link px-2 text-white">Features</a></li>
                <li><a href="#" class="nav-link px-2 text-white">Pricing</a></li>
                <li><a href="#" class="nav-link px-2 text-white">FAQs</a></li>
                <li><a href="#" class="nav-link px-2 text-white">About</a></li>
            </ul>
            <div>
                        <span>Bienvenido, ${user.displayName || user.email}</span>
                        <button id="logout" class="btn btn-danger">Cerrar Sesión</button>
                    </div>
        // Agregar funcionalidad al botón de cierre de sesión
        document.getElementById("logout").addEventListener("click", function () {
            signOut(getAuth())
                .then(() => {
                    console.log("Usuario cerró sesión.");
                    location.reload(); // Recargar la página para mostrar el header original
                })
                .catch((error) => console.error("Error al cerrar sesión:", error));
        });
    }
}
