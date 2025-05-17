//1.374.2024
//2.0.0
//2.0.0
// Importar Firebase
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-auth.js";
import { getFirestore, collection, query, where, getDocs, doc, getDocs as getDocsSub } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js";
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
        }
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
            querySnapshot.forEach((docSnap) => {
                const datos = docSnap.data();
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
                            <button class="btn btn-primary btn-sm descargar-pdf" data-id="${docSnap.id}" data-aseguradora="${aseguradora}" data-poliza="${poliza}">
                                Descargar PDF
                            </button>
                        </td>
                    </tr>
                `;
            });
        }

        listaArchivosHTML += '</tbody></table></div>';
        document.getElementById("tablaPolizas").innerHTML = listaArchivosHTML;

        // Agregar evento para descarga
        document.querySelectorAll('.descargar-pdf').forEach(btn => {
            btn.addEventListener('click', async function () {
                const polizaId = this.getAttribute('data-id');
                const aseguradora = this.getAttribute('data-aseguradora');
                const poliza = this.getAttribute('data-poliza');
                // Obtener todos los chunks y concatenar
                const chunksRef = collection(db, "polizas", polizaId, "chunks");
                const chunksSnap = await getDocsSub(chunksRef);
                let chunksArr = [];
                chunksSnap.forEach(chunkDoc => {
                    chunksArr.push({ order: chunkDoc.data().order, data: chunkDoc.data().data });
                });
                // Ordenar por 'order'
                chunksArr.sort((a, b) => a.order - b.order);
                const base64Archivo = chunksArr.map(c => c.data).join('');
                // Descargar
                const link = document.createElement('a');
                link.href = `data:application/pdf;base64,${base64Archivo}`;
                link.download = `poliza_${aseguradora}_${poliza}.pdf`;
                link.click();
            });
        });

    } catch (error) {
        console.error("Error al obtener las pólizas:", error);
        document.getElementById("tablaPolizas").innerHTML = '<p class="text-danger">Error al cargar las pólizas. Intenta de nuevo más tarde.</p>';
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