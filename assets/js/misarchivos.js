//1.37.2024
//2.0.0
// Importar Firebase
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-auth.js";
import { getFirestore, collection, query, where, getDocs } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js";
import { app } from "./firebaseKey.js";

// 🔹 Inicializar Firebase
const auth = getAuth(app);
export const db = getFirestore(app); // Inicializa Firestore Database

let currentUser = null;

// 🔹 Verificar si el usuario está autenticado
document.addEventListener("DOMContentLoaded", () => {
    onAuthStateChanged(auth, async (user) => {
        if (user) {
            console.log("Usuario autenticado:", user.email);
            currentUser = user; // Guardar el usuario autenticado
            await mostrarArchivos(); // Mostrar archivos cuando se carga la página
        } else {
            console.warn("No hay un usuario autenticado. Redirigiendo a la página de inicio de sesión...");
            alert("Debes iniciar sesión para subir una póliza o ver tus archivos.");
            window.location.href = "index.html"; // Redirigir a la página de inicio de sesión
        }
    });
});

// 🔹 Función para mostrar los archivos del usuario autenticado y permitir la descarga
async function mostrarArchivos() {
    if (!currentUser) {
        alert("Debes iniciar sesión para ver tus archivos.");
        return;
    }

    try {
        const polizasRef = collection(db, "polizas");
        const consulta = query(polizasRef, where("usuario", "==", currentUser.email));
        const querySnapshot = await getDocs(consulta);

        if (querySnapshot.empty) {
            alert("No se encontraron archivos para este usuario.");
            return;
        }

        let listaArchivosHTML = `
            <h3>Tus archivos:</h3>
            <div class="table-responsive">
            <table class="table table-hover table-secondary">
                    
            <thead>
                <tr class="table-dark">

                    <th>Póliza</th>
                    <th>Aseguradora</th>
                            <th>Fecha</th>
                            <th>Acción</th>
                        </tr>
                    </thead>
                    <tbody>`;

        querySnapshot.forEach((doc) => {
            const datos = doc.data();
            const base64Archivo = datos.urlArchivo;
            const aseguradora = datos.aseguradora;
            const poliza = datos.poliza;
            const serie = datos.NIV;

            listaArchivosHTML += `
                <tr>
                    <td>${aseguradora}</td>
                    <td>${poliza}</td>
                    <td>${serie}</td>
                    <td>
                        <a class="btn btn-primary" href="data:application/pdf;base64,${base64Archivo}" download="poliza_${poliza}.pdf">
                            Descargar PDF
                        </a>
                    </td>
                </tr>
            `;
        });

        listaArchivosHTML += '</tbody></table></div>';

        document.getElementById("tablaPolizas").innerHTML = listaArchivosHTML;
    } catch (error) {
        alert("Hubo un error al obtener tus archivos. Por favor, inténtalo de nuevo.");
        console.error(error);
    }
}
