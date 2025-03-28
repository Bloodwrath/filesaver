import { getStorage, ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-storage.js";
import { getFirestore, collection, addDoc } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js";
import { app } from "./assets/js/firebaseKey.js";

const storage = getStorage(app); // Inicializa Firebase Storage
const db = getFirestore(app); // Inicializa Firestore

document.getElementById("btn_subir").addEventListener("click", async () => {
    const aseguradora = document.getElementById("aseguradora").value;
    const archivoInput = document.getElementById("archivo_poliza");
    const archivo = archivoInput.files[0];

    if (!aseguradora || !archivo) {
        alert("Por favor, selecciona una aseguradora y un archivo.");
        return;
    }

    try {
        // 🔹 Subir archivo a Firebase Storage
        const storageRef = ref(storage, `polizas/${archivo.name}`); // Ruta en Firebase Storage
        const snapshot = await uploadBytes(storageRef, archivo); // Subir archivo
        const downloadURL = await getDownloadURL(snapshot.ref); // Obtener URL de descarga

        console.log("Archivo subido con éxito:", downloadURL);

        // 🔹 Guardar metadatos en Firestore
        const docRef = await addDoc(collection(db, "polizas"), {
            aseguradora: aseguradora,
            nombreArchivo: archivo.name,
            urlArchivo: downloadURL,
            fechaSubida: new Date().toISOString(),
        });

        console.log("Metadatos guardados en Firestore con ID:", docRef.id);
        alert("Póliza subida con éxito.");
    } catch (error) {
        console.error("Error al subir la póliza:", error);
        alert("Hubo un error al subir la póliza. Por favor, inténtalo de nuevo.");
    }
});