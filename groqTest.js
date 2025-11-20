// groqTest.js
require('dotenv').config();

console.log('▶ Iniciando test de Groq...');
console.log('¿Hay API key?', !!process.env.GROQ_API_KEY);

const GROQ_API_KEY = process.env.GROQ_API_KEY;

async function testGroq() {
  try {
    if (!GROQ_API_KEY) {
      console.log('❌ No hay GROQ_API_KEY en el .env');
      return;
    }

    console.log('🔄 Llamando a la API de Groq...');

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GROQ_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',


        
        messages: [
          { role: 'system', content: 'Eres una asistente llamada Lumina.' },
          { role: 'user', content: 'Hola Lumina, ¿puedes saludarme?' }
        ],
        temperature: 0.7
      })
    });

    console.log('✅ Respuesta recibida, procesando JSON...');
    const data = await response.json();
    console.log('📩 Respuesta de Groq:\n', JSON.stringify(data, null, 2));

  } catch (err) {
    console.error('💥 Error llamando a Groq:', err);
  }
}

testGroq();
