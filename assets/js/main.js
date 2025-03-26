document.addEventListener("DOMContentLoaded", function () {
    fetch("header.html")
        .then(response => response.text())
        .then(data => {
            document.getElementById("header").innerHTML = data;
            inicializarLogin(); // Llamar la función cuando el header ya está en el DOM
        })
        .catch(error => console.error("Error al cargar el header:", error));
});

function inicializarLogin() {
    const emailInput = document.getElementById("email");
    const passwordInput = document.getElementById("password");

    if (emailInput && passwordInput) {
        console.log("Inputs de login encontrados.");
        emailInput.addEventListener("input", () => console.log(emailInput.value));
        passwordInput.addEventListener("input", () => console.log(passwordInput.value));
    } else {
        console.error("No se encontraron los campos de email y contraseña.");
    }
}