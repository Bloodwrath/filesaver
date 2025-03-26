document.addEventListener("DOMContentLoaded", function () {
    const headerDiv = document.getElementById("header");
    if (headerDiv) {
        fetch("header.html")
            .then(response => {
                if (!response.ok) {
                    throw new Error("Error al cargar el header.");
                }
                return response.text();
            })
            .then(data => {
                headerDiv.innerHTML = data;
            })
            .catch(error => console.error("Error:", error));
    } else {
        console.error("El div con id 'header' no se encuentra en el documento.");
    }
});
