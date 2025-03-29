//1.3
// Importar Firebase
import { getFirestore, collection, addDoc, query, where, getDocs } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-auth.js";
import { app } from "./assets/js/firebaseKey.js";

// Importar PDF.js
import * as pdfjsLib from "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/5.0.375/pdf.min.mjs";

// Configurar el worker de PDF.js
pdfjsLib.GlobalWorkerOptions.workerSrc = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/5.0.375/pdf.worker.min.mjs";

// 🔹 Inicializar Firebase
const auth = getAuth(app);
const db = getFirestore(app); // Inicializa Firestore Database

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
function convertirArchivoABase64(archivo) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result.split(",")[1]); // Obtener solo la parte Base64
        reader.onerror = (error) => reject(error);
        reader.readAsDataURL(archivo);
    });
}

// Función para leer el contenido del archivo PDF
async function leerContenidoPDF(archivo) {
    const reader = new FileReader();

    // Leer el archivo como ArrayBuffer
    reader.readAsArrayBuffer(archivo);

    return new Promise((resolve, reject) => {
        reader.onload = async () => {
            try {
                // Cargar el archivo PDF con PDF.js
                const pdf = await pdfjsLib.getDocument({ data: reader.result }).promise;

                let textoCompleto = "";

                // Iterar por cada página del PDF
                for (let i = 1; i <= pdf.numPages; i++) {
                    const pagina = await pdf.getPage(i);
                    const texto = await pagina.getTextContent();

                    // Extraer el texto de la página
                    texto.items.forEach((item) => {
                        textoCompleto += item.str + " ";
                    });
                }

                resolve(textoCompleto); // Devolver el texto completo del PDF
            } catch (error) {
                reject(error); // Manejar errores
            }
        };

        reader.onerror = (error) => reject(error); // Manejar errores de lectura
    });
}

// 🔹 Función para manejar la subida de archivos
async function subirPoliza() {
    if (!currentUser) {
        alert("Debes iniciar sesión para subir una póliza.");
        return;
    }

    const aseguradora = document.getElementById("aseguradora").value;
    const archivoInput = document.getElementById("archivo_poliza");
    const archivo = archivoInput.files[0];

    // Validar que se haya seleccionado una aseguradora y un archivo
    if (!aseguradora || !archivo) {
        alert("Por favor, selecciona una aseguradora y un archivo.");
        return;
    }

    try {
        // 🔹 Convertir el archivo a Base64
        const base64Archivo = await convertirArchivoABase64(archivo);
        console.log("Archivo en Base64:", base64Archivo);

        // 🔹 Guardar metadatos y archivo en Firestore
        const docRef = await addDoc(collection(db, "polizas"), {
            aseguradora: aseguradora,
            urlArchivo: base64Archivo, // Guardar el archivo en Base64
            fechaSubida: new Date().toISOString(),
            usuario: currentUser.email, // Guardar el correo del usuario autenticado
        });

        console.log("Metadatos guardados en Firestore con ID:", docRef.id);
        alert("Póliza subida con éxito.");
    } catch (error) {
        console.error("Error al subir la póliza:", error);
        alert("Hubo un error al subir la póliza. Por favor, inténtalo de nuevo.");
    }
}

// 🔹 Función para mostrar los archivos del usuario autenticado y permitir la descarga
async function mostrarArchivos() {
    if (!currentUser) {
        alert("Debes iniciar sesión para ver tus archivos.");
        return;
    }

    try {
        // 🔹 Consultar Firestore para obtener los documentos del usuario autenticado
        const polizasRef = collection(db, "polizas");
        const consulta = query(polizasRef, where("usuario", "==", currentUser.email));
        const querySnapshot = await getDocs(consulta);

        if (querySnapshot.empty) {
            alert("No se encontraron archivos para este usuario.");
            return;
        }

        // 🔹 Crear una lista de archivos con enlaces de descarga
        let listaArchivosHTML = "<h3>Tus archivos:</h3><ul>";
        querySnapshot.forEach((doc) => {
            const datos = doc.data();
            const base64Archivo = datos.urlArchivo; // Recuperar el archivo en Base64
            const aseguradora = datos.aseguradora;
            const fecha = datos.fechaSubida;

            // Crear un enlace de descarga para cada archivo
            listaArchivosHTML += `
                <li>
                    <strong>Aseguradora:</strong> ${aseguradora}<br>
                    <strong>Fecha:</strong> ${fecha}<br>
                    <a href="data:application/pdf;base64,${base64Archivo}" download="poliza_${aseguradora}.pdf">
                        Descargar PDF
                    </a>
                </li>
                <br>
            `;
        });
        listaArchivosHTML += "</ul>";

        // Mostrar los enlaces en una ventana emergente o modal
        const ventanaEmergente = window.open("", "_blank", "width=600,height=400");
        ventanaEmergente.document.write(listaArchivosHTML);
        ventanaEmergente.document.close();
    } catch (error) {
        console.error("Error al obtener los archivos:", error);
        alert("Hubo un error al obtener tus archivos. Por favor, inténtalo de nuevo.");
    }
}

