import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-auth.js";
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
                    document.getElementById("logout").addEventListener("click", function () {
                        signOut(getAuth())
                            .then(() => {
                                console.log("Usuario cerró sesión.");
                                location.reload(); // Recargar la página para mostrar el header original
                            })
                            .catch((error) => console.error("Error al cerrar sesión:", error));
                    });
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
// 🔹 Función para verificar si el usuario está autenticado y actualizar el header
