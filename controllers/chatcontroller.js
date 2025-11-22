// controllers/chatcontroller.js
const prisma = require('../prismaClient');
const { obtenerRespuestaLumina } = require('../services/luminaAI');

const chatcontroller = async (req, res) => {
  try {
    const { message, mode, clientId = 'demo-client' } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Falta el mensaje del usuario' });
    }

    // 1. Buscar cliente por API KEY (clientId)
    let client = await prisma.client.findUnique({
      where: { api_key: clientId },
    });

    // 2. Si no existe, lo creamos
    if (!client) {
      client = await prisma.client.create({
        data: {
          name: `Cliente ${clientId}`,
          api_key: clientId,
        },
      });
    }

    // 3. Traer historial del cliente
    const historial = await prisma.message.findMany({
      where: { client_id: client.id },
      orderBy: { created_at: 'asc' },
      take: 20, // últimos 20 mensajes para contexto
    });

    const historyForModel = historial.map((msg) => ({
      role: msg.role === 'assistant' ? 'assistant' : 'user',
      content: msg.content,
    }));

    // 4. Obtener respuesta de Lumina (IA)
    const respuesta = await obtenerRespuestaLumina(
      message,
      mode,
      historyForModel
    );

    // 5. Guardar mensaje del usuario
    await prisma.message.create({
      data: {
        role: 'user',
        content: message,
        client_id: client.id,
      },
    });

    // 6. Guardar respuesta de la IA
    await prisma.message.create({
      data: {
        role: 'assistant',
        content: respuesta,
        client_id: client.id,
      },
    });

    // 7. Responder al frontend
    res.json({
      reply: respuesta,
      clientId,
    });
  } catch (error) {
    console.error('❌ Error en chatcontroller con Prisma:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// ➜ NUEVO CONTROLADOR: devuelve el historial de un clientId
const getHistory = async (req, res) => {
  try {
    const { clientId } = req.query;

    if (!clientId) {
      return res.status(400).json({ error: 'Falta el clientId en la query' });
    }

    // Buscar cliente por api_key
    const client = await prisma.client.findUnique({
      where: { api_key: clientId },
      include: {
        messages: {
          orderBy: { created_at: 'asc' },
        },
      },
    });

    if (!client) {
      // Si no existe ese cliente, devolvemos lista vacía
      return res.json({ messages: [] });
    }

    const messages = client.messages.map((m) => ({
      role: m.role,
      content: m.content,
      created_at: m.created_at,
    }));

    res.json({ messages });
  } catch (error) {
    console.error('❌ Error en getHistory:', error);
    res.status(500).json({ error: 'Error al obtener historial' });
  }
};

module.exports = { chatcontroller, getHistory };
