//1.365.2024
//2.0.0
// Importar Firebase
import { getFirestore, collection, addDoc, query, where, getDocs } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-auth.js";
import { app } from "./firebaseKey.js";

// 🔹 Inicializar Firebase
const auth = getAuth(app);
export const db = getFirestore(app); // Inicializa Firestore Database

let currentUser = null;

// 🔹 Verificar si el usuario está autenticado
onAuthStateChanged(auth, (user) => {
    if (user) {
        console.log("Usuario autenticado:", user.email);
        currentUser = user; // Guardar el usuario autenticado
    } else {
        console.warn("No hay un usuario autenticado. Redirigiendo a la página de inicio de sesión...");
        alert("Debes iniciar sesión para subir una póliza o ver tus archivos.");
        window.location.href = "index.html"; // Redirigir a la página de inicio de sesión
    }
});

// 🔹 Función para convertir un archivo a Base64
export function convertirArchivoABase64(archivo) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result.split(",")[1]); // Obtener solo la parte Base64
        reader.onerror = (error) => reject(error);
        reader.readAsDataURL(archivo);
    });
}

// 🔹 Función para manejar la subida de archivos
async function subirPoliza() {
    if (!currentUser) {
        alert("Debes iniciar sesión para subir una póliza.");
        return;
    }

    const aseguradora = document.getElementById("aseguradora").value.toUpperCase(); // Obtener el valor de aseguradora y convertir a mayúsculas
    const archivoInput = document.getElementById("archivo_poliza");
    const primatotal = parseFloat(document.getElementById("primaTotal").value.replace(/,/g, '')); // Eliminar comas
    const primaneta = parseFloat(document.getElementById("primaNeta").value.replace(/,/g, '')); // Eliminar comas
    const serie = document.getElementById("niv").value; // Obtener el valor de NIV
    const nombreasegurado = document.getElementById("nombreasegurado").value.toUpperCase(); // Obtener el nombre asegurado
    const archivo = archivoInput.files[0];
    const Poliza = document.getElementById("poliza").value; // Obtener el valor de póliza

    // Validar que se haya seleccionado una aseguradora y un archivo
    if (!aseguradora || !archivo) {
        alert("Por favor, selecciona una aseguradora y un archivo.");
        return;
    }
    try {
        // 🔹 Verificar si ya existe una póliza con el mismo NIV (serie)
        const polizasRef = collection(db, "polizas");
        const consultaExistencia = query(polizasRef, where("poliza", "==", Poliza));
        const snapshotExistencia = await getDocs(consultaExistencia);

        if (!snapshotExistencia.empty) {
            // Ya existe una póliza con este NIV
            alert("Ya existe una póliza registrada con este número poliza");
            return; // Detener la ejecución si ya existe
        }

        // Si no existe, proceder a convertir y subir
        // 🔹 Convertir el archivo a Base64
        const base64Archivo = await convertirArchivoABase64(archivo);
        console.log("Archivo en Base64:", base64Archivo);


        // 🔹 Guardar metadatos y archivo en Firestore
        const docRef = await addDoc(collection(db, "polizas"), {
            aseguradora: aseguradora,
            urlArchivo: base64Archivo, // Guardar el archivo en Base64
            NIV: serie, // Provide a default value or remove this line if not needed
            primaTotal: primatotal, // Guardar el valor de primaNeta
            primaNeta: primaneta, // Provide a default value or remove this line if not needed
            fechaSubida: new Date().toISOString(),
            usuario: currentUser.email,// Guardar el correo del usuario autenticado
            nombreAsegurado: nombreasegurado, // Guardar el nombre asegurado
            poliza: Poliza // Guardar el valor de póliza
        });
        alert("Póliza subida con éxito.");
    }
    catch (error) {
        console.error("Error al subir la póliza:", error);
        alert("Ocurrió un error al intentar subir la póliza. Por favor, inténtalo de nuevo.");
    }

}

// 🔹 Agregar evento al botón de subida
document.getElementById("btn_subir").addEventListener("click", subirPoliza);

document.getElementById('archivo_poliza').addEventListener('change', function (event) {
    const file = event.target.files[0];
    if (file && file.type === 'application/pdf') {
        const previewContainer = document.getElementById('pdf-preview');
        previewContainer.innerHTML = '<p>Cargando PDF...</p>';

        const fileReader = new FileReader();

        fileReader.onload = function () {
            const typedArray = new Uint8Array(this.result);

            // Cargar el PDF
            pdfjsLib.getDocument(typedArray).promise.then(function (pdf) {
                previewContainer.innerHTML = '';

                // Mostrar todas las páginas
                for (let i = 1; i <= pdf.numPages; i++) {
                    pdf.getPage(i).then(function (page) {
                        const viewport = page.getViewport({ scale: 1.0 });
                        const canvas = document.createElement('canvas');
                        const context = canvas.getContext('2d');
                        canvas.height = viewport.height;
                        canvas.width = viewport.width;

                        const renderContext = {
                            canvasContext: context,
                            viewport: viewport
                        };

                        const pageDiv = document.createElement('div');
                        pageDiv.className = 'pdf-page';
                        pageDiv.appendChild(canvas);
                        previewContainer.appendChild(pageDiv);

                        page.render(renderContext);
                    });
                }
            }).catch(function (error) {
                previewContainer.innerHTML = '<p>Error al cargar el PDF: ' + error.message + '</p>';
            });
        };

        fileReader.readAsArrayBuffer(file);
    } else {
        document.getElementById('pdf-preview').innerHTML = '<p>Por favor, selecciona un archivo PDF válido.</p>';
    }
});