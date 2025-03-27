import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-auth.js";
import { app } from "./firebaseKey.js";



// 🔹 Función para actualizar el header con los datos del usuario autenticado
document.addEventListener("DOMContentLoaded", function () {
    const auth = getAuth(app);

    // Listener que detecta cambios en el estado de autenticación
    onAuthStateChanged(auth, (user) => {
        if (user) {
            const header = document.getElementById("header");
            if (header) {
                header.id = "header2";
                fetch("header2.html")
                    .then(response => response.text())
                    .then(data => {
                        document.getElementById("header2").innerHTML = data;
                    });
                document.getElementById("logout").addEventListener("click", function () {
                    signOut(getAuth())
                        .then(() => {
                            console.log("Usuario cerró sesión.");
                            location.reload(); // Recargar la página para mostrar el header original
                        })
                        .catch((error) => console.error("Error al cerrar sesión:", error));
                });
            }
        } else {
            const header2 = document.getElementById("header2");
            if (header2) {
                header2.id = "header";
                fetch("header.html")
                    .then(response => response.text())
                    .then(data => {
                        document.getElementById("header").innerHTML = data;
                    });
            }
        }
    });
});