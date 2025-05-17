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

            // Mostrar recordatorios pendientes y de la semana al loguearse
            mostrarRecordatoriosAgendaUsuario(user.email);
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

// --- Mostrar recordatorios pendientes y de la semana en index ---
async function mostrarRecordatoriosAgendaUsuario(email) {
    const db = getFirestore(app);
    const agendaCol = collection(db, "agenda");
    const q = query(agendaCol, where("user", "==", email));
    const snapshot = await getDocs(q);
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0);
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);

    let tasks = [];
    snapshot.forEach(doc => {
        const data = doc.data();
        if (data.type === "task") tasks.push(data);
    });

    const pendientes = tasks.filter(task =>
        task.reminder &&
        new Date(task.start) <= now &&
        !localStorage.getItem("recordatorio_eliminado_" + task.id)
    );
    const semana = tasks.filter(task =>
        task.reminder &&
        new Date(task.start) > now &&
        new Date(task.start) >= startOfWeek &&
        new Date(task.start) <= endOfWeek &&
        !localStorage.getItem("recordatorio_eliminado_" + task.id)
    );

    if (pendientes.length === 0 && semana.length === 0) return;

    let html = '';
    if (pendientes.length > 0) {
        html += '<b>Tareas pendientes:</b><ul style="list-style:none;padding:0;">';
        pendientes.forEach(task => {
            html += `
                <li style="margin-bottom:10px;">
                    <b>${task.title}</b><br>
                    <span>Hora: ${new Date(task.start).toLocaleString()}</span><br>
                    <button class="btn btn-sm btn-danger" data-taskid="${task.id}">Eliminar recordatorio</button>
                </li>
            `;
        });
        html += '</ul>';
    }
    if (semana.length > 0) {
        html += '<b>Recordatorios de esta semana:</b><ul style="list-style:none;padding:0;">';
        semana.forEach(task => {
            html += `
                <li style="margin-bottom:10px;">
                    <b>${task.title}</b><br>
                    <span>Hora: ${new Date(task.start).toLocaleString()}</span><br>
                    <button class="btn btn-sm btn-danger" data-taskid="${task.id}">Eliminar recordatorio</button>
                </li>
            `;
        });
        html += '</ul>';
    }

    Swal.fire({
        title: 'Recordatorios',
        html: html,
        icon: 'info',
        showConfirmButton: true,
        confirmButtonText: 'Cerrar',
        didOpen: () => {
            document.querySelectorAll('button[data-taskid]').forEach(btn => {
                btn.addEventListener('click', function (e) {
                    e.stopPropagation();
                    const taskId = this.getAttribute('data-taskid');
                    localStorage.setItem("recordatorio_eliminado_" + taskId, "1");
                    this.parentElement.style.display = "none";
                });
            });
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
