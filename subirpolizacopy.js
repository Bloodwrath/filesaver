// 🔹 Importar Firebase y sus módulos necesarios
import { getStorage, ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-storage.js";
import { getFirestore, collection, addDoc } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-auth.js";
import { app } from "./assets/js/firebaseKey.js";

// 🔹 Inicializar Firebase
const auth = getAuth(app);
const storage = getStorage(app); // Inicializa Firebase Storage
const db = getFirestore(app); // Inicializa Firestore

let currentUser = null;

// 🔹 Verificar si el usuario está autenticado
onAuthStateChanged(auth, (user) => {
    if (user) {
        console.log("Usuario autenticado:", user.email);
        currentUser = user; // Guardar el usuario autenticado
    } else {
        console.warn("No hay un usuario autenticado. Redirigiendo a la página de inicio de sesión...");
        alert("Debes iniciar sesión para subir una póliza.");
        window.location.href = "index.html"; // Redirigir a la página de inicio de sesión
    }
});

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
        // 🔹 Subir archivo a Firebase Storage
        const storageRef = ref(storage, `polizas/${archivo.name}`); // Ruta en Firebase Storage
        const snapshot = await uploadBytes(storageRef, archivo); // Subir archivo
        const downloadURL = await getDownloadURL(snapshot.ref); // Obtener URL de descarga;
        console.log("Archivo subido con éxito:", downloadURL);

        // 🔹 Guardar metadatos en Firestore
        const docRef = await addDoc(collection(db, "polizas"), {
            aseguradora: aseguradora,
            nombreArchivo: archivo.name,
            urlArchivo: downloadURL,
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

// 🔹 Agregar evento al botón de subida
document.getElementById("btn_subir").addEventListener("click", subirPoliza);