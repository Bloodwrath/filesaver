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

// 🔹 Dar funcionalidad a boton logout
document.getElementById("logout").addEventListener("click", function () {
    signOut(getAuth())
        .then(() => {
            console.log("Usuario cerró sesión.");
            location.reload(); // Recargar la página para mostrar el header original
        })
        .catch((error) => console.error("Error al cerrar sesión:", error));
});

function actualizarHeader(user) {
    const header = document.getElementById("header");
    if (user) {
        header.id = "header2"; // Cambiar el id a "header2" si el usuario está autenticado
    } else {
        header.id = "header"; // Cambiar el id de vuelta a "header" si no hay usuario
    }
}