// 🔹 Importar Firebase
import { getFirestore, collection, addDoc, query, where, getDocs } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-auth.js";
import { app } from "./assets/js/firebaseKey.js";

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

// 🔹 Función para mostrar los archivos del usuario autenticado
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

        // 🔹 Crear una lista de archivos
        let listaArchivos = "Tus archivos:\n\n";
        querySnapshot.forEach((doc) => {
            const datos = doc.data();
            listaArchivos += `- Aseguradora: ${datos.aseguradora}\n  Fecha: ${datos.fechaSubida}\n\n`;
        });

        // 🔹 Mostrar la lista en una ventana emergente
        alert(listaArchivos);
    } catch (error) {
        console.error("Error al obtener los archivos:", error);
        alert("Hubo un error al obtener tus archivos. Por favor, inténtalo de nuevo.");
    }
}

// 🔹 Agregar evento al botón de subida
document.getElementById("btn_subir").addEventListener("click", subirPoliza);

// 🔹 Agregar evento al botón de mostrar archivos
document.getElementById("btn_mostrar_archivos").addEventListener("click", mostrarArchivos);