import { getFirestore, collection, addDoc, getDocs, setDoc, doc, updateDoc, deleteDoc, onSnapshot, query, where } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-auth.js";
import { app } from "./firebaseKey.js";

// --- Firestore setup ---
const db = getFirestore(app);
const auth = getAuth(app);

let userEmail = null;
let agendaCol = null;
let tasks = [];
let clients = [];
let calendar;
let reminders = {};

// --- Modo oscuro ---
function setDarkMode() {
    document.body.classList.toggle("darkmode");
    localStorage.setItem("agenda-dark", document.body.classList.contains("darkmode") ? "1" : "0");
}
document.addEventListener("DOMContentLoaded", () => {
    if (localStorage.getItem("agenda-dark") === "1") {
        document.body.classList.add("darkmode");
    }
});
window.setDarkMode = setDarkMode;

// --- FullCalendar ---
function initCalendar() {
    calendar = new FullCalendar.Calendar(document.getElementById("calendar"), {
        initialView: "dayGridMonth",
        headerToolbar: {
            left: "prev,next today",
            center: "title",
            right: "dayGridMonth,timeGridWeek,timeGridDay"
        },
        events: [],
        eventClick: function (info) {
            const task = tasks.find(t => t.id === info.event.id);
            if (task) fillTaskForm(task);
        },
        selectable: true,
        select: function (info) {
            clearTaskForm();
            document.getElementById("task-datetime").value = info.startStr.slice(0, 16);
        },
        eventDidMount: function (info) {
            if (info.event.extendedProps.priority === "alta") {
                info.el.style.borderLeft = "4px solid #dc3545";
            } else if (info.event.extendedProps.priority === "media") {
                info.el.style.borderLeft = "4px solid #ffc107";
            } else {
                info.el.style.borderLeft = "4px solid #198754";
            }
        }
    });
    calendar.render();
}

// --- CRUD Tareas ---
function uuid() {
    return crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2) + Date.now();
}
function showAlert(msg, type = "success") {
    Swal.fire({ text: msg, icon: type, timer: 2000, showConfirmButton: false });
}
function playSound() {
    const audio = new Audio("https://cdn.pixabay.com/audio/2022/03/15/audio_115b9b4b3e.mp3");
    audio.play();
}
async function saveTask(e) {
    e.preventDefault();
    const id = document.getElementById("task-id").value || uuid();
    const title = document.getElementById("task-title").value.trim();
    const start = document.getElementById("task-datetime").value;
    const duration = parseInt(document.getElementById("task-duration").value, 10);
    const priority = document.getElementById("task-priority").value;
    const notes = document.getElementById("task-notes").value;
    const reminder = document.getElementById("task-reminder").checked;

    // Organización automática: evitar solapamiento
    const end = new Date(new Date(start).getTime() + duration * 60000).toISOString().slice(0, 16);
    const overlap = tasks.some(t =>
        t.id !== id &&
        ((start >= t.start && start < t.end) || (end > t.start && end <= t.end))
    );
    if (overlap) {
        showAlert("¡Solapamiento con otra tarea!", "warning");
        return;
    }

    const task = { id, type: "task", user: userEmail, title, start, end, duration, priority, notes, reminder };
    await setDoc(doc(agendaCol, id), task);
    showAlert("Tarea guardada");
    clearTaskForm();
}
function fillTaskForm(task) {
    document.getElementById("task-id").value = task.id;
    document.getElementById("task-title").value = task.title;
    document.getElementById("task-datetime").value = task.start;
    document.getElementById("task-duration").value = task.duration;
    document.getElementById("task-priority").value = task.priority;
    document.getElementById("task-notes").value = task.notes;
    document.getElementById("task-reminder").checked = !!task.reminder;
    document.getElementById("btn-delete-task").style.display = "inline-block";
}
function clearTaskForm() {
    document.getElementById("task-form").reset();
    document.getElementById("task-id").value = "";
    document.getElementById("btn-delete-task").style.display = "none";
}
document.getElementById("task-form").addEventListener("submit", saveTask);
document.getElementById("btn-add-task").addEventListener("click", clearTaskForm);
document.getElementById("btn-delete-task").addEventListener("click", async function () {
    const id = document.getElementById("task-id").value;
    if (id) {
        await deleteDoc(doc(agendaCol, id));
        showAlert("Tarea eliminada", "info");
        clearTaskForm();
    }
});

