document.getElementById('form_subir_poliza').addEventListener('submit', async (e) => {
    e.preventDefault();

    const formData = new FormData(e.target);

    try {
        const response = await fetch('/upload_poliza', {
            method: 'POST',
            body: formData
        });

        if (!response.ok) {
            throw new Error('Error al subir la póliza');
        }

        const data = await response.json();

        // Rellenar los campos con los datos extraídos
        document.getElementById('numero_poliza').value = data.datos.numeroPoliza || '';
        document.getElementById('nombre_asegurado').value = data.datos.nombreAsegurado || '';
        document.getElementById('prima_total').value = data.datos.primaTotal || '';
        document.getElementById('prima_neta').value = data.datos.primaNeta || '';
    } catch (error) {
        console.error(error);
        alert('Hubo un error al procesar la póliza.');
    }
});
