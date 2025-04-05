//1.363.2024
//2.0.0
// Importar PDF.js
import * as pdfjsLib from "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/5.0.375/pdf.min.mjs";

// Configurar el worker de PDF.js
pdfjsLib.GlobalWorkerOptions.workerSrc = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/5.0.375/pdf.worker.min.mjs";

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

            if (extraerpolizabanorte(contenidoPDF)) {
                aseguradora = "Banorte";
            } else if (extraerpolizaafirme(contenidoPDF)) {
                aseguradora = "Afirme";
            } else if (extraerpolizaqualitas(contenidoPDF)) {
                aseguradora = "Qualitas";
            }

            if (aseguradora) {
                document.getElementById("aseguradora").value = aseguradora.toLowerCase(); // Actualizar el campo aseguradora

                // Extraer datos específicos según la aseguradora
                if (aseguradora === "Banorte") {


                    document.getElementById("poliza").value = extraerpolizabanorte(contenidoPDF);
                    document.getElementById("primaNeta").value = extraerprimanetabanorte(contenidoPDF); // Actualizar el campo primaNeta
                    document.getElementById("primaTotal").value = extraerprimatotalbanorte(contenidoPDF); // Actualizar el campo primaTotal
                    document.getElementById("niv").value = extraernumeroseriebanorte(contenidoPDF); // Actualizar el campo serie
                    document.getElementById("nombreasegurado").value = extraernombrebanorte(contenidoPDF);
                    var x = document.getElementsByClassName("fila");
                    for (var i = 0; i < x.length; i++) {
                        x[i].style.visibility = "visible";
                    }
                    document.getElementById("btn_subir").removeAttribute("disabled");

                } else if (aseguradora === "Afirme") {
                    const numeroPoliza = extraerpolizaafirme(contenidoPDF);
                    document.getElementById("poliza").value = numeroPoliza;
                    var x = document.getElementsByClassName("fila");
                    for (var i = 0; i < x.length; i++) {
                        x[i].style.visibility = "visible";
                    }
                    document.getElementById("btn_subir").removeAttribute("disabled");
                } else if (aseguradora === "Qualitas") {
                    document.getElementById("poliza").value = extraerpolizaqualitas(contenidoPDF);
                    document.getElementById("primaTotal").value = extraerprimatotalqualitas(contenidoPDF);
                    document.getElementById("primaNeta").value = extraerprimanetaqualitas(contenidoPDF);
                    document.getElementById("niv").value = extraernumeroseriequalitas(contenidoPDF); // Actualizar el campo serie
                    document.getElementById("nombreasegurado").value = extraernombrequalitas(contenidoPDF); // Actualizar el campo nombre
                    var x = document.getElementsByClassName("fila");
                    for (var i = 0; i < x.length; i++) {
                        x[i].style.visibility = "visible";
                    }
                    document.getElementById("btn_subir").removeAttribute("disabled");
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
                let paginaActual = 1;

                // Iterar por cada página del PDF
                while (paginaActual <= pdf.numPages) {
                    const pagina = await pdf.getPage(paginaActual);
                    const texto = await pagina.getTextContent();

                    // Extraer el texto de la página
                    let textoPagina = "";
                    texto.items.forEach((item) => {
                        textoPagina += item.str + " ";
                    });

                    // Verificar si la palabra "AVISO DE COBRO" está en la página
                    if (textoPagina.toLowerCase().includes("aviso de cobro")) {
                        console.log(`Se encontró la palabra "AVISO DE COBRO" en la página ${paginaActual}. Poniendo página actual en ${paginaActual + 1}`);
                        paginaActual++;
                        continue;
                    } else {
                        textoCompleto += textoPagina + " ";
                    }

                    paginaActual++;
                }

                resolve(textoCompleto); // Devolver el texto completo del PDF
            } catch (error) {
                reject(error); // Manejar errores
            }
        };

        reader.onerror = (error) => reject(error); // Manejar errores de lectura
    });
}

// 🔹 Función para extraer el número de póliza de Qualitas
function extraerpolizaqualitas(texto) {
    const regex = /PÓLIZA(?:\s+\S+){2}\s+(\d+)/; // Buscar "PÓLIZA" seguido de dos palabras y capturar el número
    const match = texto.match(regex); // Retornar el número de póliza o null
    return match && match[1] ? match[1] : null;
}

// 🔹 Función para extraer el numero de poliza
function extraerpolizabanorte(texto) {
    const regex = /Inciso\s+(\d{7})/; // Buscar "Póliza:" seguido de un número y capturar el número
    const regex1 = /Póliza\s+(\d{7})/;

    const match = texto.match(regex);
    if (match) {
        return match && match[1] ? match[1] : null;
    }

    const match1 = texto.match(regex1);
    if (match1) {
        return match1 && match1[1] ? match1[1] : null;
    }
}

// 🔹 Función para extraer el número de póliza de Afirme
function extraerpolizaafirme(texto) {
    const regex = /(\d{4}-\d{8}-\d{2})\s+Fecha de Emisión:/; // Buscar el número de póliza seguido de "Fecha de Emisión:"
    const match = texto.match(regex);
    return match && match[1] ? match[1] : null; // Retornar el número de póliza o null
}

