//1.343.2024
//2.0.0
// Importar Firebase
import { getFirestore, collection, addDoc, query, where, getDocs } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-auth.js";
import { app } from "./firebaseKey.js";

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
    const primatotal = parseFloat(document.getElementById("primaTotal").value.replace(/,/g, '')); // Eliminar comas
    const primaneta = parseFloat(document.getElementById("primaNeta").value.replace(/,/g, '')); // Eliminar comas
    const serie = document.getElementById("niv").value; // Obtener el valor de NIV
    const nombreasegurado = document.getElementById("nombreasegurado").value; // Obtener el nombre asegurado
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
            NIV: serie, // Provide a default value or remove this line if not needed
            primaTotal: primatotal, // Guardar el valor de primaNeta
            primaNeta: primaneta, // Provide a default value or remove this line if not needed
            fechaSubida: new Date().toISOString(),
            usuario: currentUser.email,// Guardar el correo del usuario autenticado
            nombreAsegurado: nombreasegurado // Guardar el nombre asegurado
        });

        alert("Póliza subida con éxito.");
    } catch (error) {
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

function extraerprimatotalqualitas(texto) {
    // Primer formato: Capturar el número después de "Aplicada:" y antes de "DEL VALLE"
    const regex = /Aplicada:\s(?:[\d,]+\.\d+\s+){5}([\d,]+\.\d+)|([\d,]+\.\d+)\s{3}DEL VALLE/i;

    // Segundo formato: Capturar el número entre "IMPORTE TOTAL." y "16 %"
    // Contando los espacios entre "IMPORTE TOTAL." y el número, y entre el número y "16 %"
    const regex1 = /IMPORTE TOTAL\.\s{3}([\d,]+\.\d+)\s{2}PESOS/;

    // Intentar con el primer formato
    const match = texto.match(regex);

    if (match) {
        const primaTotal = match[1] || match[2]; // Capturar el número encontrado
        console.log("Prima total encontrada (formato 1):", primaTotal);
        return primaTotal; // Devolver el número como texto
    }

    // Intentar con el segundo formato si el primero no funciona
    const match1 = texto.match(regex1);

    if (match1) {
        const primaTotal = match1[1]; // Capturar el número encontrado
        console.log("Prima total encontrada (formato 2):", primaTotal);
        return primaTotal; // Devolver el número como texto
    }

    // Si no se encuentra en ninguno de los formatos
    console.warn("No se encontró la Prima Total en el texto.");
    return null;
}

function extraerprimanetaqualitas(texto) {
    // Primer formato: Capturar el número 4 espacios después de "Aplicada:" y 6 espacios antes de "DEL VALLE"
    const regex = /Aplicada:\s(?:[\d,]+\.\d+\s+){3}([\d,]+\.\d+)|([\d,]+\.\d+)\s(?:[\d,]+\.\d+\s+){5}DEL VALLE/i;

    // Segundo formato: Capturar el número entre "Subtotal" e "IMPORTE TOTAL."
    // Considerando los espacios exactos en el texto proporcionado
    const regex1 = /Subtotal\s+I\.V\.A\.\s+\d{1,3}(?:,\d{3})*\.\d{2}\s+\d{1,3}(?:,\d{3})*\.\d{2}\s+([\d,]+\.\d+)\s+\d{1,3}(?:,\d{3})*\.\d{2}\s+IMPORTE TOTAL\./i;

    const match = texto.match(regex);

    if (match) {
        const primaNeta = match[1] || match[2]; // Capturar el número encontrado
        console.log("Prima neta encontrada (formato 1):", primaNeta);
        return primaNeta; // Devolver como cadena de texto
    }

    const match1 = texto.match(regex1);

    if (match1) {
        const primaNeta = match1[1]; // Capturar el número encontrado
        console.log("Prima neta encontrada (formato 2):", primaNeta);
        return primaNeta; // Devolver como cadena de texto
    }

    console.warn("No se encontró la Prima neta en el texto.");
    return null;
}

// 🔹 Función para extraer el número de póliza de Qualitas
function extraerdatosqualitas(texto) {
    const regex = /PÓLIZA(?:\s+\S+){2}\s+(\d+)/; // Buscar "PÓLIZA" seguido de dos palabras y capturar el número
    const match = texto.match(regex); // Retornar el número de póliza o null
    return match && match[1] ? match[1] : null;
}

function extraerNumeroSerie(texto) {
    const regexSerieMotor = /\bSerie:\s*([A-Z0-9]{17})\b.*?\bMotor\b/i; // Serie with reference to "Motor"
    const regexColorVigencia = /\bColor:\s*.*?\b([A-Z0-9]{17})\b.*?\bVIGENCIA\b/i; // Serie with reference to "Color:" and "VIGENCIA"

    const matchSerieMotor = texto.match(regexSerieMotor); // Buscar el número de serie con referencia "Serie:" y "Motor"
    const matchColorVigencia = texto.match(regexColorVigencia); // Buscar el número de serie con referencia "Color:" y "VIGENCIA"

    if (matchSerieMotor) {
        console.log("Número de serie encontrado (Serie-Motor):", matchSerieMotor[1]);
        return matchSerieMotor[1]; // Retornar el número de serie encontrado
    }
    if (matchColorVigencia) {
        console.log("Número de serie encontrado (Color-VIGENCIA):", matchColorVigencia[1]);
        return matchColorVigencia[1]; // Retornar el número de serie encontrado
    }

    console.warn("No se encontró el número de serie en el texto.");
    return null; // Retornar null si no se encuentra ningún número de serie
}

function extraernombre(texto) {
    const regexDesdeHasta = /Desde las 12:00 P\.M\. del:\s+Hasta las 12:00 P\.M\. del:\s+([A-Z\s]+?)\s+\d+/i; // Nombre entre "Desde las 12:00 P.M. del:" y el primer número
    const regexIncisoInformacion = /INCISO ENDOSO PÓLIZA\s+.*?\s+([A-Z\s]+?)\s+INFORMACIÓN IMPORTANTE/i; // Nombre entre "INCISO ENDOSO PÓLIZA" y "INFORMACIÓN IMPORTANTE"

    const matchDesdeHasta = texto.match(regexDesdeHasta); // Buscar el nombre con referencia "Desde las 12:00 P.M. del:" y el primer número
    const matchIncisoInformacion = texto.match(regexIncisoInformacion); // Buscar el nombre con referencia "INCISO ENDOSO PÓLIZA" y "INFORMACIÓN IMPORTANTE"

    if (matchDesdeHasta) {
        console.log("Nombre encontrado (Desde-Hasta):", matchDesdeHasta[1]);
        return matchDesdeHasta[1].trim(); // Retornar el nombre encontrado
    }
    if (matchIncisoInformacion) {
        console.log("Nombre encontrado (Inciso-Información):", matchIncisoInformacion[1]);
        return matchIncisoInformacion[1].trim(); // Retornar el nombre encontrado
    }

    console.warn("No se encontró el nombre en el texto.");
    return null; // Retornar null si no se encuentra ningún nombre
}

// Evento para manejar la selección del archivo
document.getElementById("archivo_poliza").addEventListener("change", async (event) => {
    const archivo = event.target.files[0];

    if (archivo && archivo.type === "application/pdf") {
        try {
            // Leer el contenido del PDF
            const contenidoPDF = await leerContenidoPDF(archivo);
            console.log("Contenido del PDF:", contenidoPDF); // Mostrar el contenido en la consola

            // Identificar la aseguradora
            let aseguradora = null;

            if (extraerdatosbanorte(contenidoPDF)) {
                aseguradora = "Banorte";
            } else if (extraerdatosafirme(contenidoPDF)) {
                aseguradora = "Afirme";
            } else if (extraerdatosqualitas(contenidoPDF)) {
                aseguradora = "Qualitas";
            }

            if (aseguradora) {
                document.getElementById("aseguradora").value = aseguradora.toLowerCase(); // Actualizar el campo aseguradora

                // Extraer datos específicos según la aseguradora
                if (aseguradora === "Banorte") {
                    const numeroPoliza = extraerdatosbanorte(contenidoPDF);
                    document.getElementById("poliza").value = numeroPoliza;
                } else if (aseguradora === "Afirme") {
                    const numeroPoliza = extraerdatosafirme(contenidoPDF);
                    document.getElementById("poliza").value = numeroPoliza;
                } else if (aseguradora === "Qualitas") {
                    const numeroPoliza = extraerdatosqualitas(contenidoPDF);
                    const primatotal = extraerprimatotalqualitas(contenidoPDF);
                    const primaneta = extraerprimanetaqualitas(contenidoPDF);
                    const serie = extraerNumeroSerie(contenidoPDF);
                    const nombre = extraernombre(contenidoPDF); // Obtener el nombre de la póliza 
                    console.log("serie", serie);
                    document.getElementById("poliza").value = numeroPoliza;
                    document.getElementById("primaTotal").value = primatotal;
                    document.getElementById("primaNeta").value = primaneta;
                    document.getElementById("niv").value = serie; // Actualizar el campo serie
                    document.getElementById("nombreasegurado").value = nombre; // Actualizar el campo nombre
                }
            } else {
                alert("No se pudo identificar la aseguradora en el archivo.");
            }
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