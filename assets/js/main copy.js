import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-auth.js";
import { app } from "./firebaseKey.js";

// 🔹 Función para actualizar el header

function inicializarAuth() {
    const auth = getAuth(app);


    // Detectar si el usuario está autenticado en Firebase
    onAuthStateChanged(auth, (user) => {
        if (user) {
            const idheader = document.getElementById("header");
            idheader.id = "header2";
            fetch("header2.html")
                .then(response => response.text())
                .then(data => {
                    document.getElementById("header2").innerHTML = data;
                    inicializarAuth(); // Si hay usuario, actualizar el header
                });
        } else {
            const idheader = document.getElementById("header2");
            idheader.id = "header";
            fetch("header.html")
                .then(response => response.text())
                .then(data => {
                    document.getElementById("header").innerHTML = data;
                    inicializarAuth();
                });
        }
    });
}

function verificarYActualizarHeader() {
    const auth = getAuth(app);

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
}