// 🔹 Función para extraer la prima neta de Banorte
function extraerprimanetabanorte(texto) {
    // Regex para encontrar "Prima Neta:" o "Prima neta:", seguido opcionalmente por '$', y capturar el número.
    const regex = /Prima\s+neta:\s*\$?\s*([\d,]+\.\d{2})/i;
    const match = texto.match(regex);

    if (match && match[1]) {
        console.log("Prima neta Banorte encontrada:", match[1]);
        return match[1]; // Devuelve el valor numérico como texto
    } else {
        console.warn("No se encontró la Prima neta de Banorte en el texto.");
        return null;
    }
}

// 🔹 Función para extraer el nombre del contratante de Banorte
function extraernombrebanorte(texto) {
    // Regex: busca "Contratante:" (opcionalmente precedido por "Nombre del "), salta underscores/espacios, captura cualquier caracter (no codicioso) hasta " R.F.C" (con o sin punto final)
    const regex = /(?:Nombre\s+del\s+)?Contratante:\s*_*\s*(.+?)\s+R\.F\.C\.?:/i;
    const match = texto.match(regex);

    if (match && match[1]) {
        const nombre = match[1].trim(); // Limpiar espacios extra
        console.log("Nombre Contratante Banorte encontrado:", nombre);
        return nombre;
    } else {
        console.warn("No se encontró el Nombre del Contratante de Banorte en el texto.");
        return null;
    }
}

// 🔹 Función para extraer la prima total de Banorte
function extraerprimatotalbanorte(texto) {
    // Regex para encontrar "Prima Total:" o "Prima total:", seguido opcionalmente por '$', y capturar el número.
    const regex = /Prima\s+Total:\s*\$?\s*([\d,]+\.\d{2})/i;
    const match = texto.match(regex);

    if (match && match[1]) {
        console.log("Prima total Banorte encontrada:", match[1]);
        return match[1]; // Devuelve el valor numérico como texto
    } else {
        console.warn("No se encontró la Prima total de Banorte en el texto.");
        return null;
    }
}

//funcion para extraer el numero de serie de Banorte
function extraernumeroseriebanorte(texto) {
    // Regex para encontrar "Serie:" seguido de un número de 17 caracteres alfanuméricos
    const regex = /Serie:\s*_*\s*([A-Z0-9]{16,17})/i;
    const match = texto.match(regex);
    if (match && match[1]) {
        console.log("Número de serie Banorte encontrado:", match[1]);
        return match[1]; // Retornar el número de serie encontrado
    } else {
        console.warn("No se encontró el número de serie de Banorte en el texto.");
        return null; // Retornar null si no se encuentra ningún número de serie
    }
}

// Función para extraer la prima total de Qualitas
function extraerprimatotalqualitas(texto) {
    // Primer formato: Capturar el número entre "Aplicada:" y "Funcionario Autorizado"
    const regex1 = /Aplicada:\s(?:[\d,]+\.\d+\s+){5}([\d,]+\.\d+)|([\d,]+\.\d+)\s+Funcionario Autorizado/i;

    // Segundo formato: Capturar el número entre "IMPORTE TOTAL." y "PESOS"
    const regex2 = /IMPORTE TOTAL\.\s+([\d,]+\.\d+)\s+PESOS/i;

    // Tercer formato: Capturar el número entre "Forma de: Pago:" y "Exclusivo para reporte"
    const regex3 = /Forma de:\s*Pago:\s*[A-Z]+\s+([\d,]+\.\d{2})/i;

    // Intentar con el primer formato
    const match1 = texto.match(regex1);
    if (match1) {
        const primaTotal = match1[1] || match1[2]; // Capturar el número encontrado
        return primaTotal; // Devolver el número como texto
    }

    // Intentar con el segundo formato
    const match2 = texto.match(regex2);
    if (match2) {
        const primaTotal = match2[1]; // Capturar el número encontrado
        return primaTotal; // Devolver el número como texto
    }

    // Intentar con el tercer formato
    const match3 = texto.match(regex3);
    if (match3) {
        const primaTotal = match3[1]; // Capturar el número encontrado
        return primaTotal; // Devolver el número como texto
    }

    // Si no se encuentra en ninguno de los formatos
    console.warn("No se encontró la Prima Total en el texto.");
    return null;
}

// Función para extraer la prima neta de Qualitas
function extraerprimanetaqualitas(texto) {
    // Regex 1: Capturar el número inmediatamente después de "Aplicada:"
    const regex1 = /Aplicada:\s+([\d,]+\.\d+)/i;

    // Regex 2: Capturar el número inmediatamente después de "I.V.A."
    const regex2 = /I\.V\.A\.\s+([\d,]+\.\d+)/i; // Note: This might capture the IVA amount, not Prima Neta, based on policy structure.

    const match1 = texto.match(regex1);

    const match2 = texto.match(regex2);


    if (match2) {
        // WARNING: Based on observed formats, this regex might capture the IVA value, not Prima Neta.
        // Proceeding as per user's specific instruction.
        const primaNeta = match2[1]; // Capturar el número encontrado
        console.log("Prima neta encontrada (formato IVA):", primaNeta);
        return primaNeta; // Devolver como cadena de texto
    }
    if (match1) {
        const primaNeta = match1[1]; // Capturar el número encontrado
        console.log("Prima neta encontrada (formato Aplicada):", primaNeta);
        return primaNeta; // Devolver como cadena de texto
    }

    console.warn("No se encontró la Prima neta en el texto con los patrones especificados.");
    return null;
}

// Función para extraer el número de serie de Qualitas
function extraernumeroseriequalitas(texto) {
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

// Función para extraer el nombre del asegurado de Qualitas
function extraernombrequalitas(texto) {
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


