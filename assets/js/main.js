document.addEventListener("DOMContentLoaded", function () {
    // ** Cargar el contenido del header **
    fetch("header.html")
        .then(response => {
            if (!response.ok) {
                throw new Error("Error al cargar el header.");
            }
            return response.text();
        })
        .then(data => {
            document.getElementById("header").innerHTML = data;
        })
        .catch(error => console.error("Error al cargar el header:", error));

    // ** 1. Manejo del formulario de login con correo y contraseña **
    const form = document.querySelector("form");  // Asegúrate de que el selector sea correcto
    form.addEventListener("submit", function (event) {
        event.preventDefault();

        const email = document.getElementById("exampleDropdownFormEmail2").value;
        const password = document.getElementById("exampleDropdownFormPassword2").value;

        // Validar que los campos no estén vacíos
        if (email === "" || password === "") {
            alert("Por favor, ingrese su correo y contraseña.");
            return;  // Evitar que el formulario se envíe si faltan campos
        }

        // Iniciar sesión con Firebase Authentication usando correo y contraseña
        firebase.auth().signInWithEmailAndPassword(email, password)
            .then((userCredential) => {
                const user = userCredential.user;
                console.log("Usuario autenticado:", user);

                // Redirigir al usuario a otra página después del login
                window.location.href = "/dashboard.html";  // Cambia la URL de redirección según tus necesidades
            })
            .catch((error) => {
                const errorMessage = error.message;
                console.error("Error al iniciar sesión:", errorMessage);
                alert("Error al iniciar sesión: " + errorMessage);
            });
    });

    // ** 2. Iniciar sesión con Google **
    const googleLoginBtn = document.getElementById("google-login");

    googleLoginBtn.addEventListener("click", function (event) {
        event.preventDefault();  // Evita que el formulario se envíe al hacer clic en el botón de Google

        // Crear un proveedor de Google para la autenticación
        const provider = new firebase.auth.GoogleAuthProvider();

        // Iniciar sesión con Google usando un popup
        firebase.auth().signInWithPopup(provider)
            .then((result) => {
                const user = result.user;
                console.log("Usuario autenticado con Google:", user);

                // Redirigir al usuario después de un login exitoso
                window.location.href = "/dashboard.html";  // Cambia la URL según donde quieras redirigir al usuario
            })
            .catch((error) => {
                const errorMessage = error.message;
                console.error("Error al iniciar sesión con Google:", errorMessage);
                alert("Error al iniciar sesión con Google: " + errorMessage);
            });
    });
});
