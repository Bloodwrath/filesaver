function actualizarEstiloDropup() {
    const grupo = document.getElementById("menuLoginGrupo");

    if (!grupo) return;

    if (window.innerWidth > 1138) {
        grupo.classList.remove("dropup");
        grupo.classList.add("dropdown");
    } else {
        grupo.classList.remove("dropdown");
        grupo.classList.add("dropup");
    }
}

window.addEventListener("DOMContentLoaded", actualizarEstiloDropup);
window.addEventListener("resize", actualizarEstiloDropup);