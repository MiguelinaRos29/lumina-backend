// public/panel.js

// URL del backend (Render)
const API_URL = "https://lumina-backend-5-oy8n.onrender.com";

// Usaremos un clientId fijo para la web (por ahora)
const clientId = "web_client_demo";
const companyId = "company_web_demo"; // demo para distinguir la web

document.getElementById("clientIdLabel").textContent = clientId;

const messagesDiv = document.getElementById("messages");
const citasDiv = document.getElementById("citasLista");
const messageInput = document.getElementById("messageInput");
const sendBtn = document.getElementById("sendBtn");
const modeSelect = document.getElementById("modeSelect");

const citaForm = document.getElementById("citaForm");
const fechaInput = document.getElementById("fechaInput");
const horaInput = document.getElementById("horaInput");
const duracionInput = document.getElementById("duracionInput");
const propositoInput = document.getElementById("propositoInput");

// Helpers para pintar mensajes
function addMessage(role, content) {
  const div = document.createElement("div");
  div.classList.add("message", role === "user" ? "user" : "assistant");
  const span = document.createElement("span");
  span.classList.add("role");
  span.textContent = role === "user" ? "Tú:" : "MyClarix:";
  div.appendChild(span);
  div.append(" " + content);
  messagesDiv.appendChild(div);
  messagesDiv.scrollTop = messagesDiv.scrollHeight;
}

// Cargar historial al abrir
async function loadHistory() {
  try {
    const res = await fetch(
      `${API_URL}/api/chat/history?clientId=${encodeURIComponent(clientId)}`,
      {
        headers: {
          "x-client-id": clientId,
          "x-company-id": companyId,
        },
      }
    );

    const data = await res.json();
    messagesDiv.innerHTML = "";
    if (data.messages && Array.isArray(data.messages)) {
      data.messages.forEach((msg) => {
        addMessage(msg.role, msg.content);
      });
    }
  } catch (err) {
    console.error("Error cargando historial:", err);
  }
}

// Enviar mensaje de chat
async function sendMessage() {
  const text = messageInput.value.trim();
  if (!text) return;

  const mode = modeSelect.value || null;

  addMessage("user", text);
  messageInput.value = "";

  try {
    const res = await fetch(`${API_URL}/api/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-client-id": clientId,
        "x-company-id": companyId,
      },
      body: JSON.stringify({
        clientId,
        message: text,
        mode,
      }),
    });

    const data = await res.json();
    console.log("🔍 Respuesta /api/chat:", res.status, data);

    // Si el servidor devuelve error (500, 400, etc.)
    if (!res.ok) {
      addMessage(
        "assistant",
        data.error || `Error del servidor (status ${res.status})`
      );
      return;
    }

    if (data.reply) {
      addMessage("assistant", data.reply);
    } else {
      addMessage(
        "assistant",
        data.error || "[Sin respuesta del servidor, revisa logs]"
      );
    }
  } catch (err) {
    console.error("Error enviando mensaje:", err);
    addMessage("assistant", "Ha ocurrido un error al enviar el mensaje.");
  }
}


// Listeners
sendBtn.addEventListener("click", sendMessage);
messageInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    e.preventDefault();
    sendMessage();
  }
});

// -----------------------------
// Citas
// -----------------------------

async function loadCitas() {
  try {
    const res = await fetch(
      `${API_URL}/api/appointments?clientId=${encodeURIComponent(clientId)}`,
      {
        headers: {
          "x-client-id": clientId,
          "x-company-id": companyId,
        },
      }
    );

    const data = await res.json();
    citasDiv.innerHTML = "";
    if (Array.isArray(data) && data.length > 0) {
      data.forEach((cita) => {
        const div = document.createElement("div");
        div.classList.add("cita");
        div.innerHTML = `
          <div><strong>${cita.fecha || ""} ${cita.hora || ""}</strong></div>
          <div>${cita.proposito || ""}</div>
          <div class="small">Duración: ${cita.duracion || "-"} min</div>
        `;
        citasDiv.appendChild(div);
      });
    } else {
      citasDiv.innerHTML =
        '<div class="small">No hay citas registradas.</div>';
    }
  } catch (err) {
    console.error("Error cargando citas:", err);
    citasDiv.innerHTML = '<div class="small">Error al cargar citas.</div>';
  }
}

citaForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const fecha = fechaInput.value;
  const hora = horaInput.value;
  const duracion = duracionInput.value
    ? parseInt(duracionInput.value, 10)
    : null;
  const proposito = propositoInput.value.trim();

  if (!fecha || !hora) {
    alert("Fecha y hora son obligatorias");
    return;
  }

  try {
    const res = await fetch(`${API_URL}/api/appointments`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-client-id": clientId,
        "x-company-id": companyId,
      },
      body: JSON.stringify({
        clientId,
        fecha,
        hora,
        duracion,
        proposito,
      }),
    });

    const data = await res.json();
    if (res.ok) {
      alert("Cita creada correctamente");
      // limpiar formulario
      propositoInput.value = "";
      duracionInput.value = "";
      // recargar citas
      loadCitas();
    } else {
      alert(data.error || "Error al crear cita");
    }
  } catch (err) {
    console.error("Error creando cita:", err);
    alert("Error al crear cita");
  }
});

// Cargar datos al iniciar
loadHistory();
loadCitas();