// 🔹 Función para extraer el número de póliza de Banorte
function extraerdatosbanorte(texto) {
    const regex = /Inciso\s+(\d+)/; // Buscar "Inciso" seguido de un número
    const match = texto.match(regex);
    return match && match[1] ? match[1] : null; // Retornar el número de póliza o null
}

// 🔹 Función para extraer el número de póliza de Afirme
function extraerdatosafirme(texto) {
    const regex = /(\d{4}-\d{8}-\d{2})\s+Fecha de Emisión:/; // Buscar el número de póliza seguido de "Fecha de Emisión:"
    const match = texto.match(regex);
    return match && match[1] ? match[1] : null; // Retornar el número de póliza o null
}

// 🔹 Función para extraer el número de póliza de Quálitas
function extraerdatosqualitas(texto) {
    const regex = /PÓLIZA(?:\s+\S+){2}\s+(\d+)/; // Buscar "PÓLIZA" seguido de dos palabras y capturar el número
    const match = texto.match(regex);
    return match && match[1] ? match[1] : null; // Retornar el número de póliza o null
}

// Evento para manejar la selección del archivo
document.getElementById("archivo_poliza").addEventListener("change", async (event) => {
    const archivo = event.target.files[0];

    if (archivo && archivo.type === "application/pdf") {
        try {
            // Leer el contenido del PDF
            const contenidoPDF = await leerContenidoPDF(archivo);
            console.log("Contenido del PDF:", contenidoPDF); // Mostrar el contenido en la consola

            // Intentar extraer datos de Banorte
            const numeroPolizaBanorte = extraerdatosbanorte(contenidoPDF);
            if (numeroPolizaBanorte) {
                console.log("Número de Póliza encontrado (Banorte):", numeroPolizaBanorte);
                document.getElementById("aseguradora").value = "banorte"; // Cambiar aseguradora a Banorte
                alert("Número de Póliza encontrado (Banorte): " + numeroPolizaBanorte);
                return; // Salir si se encuentra la póliza
            }

            // Intentar extraer datos de Afirme
            const numeroPolizaAfirme = extraerdatosafirme(contenidoPDF);
            if (numeroPolizaAfirme) {
                console.log("Número de Póliza encontrado (Afirme):", numeroPolizaAfirme);
                document.getElementById("aseguradora").value = "afirme"; // Cambiar aseguradora a Afirme
                alert("Número de Póliza encontrado (Afirme): " + numeroPolizaAfirme);
                return; // Salir si se encuentra la póliza
            }

            // Intentar extraer datos de Quálitas
            const numeroPolizaQualitas = extraerdatosqualitas(contenidoPDF);
            if (numeroPolizaQualitas) {
                console.log("Número de Póliza encontrado (Quálitas):", numeroPolizaQualitas);
                document.getElementById("aseguradora").value = "qualitas"; // Cambiar aseguradora a Quálitas
                alert("Número de Póliza encontrado (Quálitas): " + numeroPolizaQualitas);
                return; // Salir si se encuentra la póliza
            }

            // Si no se encuentra ninguna póliza
            alert("No se encontró ninguna póliza válida en el archivo.");
        } catch (error) {
            console.error("Error al leer el PDF:", error);
            alert("Hubo un error al leer el archivo PDF.");
        }
    } else {
        alert("Por favor, selecciona un archivo PDF válido.");
    }
});

// 🔹 Agregar evento al botón de subida
document.getElementById("btn_subir").addEventListener("click", subirPoliza);

// 🔹 Agregar evento al botón de mostrar archivos
document.getElementById("btn_mostrar_archivos").addEventListener("click", mostrarArchivos);