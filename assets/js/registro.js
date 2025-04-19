// 🔹 Configuración inicial (se mantiene igual)
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-auth.js";
import { createUserWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-auth.js";
import { getFirestore, collection, addDoc, query, where, getDocs } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js";
import { app } from "./firebaseKey.js";

const auth = getAuth(app);
const db = getFirestore(app);

// 🔹 Objeto para rastrear campos inválidos específicos
const camposInvalidos = {
    nombre: false,
    apellidos: false,
    boleta: false,
    password: false,
    correo: false,
    telefono: false
};

// 🔹 Expresiones regulares mejoradas
const expresiones = {
    nombre: /^[a-zA-ZÀ-ÿ\s]{2,40}$/, // 2-40 caracteres
    apellido: /^[a-zA-ZÀ-ÿ\s]{2,40}$/,
    password: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d]{8,16}$/, // 8-16 chars con may, min y num
    boleta: /^\d{10,14}$/, // 10-14 dígitos
    correo: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
    telefono: /^\d{10}$/ // 10 dígitos exactos
};

// 🔹 Función para validar al pegar o autocompletar
function validarAlPegar(input) {
    // Dispara el evento de validación después de pegar
    setTimeout(() => {
        const event = {
            target: input,
            name: input.name
        };
        validarFormulario(event);
    }, 100);
}

const taskForm = document.getElementById('form_registro');
// 🔹 Manejador de eventos mejorado
document.addEventListener('DOMContentLoaded', () => {
    const inputs = taskForm.querySelectorAll('input');

    // Eventos para cada input
    inputs.forEach(input => {
        // Validar al escribir
        input.addEventListener('input', validarFormulario);

        // Validar al pegar
        input.addEventListener('paste', () => validarAlPegar(input));

        // Validar datos autocompletados
        input.addEventListener('change', validarFormulario);
    });

    // Verificar sesión activa
    onAuthStateChanged(auth, (user) => {
        if (user) {
            mensajeErrorR("Tiene una sesión activa, para hacer un registro debe cerrarla", "index.html");
        }
    });
});

// 🔹 Función de validación mejorada
const validarFormulario = (e) => {
    const input = e.target;
    const campo = input.name;
    let valido = false;

    switch (campo) {
        case 'nombre':
            valido = expresiones.nombre.test(input.value);
            camposInvalidos.nombre = !valido;
            break;
        case 'apaterno':
        case 'amaterno':
            valido = expresiones.apellido.test(input.value);
            camposInvalidos.apellidos = !valido;
            break;
        case 'boleta':
            valido = expresiones.boleta.test(input.value);
            camposInvalidos.boleta = !valido;
            break;
        case 'password':
            valido = expresiones.password.test(input.value);
            camposInvalidos.password = !valido;
            validarPassword2();
            break;
        case 'password2':
            validarPassword2();
            return; // No actualizamos camposInvalidos aquí
        case 'correo':
            valido = expresiones.correo.test(input.value);
            camposInvalidos.correo = !valido;
            break;
        case 'telefono':
            valido = expresiones.telefono.test(input.value);
            camposInvalidos.telefono = !valido;
            break;
    }

    // Actualizar UI
    actualizarEstiloInput(input, valido);
};

function validarPassword2() {
    const password1 = document.getElementById('llenarPassword').value;
    const password2 = document.getElementById('llenarValidarPassword').value;
    const input = document.getElementById('llenarValidarPassword');

    const grupo = input.closest('.formulario__grupo');
    const icono = grupo.querySelector('i');
    const mensajeError = grupo.querySelector('.formulario__input-error');

    const coinciden = password1 === password2 && password2 !== "";

    grupo.classList.toggle('formulario__grupo-incorrecto', !coinciden);
    grupo.classList.toggle('formulario__grupo-correcto', coinciden);

    if (icono) {
        icono.classList.toggle('fa-times-circle', !coinciden);
        icono.classList.toggle('fa-check-circle', coinciden);
    }

    if (mensajeError) {
        mensajeError.classList.toggle('formulario__input-error-activo', !coinciden);
    }

    camposInvalidos.password = !coinciden;
}


// 🔹 Función para mostrar errores específicos
function mostrarErrores() {
    const camposConError = Object.keys(camposInvalidos)
        .filter(campo => camposInvalidos[campo])
        .map(campo => {
            switch (campo) {
                case 'nombre': return 'Nombre';
                case 'apellidos': return 'Apellidos';
                case 'boleta': return 'Número de empleado';
                case 'password': return 'Contraseña';
                case 'correo': return 'Correo electrónico';
                case 'telefono': return 'Teléfono';
                default: return campo;
            }
        });

    if (camposConError.length > 0) {
        mensajeAdvertencia(`Los siguientes campos son inválidos: ${camposConError.join(', ')}`);
        return true;
    }
    return false;
}

