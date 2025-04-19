//1.374.2024
//2.0.0
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
            mostrarPolizas();
        } else {
            console.warn("No hay un usuario autenticado. Redirigiendo a la página de inicio de sesión...");
            mensajeErrorR("Debes iniciar sesión para subir una póliza o ver tus archivos.", "index.html");
        }
    });
});

async function mostrarPolizas() {
    if (!currentUser) {
        return;
    }

    const opcionValue = document.getElementById("opcion").value;
    const filtradorValue = document.getElementById("filtrador").value.toUpperCase().trim(); // Obtener valor del input y quitar espacios

    const polizasRef = collection(db, "polizas");
    let consulta = query(polizasRef); // Consulta base
    let campoFiltro = "";

    // Aplicar filtro si se seleccionó una opción y se ingresó texto
    if (filtradorValue && opcionValue !== 'Choose...') {

        switch (opcionValue) {
            case "1": campoFiltro = "aseguradora"; break;
            case "2": campoFiltro = "poliza"; break;
            case "3": campoFiltro = "NIV"; break;
            case "4": campoFiltro = "nombreAsegurado"; break;
            case "5": campoFiltro = "finVigencia"; break;
            case "6": campoFiltro = "inicioVigencia"; break;
            case "7": campoFiltro = "ruta"; break;
            case "8": campoFiltro = "economico"; break;
            default:
                console.warn("Opción inválida:", opcionValue);
                return; // no hacer la consulta si no es válido
            // Salir del switch si no hay filtro válido
            //document.getElementById("tablaPolizas").innerHTML = '<p class="text-warning">Por favor, selecciona una opción de filtro válida.</p>';
            //return; // No continuar si la opción no es válida
        }
        // Construir la consulta con el filtro dinámico
        // Nota: Firestore requiere índices compuestos para consultas con where() y orderBy() o múltiples where() en campos diferentes.
        // Si usas ==, >=, <=, >, < en diferentes campos, necesitarás crear un índice en la consola de Firebase.
        // Para búsquedas tipo "contiene" (like), Firestore no tiene soporte directo. Se necesitaría una solución externa (e.g., Algolia) o filtrar en el cliente.
        // Aquí usamos '==' para coincidencias exactas.
        if (!campoFiltro) {
            document.getElementById("tablaPolizas").innerHTML = '<p class="text-warning">Por favor, selecciona un filtro válido.</p>';
            return;
        }
        consulta = query(polizasRef,
            where(campoFiltro, "==", filtradorValue)
        );

    } else if (filtradorValue && opcionValue === 'Choose...') {
        document.getElementById("tablaPolizas").innerHTML = '<p class="text-warning">Por favor, selecciona por qué campo deseas filtrar.</p>';
        return; // No continuar si no se seleccionó opción
    }


    // --- Ejecutar consulta y mostrar resultados ---
    try {
        const querySnapshot = await getDocs(consulta);
        let listaArchivosHTML = `
                <h3>Tus archivos:</h3>
                <div class="table-responsive">
                <table class="table table-hover table-secondary">
                <thead>
                    <tr class="table-dark">
                        <th>Aseguradora</th>
                        <th>No. Póliza</th>
                        <th>Serie/NIV</th>
                        <th>Inicio de vigencia</th>
                        <th>Fin de vigencia</th>
                        <th>Prima Total</th>
                        <th>Acción</th>
                    </tr>
                </thead>
                <tbody>`;

        if (querySnapshot.empty) {
            listaArchivosHTML += `<tr><td colspan="4" class="text-center">No se encontraron pólizas ${filtradorValue ? 'con ese filtro' : 'para este usuario'}.</td></tr>`;
        } else {
            querySnapshot.forEach((doc) => {
                const datos = doc.data();
                const base64Archivo = datos.urlArchivo; // Asumiendo que es base64
                const aseguradora = datos.aseguradora || 'N/A';
                const poliza = datos.poliza || 'N/A';
                const serie = datos.NIV || 'N/A'; // Usar NIV como 'Serie'
                const primatotal = datos.primaTotal.toLocaleString("en-US", { minimumFractionDigits: 2 });
                const fechaInicio = datos.inicioVigencia;
                const fechaFin = datos.finVigencia;
                listaArchivosHTML += `
                    <tr>
                        <td>${aseguradora}</td>
                        <td>${poliza}</td>
                        <td>${serie}</td>
                        <td>${fechaInicio}</td>
                        <td>${fechaFin}</td>
                        <td>${primatotal}</td>
                        <td>
                            <a class="btn btn-primary btn-sm" href="data:application/pdf;base64,${base64Archivo}" download="poliza_${aseguradora}_${poliza}.pdf">
                                Descargar PDF
                            </a>
                        </td>
                    </tr>
                `;
            });
        }

        listaArchivosHTML += '</tbody></table></div>';
        document.getElementById("tablaPolizas").innerHTML = listaArchivosHTML;

    } catch (error) {
        console.error("Error al obtener las pólizas:", error);
        document.getElementById("tablaPolizas").innerHTML = '<p class="text-danger">Error al cargar las pólizas. Intenta de nuevo más tarde.</p>';
        // Considerar mostrar un mensaje más específico si es un error de índice compuesto
        if (error.code === 'failed-precondition') {
            document.getElementById("tablaPolizas").innerHTML += '<p class="text-warning">Es posible que se requiera un índice compuesto en Firestore para esta consulta. Revisa la consola de Firebase.</p>';
        }
    }
}


// 🔹 Event Listener para el botón de buscar
document.getElementById("filtrador").addEventListener("input", mostrarPolizas);
document.getElementById("opcion").addEventListener("change", function () {
    cambiarTipo();
});

// Opcional: Filtrar también al presionar Enter en el input
document.getElementById("filtrador").addEventListener("keypress", (event) => {
    if (event.key === "Enter") {
        event.preventDefault(); // Evitar envío de formulario si lo hubiera
        mostrarPolizas();
    }
});

function cambiarTipo() {
    var x = document.getElementById("opcion").value;
    mostrarPolizas();
    if (x == 5 || x == 6) {
        const input = document.getElementById('filtrador');
        input.type = 'date';  // Cambia el tipo
        input.placeholder = "Selecciona una fecha";  // Opcional: Cambiar placeholder
    } else {
        const input = document.getElementById('filtrador');
        input.type = 'text';  // Cambia el tipo
        input.placeholder = "Buscar";
    }
}