// --- CRUD Clientes ---
function fillClientForm(client) {
    document.getElementById("client-id").value = client.id;
    document.getElementById("client-name").value = client.name;
    document.getElementById("client-phone").value = client.phone;
    document.getElementById("client-birthday").value = client.birthday;
    document.getElementById("client-policy").value = client.policy;
    document.getElementById("client-notes").value = client.notes;
    document.getElementById("client-form").style.display = "block";
    document.getElementById("btn-delete-client").style.display = "inline-block";
}
function clearClientForm() {
    document.getElementById("client-form").reset();
    document.getElementById("client-id").value = "";
    document.getElementById("client-form").style.display = "none";
    document.getElementById("btn-delete-client").style.display = "none";
}
document.getElementById("btn-add-client").addEventListener("click", () => {
    clearClientForm();
    document.getElementById("client-form").style.display = "block";
});
document.getElementById("client-form").addEventListener("submit", async function (e) {
    e.preventDefault();
    const id = document.getElementById("client-id").value || uuid();
    const name = document.getElementById("client-name").value.trim();
    const phone = document.getElementById("client-phone").value.trim();
    const birthday = document.getElementById("client-birthday").value;
    const policy = document.getElementById("client-policy").value.trim();
    const notes = document.getElementById("client-notes").value;
    const client = { id, type: "client", user: userEmail, name, phone, birthday, policy, notes };
    await setDoc(doc(agendaCol, id), client);
    showAlert("Cliente guardado");
    clearClientForm();
});
document.getElementById("btn-delete-client").addEventListener("click", async function () {
    const id = document.getElementById("client-id").value;
    if (id) {
        await deleteDoc(doc(agendaCol, id));
        showAlert("Cliente eliminado", "info");
        clearClientForm();
    }
});

// --- Renderizar clientes ---
function renderClientsTable() {
    const tbody = document.getElementById("clients-tbody");
    const search = document.getElementById("client-search").value.toLowerCase();
    tbody.innerHTML = "";
    clients
        .filter(c => c.name.toLowerCase().includes(search) || c.phone.includes(search) || (c.policy && c.policy.includes(search)))
        .forEach(client => {
            const tr = document.createElement("tr");
            tr.innerHTML = `
                <td>${client.name}</td>
                <td>${client.phone}</td>
                <td>${client.birthday || ""}</td>
                <td>${client.policy || ""}</td>
                <td>${client.notes || ""}</td>
                <td>
                    <button class="btn btn-sm btn-outline-secondary" title="Editar"><i class="bi bi-pencil"></i></button>
                </td>
            `;
            tr.querySelector("button").onclick = () => fillClientForm(client);
            tbody.appendChild(tr);
        });
}
document.getElementById("client-search").addEventListener("input", renderClientsTable);

// --- Recordatorios y notificaciones ---
function checkReminders() {
    const now = new Date();
    tasks.forEach(task => {
        if (task.reminder && !reminders[task.id]) {
            const taskTime = new Date(task.start);
            if (taskTime > now && taskTime - now < 60000) {
                reminders[task.id] = true;
                showAlert(`¡Recordatorio: ${task.title}!`, "info");
                playSound();
                if (Notification.permission === "granted") {
                    new Notification("Agenda Digital", { body: `Recordatorio: ${task.title}` });
                }
            }
        }
    });
    // Cumpleaños y vencimientos
    const today = now.toISOString().slice(5, 10);
    clients.forEach(client => {
        if (client.birthday && client.birthday.slice(5, 10) === today && !reminders["bday" + client.id]) {
            reminders["bday" + client.id] = true;
            showAlert(`¡Hoy es cumpleaños de ${client.name}!`, "info");
            playSound();
        }
        // Simulación: vencimiento de póliza si hoy es el día
        if (client.policy && client.policy.endsWith(today.replace("-", "")) && !reminders["pol" + client.id]) {
            reminders["pol" + client.id] = true;
            showAlert(`¡Vence póliza de ${client.name}!`, "warning");
            playSound();
        }
    });
}