// 🔹 Función principal de registro mejorada
async function subirUsuario(e) {
    e.preventDefault();

    // Validar todos los campos
    if (mostrarErrores()) {
        return;
    }

    // Obtener valores del formulario
    const nombre = taskForm['llenarNombre'].value.toUpperCase();
    const apellidop = taskForm['llenarApellidoP'].value.toUpperCase();
    const apellidom = taskForm['llenarApellidoM'].value.toUpperCase();
    const numeroEmpleado = Number(taskForm['llenarNumeroEmpleado'].value);
    const email = taskForm['email'].value.toLowerCase();
    const password = taskForm['llenarPassword'].value;
    const telefono = taskForm['llenarTelefono'].value;

    // Verificar contraseñas coinciden
    if (taskForm['llenarPassword'].value !== taskForm['llenarValidarPassword'].value) {
        mensajeAdvertencia("Las contraseñas no coinciden");
        return;
    }

    try {
        // 🔹 Crear usuario en Authentication
        const credenciales = await createUserWithEmailAndPassword(auth, email, password);
        console.log("Usuario autenticado creado:", credenciales.user.uid);

        // 🔹 Verificar si el correo ya existe en Firestore (opcional, porque Auth ya lo gestiona)
        const correoExiste = await verificarCorreoExistente(email);
        if (correoExiste) {
            mensajeAdvertencia('Este correo ya está registrado en Firestore');
            return;
        }

        // 🔹 Verificar si el número de empleado ya existe
        const boletaExiste = await verificarBoletaExistente(numeroEmpleado);
        if (boletaExiste) {
            mensajeAdvertencia('Este número de empleado ya está registrado');
            return;
        }

        const nivelacceso = await obtenerNivelAcceso(telefono);
        const sucursal = await obtenerSucursal(telefono);

        if (!nivelacceso) {
            mensajeAdvertencia("Su teléfono no está registrado para acceso");
            return;
        }

        // 🔹 Guardar usuario en Firestore
        await addDoc(collection(db, "USUARIOS"), {
            nombre,
            apellidop,
            apellidom,
            numeroEmpleado,
            email, // ⚠️ Recomendación: NO guardar contraseñas en texto plano
            sucursal,
            telefono,
            nivelacceso,
            fechaRegistro: new Date()
        });

        mensajeDeExito("Registro exitoso", "./index.html");

    } catch (error) {
        console.error("Error en el registro:", error);

        if (error.code === 'auth/email-already-in-use') {
            mensajeAdvertencia("Este correo ya está registrado en Authentication");
        } else if (error.code === 'auth/weak-password') {
            mensajeAdvertencia("La contraseña es demasiado débil. Intenta con una más segura.");
        } else {
            mensajeAdvertencia("Ocurrió un error durante el registro");
        }
    }
}

// 🔹 Funciones auxiliares (CORREGIDAS)
async function verificarCorreoExistente(email) {
    const consultaEmail = query(collection(db, "USUARIOS"), where("email", "==", email));
    const querySnapshot = await getDocs(consultaEmail);
    return !querySnapshot.empty;
}

async function verificarBoletaExistente(numeroEmpleado) {
    const consultaNumero = query(collection(db, "USUARIOS"), where("numeroEmpleado", "==", numeroEmpleado));
    const querySnapshot = await getDocs(consultaNumero);
    return !querySnapshot.empty;
}

async function obtenerNivelAcceso(telefono) {
    const consulta = query(collection(db, "telefonosRegistro"), where("telefono", "==", telefono));
    const querySnapshot = await getDocs(consulta);

    if (!querySnapshot.empty) {
        const doc = querySnapshot.docs[0];
        return doc.data().nivelAcceso;
    }
    return null;
}

async function obtenerSucursal(telefono) {
    const consulta = query(collection(db, "telefonosRegistro"), where("telefono", "==", telefono));
    const querySnapshot = await getDocs(consulta);

    if (!querySnapshot.empty) {
        const doc = querySnapshot.docs[0];
        return doc.data().sucursal;
    }
    return null;
}

// 🔹 Event Listeners (CORREGIDOS)
taskForm.addEventListener('submit', subirUsuario); // Usar submit en lugar de click
taskForm.addEventListener('input', validarFormulario);

// 🔹 Función para actualizar estilos
function actualizarEstiloInput(input, valido) {
    const grupo = input.closest('.formulario__grupo');
    const icono = grupo.querySelector('i');
    const mensajeError = grupo.querySelector('.formulario__input-error');

    grupo.classList.toggle('formulario__grupo-incorrecto', !valido);
    grupo.classList.toggle('formulario__grupo-correcto', valido);

    if (icono) {
        icono.classList.toggle('fa-times-circle', !valido);
        icono.classList.toggle('fa-check-circle', valido);
    }

    if (mensajeError) {
        mensajeError.classList.toggle('formulario__input-error-activo', !valido);
    }
}
