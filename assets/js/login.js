// login.js

// Importa las funciones necesarias desde Firebase
import { auth, GoogleAuthProvider, signInWithPopup, signInWithEmailAndPassword } from './firebaseKey.js';  // Asegúrate de que el path sea correcto

// Funcionalidad para el login con Google
document.addEventListener("DOMContentLoaded", function () {
    const googleLoginBtn = document.getElementById("google-login");

    // Añadimos un evento de clic para el botón de login con Google
    googleLoginBtn.addEventListener("click", function (event) {
        event.preventDefault();  // Prevenimos que el formulario se envíe automáticamente

        // Creamos un nuevo proveedor de Google
        const provider = new GoogleAuthProvider();

        // Iniciamos el inicio de sesión con el proveedor de Google utilizando el popup
        signInWithPopup(auth, provider)
            .then((result) => {
                // El usuario ha iniciado sesión correctamente
                const user = result.user;
                console.log("Usuario autenticado con Google:", user);

                // Redirigimos al usuario a otra página después de un login exitoso
                window.location.href = "/dashboard.html";  // Puedes cambiar la URL a la que desees redirigir
            })
            .catch((error) => {
                // Manejo de errores
                const errorMessage = error.message;
                console.error("Error al iniciar sesión con Google:", errorMessage);
                alert("Error al iniciar sesión con Google: " + errorMessage);  // Muestra un mensaje de error
            });
    });

    // Si tienes otros manejadores de eventos o lógica para el formulario de login, añádelos aquí

    // Ejemplo de cómo manejar el formulario de login tradicional con correo y contraseña
    const form = document.querySelector("form");  // Asegúrate de que el selector del formulario sea correcto
    form.addEventListener("submit", function (event) {
        event.preventDefault();

        const email = document.getElementById("exampleDropdownFormEmail2").value;
        const password = document.getElementById("exampleDropdownFormPassword2").value;

        // Llamar a Firebase Auth para iniciar sesión con email y contraseña
        signInWithEmailAndPassword(auth, email, password)
            .then((userCredential) => {
                // El usuario ha iniciado sesión correctamente
                const user = userCredential.user;
                console.log("Usuario autenticado:", user);

                // Redirigir a otra página después del login
                window.location.href = "/dashboard.html";  // Cambia la URL según tu página de destino
            })
            .catch((error) => {
                // Manejo de errores al intentar iniciar sesión con correo y contraseña
                const errorMessage = error.message;
                console.error("Error al iniciar sesión:", errorMessage);
                alert("Error al iniciar sesión: " + errorMessage);
            });
    });
});