function mostrarRecordatoriosPendientes() {
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay()); // Domingo
    startOfWeek.setHours(0, 0, 0, 0);
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);

    // Tareas ya iniciadas y no eliminadas
    const pendientes = tasks.filter(task =>
        task.reminder &&
        new Date(task.start) <= now &&
        !localStorage.getItem("recordatorio_eliminado_" + task.id)
    );

    // Tareas de la semana (no eliminadas, no pasadas)
    const semana = tasks.filter(task =>
        task.reminder &&
        new Date(task.start) > now &&
        new Date(task.start) >= startOfWeek &&
        new Date(task.start) <= endOfWeek &&
        !localStorage.getItem("recordatorio_eliminado_" + task.id)
    );

    if (pendientes.length === 0 && semana.length === 0) return;

    let html = '';
    if (pendientes.length > 0) {
        html += '<b>Tareas pendientes:</b><ul style="list-style:none;padding:0;">';
        pendientes.forEach(task => {
            html += `
                <li style="margin-bottom:10px;">
                    <b>${task.title}</b><br>
                    <span>Hora: ${new Date(task.start).toLocaleString()}</span><br>
                    <button class="btn btn-sm btn-danger" data-taskid="${task.id}">Eliminar recordatorio</button>
                </li>
            `;
        });
        html += '</ul>';
    }
    if (semana.length > 0) {
        html += '<b>Recordatorios de esta semana:</b><ul style="list-style:none;padding:0;">';
        semana.forEach(task => {
            html += `
                <li style="margin-bottom:10px;">
                    <b>${task.title}</b><br>
                    <span>Hora: ${new Date(task.start).toLocaleString()}</span><br>
                    <button class="btn btn-sm btn-danger" data-taskid="${task.id}">Eliminar recordatorio</button>
                </li>
            `;
        });
        html += '</ul>';
    }

    Swal.fire({
        title: 'Recordatorios',
        html: html,
        icon: 'info',
        showConfirmButton: true,
        confirmButtonText: 'Cerrar',
        didOpen: () => {
            document.querySelectorAll('button[data-taskid]').forEach(btn => {
                btn.addEventListener('click', function (e) {
                    e.stopPropagation();
                    const taskId = this.getAttribute('data-taskid');
                    localStorage.setItem("recordatorio_eliminado_" + taskId, "1");
                    this.parentElement.style.display = "none";
                });
            });
        }
    });
}

setInterval(checkReminders, 30000);
if ("Notification" in window && Notification.permission !== "granted") {
    Notification.requestPermission();
}

// --- Exportar/Importar ---
document.getElementById("btn-export-json").addEventListener("click", () => {
    const data = JSON.stringify({ tasks, clients }, null, 2);
    const blob = new Blob([data], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "agenda.json";
    a.click();
    URL.revokeObjectURL(url);
});
document.getElementById("btn-export-csv").addEventListener("click", () => {
    const csv = Papa.unparse([
        ...tasks.map(t => ({ ...t, __type: "task" })),
        ...clients.map(c => ({ ...c, __type: "client" }))
    ]);
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "agenda.csv";
    a.click();
    URL.revokeObjectURL(url);
});
document.getElementById("import-file").addEventListener("change", async function (e) {
    const file = e.target.files[0];
    if (!file) return;
    if (file.name.endsWith(".json")) {
        const data = JSON.parse(await file.text());
        if (data.tasks) for (const t of data.tasks) await setDoc(doc(agendaCol, t.id), t);
        if (data.clients) for (const c of data.clients) await setDoc(doc(agendaCol, c.id), c);
        showAlert("Importación JSON completada");
    } else if (file.name.endsWith(".csv")) {
        Papa.parse(file, {
            header: true,
            complete: async (results) => {
                for (const row of results.data) {
                    if (row.__type === "task") await setDoc(doc(agendaCol, row.id), row);
                    if (row.__type === "client") await setDoc(doc(agendaCol, row.id), row);
                }
                showAlert("Importación CSV completada");
            }
        });
    }
    e.target.value = "";
});

// --- Sincronización en tiempo real ---
function listenAgenda() {
    const q = query(agendaCol, where("user", "==", userEmail));
    onSnapshot(q, (snapshot) => {
        tasks = [];
        clients = [];
        snapshot.forEach(docSnap => {
            const data = docSnap.data();
            if (data.type === "task") tasks.push(data);
            if (data.type === "client") clients.push(data);
        });
        // Render calendario
        if (calendar) {
            calendar.removeAllEvents();
            tasks.forEach(task => {
                calendar.addEvent({
                    id: task.id,
                    title: task.title,
                    start: task.start,
                    end: task.end,
                    priority: task.priority,
                    notes: task.notes
                });
            });
        }
        renderClientsTable();
        // Mostrar recordatorios pendientes solo al cargar la agenda tras login
        if (window._mostrarRecordatoriosPendientesOnce !== false) {
            window._mostrarRecordatoriosPendientesOnce = false;
            setTimeout(mostrarRecordatoriosPendientes, 500); // Espera breve para asegurar render
        }
    });
}

// --- Inicialización con autenticación ---
onAuthStateChanged(auth, async (user) => {
    if (!user) {
        window.location.href = "index.html";
        return;
    }
    userEmail = user.email;
    agendaCol = collection(db, "agenda");
    if (!calendar) initCalendar();
    window._mostrarRecordatoriosPendientesOnce = true;
    listenAgenda();
});
