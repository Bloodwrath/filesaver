document.addEventListener("DOMContentLoaded", function () {
    // Tu código de fetch para cargar el header
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
        .catch(error => console.error("Error:", error));

    // Aquí va el código para la autenticación de Firebase
    document.getElementById("login-form").addEventListener("submit", function (event) {
        event.preventDefault();

        const email = document.getElementById("email").value;
        const password = document.getElementById("password").value;

        signInWithEmailAndPassword(auth, email, password)
            .then((userCredential) => {
                const user = userCredential.user;
                console.log("Usuario autenticado:", user);
                window.location.href = "/dashboard.html";  // Redirigir al dashboard
            })
            .catch((error) => {
                const errorMessage = error.message;
                alert("Error al iniciar sesión: " + errorMessage);
            });
    });

    // Código de login con Google
    document.getElementById("google-login").addEventListener("click", function (event) {
        event.preventDefault();

        const provider = new GoogleAuthProvider();
        signInWithPopup(auth, provider)
            .then((result) => {
                const user = result.user;
                console.log("Usuario autenticado con Google:", user);
                window.location.href = "/dashboard.html";  // Redirigir al dashboard
            })
            .catch((error) => {
                const errorMessage = error.message;
                alert("Error al iniciar sesión con Google: " + errorMessage);
            });
    });
});
