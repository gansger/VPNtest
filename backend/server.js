import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import Groq from 'groq-sdk';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Инициализация Groq клиента
const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY
});

// Middleware
app.use(cors());
app.use(express.json());

// Системный промт для AI
const SYSTEM_PROMPT = `Ты — экспертный консультант по туризму. Твоя задача — анализировать ответы пользователя на вопросы о его предпочтениях и рекомендовать идеальный тип тура.

Доступные типы туров:
1. **Экстрим-тур** — для активных людей, любящих риск, адреналин, спорт (альпинизм, рафтинг, парашютизм).
2. **Релакс & СПА** — для уставших людей, ценящих комфорт, спокойствие, массаж, пляжный отдых.
3. **Культурно-исторический** — для любознательных, интересующихся музеями, архитектурой, историей, искусством.
4. **Гастрономический** — для гурманов, желающих попробовать местную кухню, вина, кулинарные мастер-классы.
5. **Природа & Эко** — для любителей тишины, лесов, гор, экологического туризма, наблюдения за природой.
6. **Тусовочный** — для любителей ночной жизни, клубов, фестивалей, вечеринок.

Ты должен вернуть ТОЛЬКО валидный JSON в следующем формате:
{
  "tour_type": "Название типа тура из списка выше",
  "description": "Подробное описание рекомендации (2-3 предложения) на русском языке, объясняющее почему этот тур подходит пользователю",
  "destination_example": "Конкретный пример направления для этого типа тура"
}

Не добавляй никакого текста до или после JSON. Только JSON.`;

// Endpoint для анализа ответов
app.post('/api/analyze', async (req, res) => {
  try {
    const { answers } = req.body;

    if (!answers) {
      return res.status(400).json({ error: 'Ответы не предоставлены' });
    }

    // Формируем пользовательский промт
    const userPrompt = `Проанализируй следующие ответы пользователя и порекомендуй идеальный тип тура:

${answers}

Помни: верни ТОЛЬКО валидный JSON без какого-либо дополнительного текста.`;

    // Вызов Groq API
    const completion = await groq.chat.completions.create({
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: userPrompt }
      ],
      model: 'llama3-70b-8192',
      temperature: 0.7,
      max_tokens: 500,
      response_format: { type: 'json_object' }
    });

    const responseContent = completion.choices[0]?.message?.content;

    if (!responseContent) {
      throw new Error('Пустой ответ от API');
    }

    // Парсим JSON ответ
    const recommendation = JSON.parse(responseContent);

    // Валидация ответа
    if (!recommendation.tour_type || !recommendation.description || !recommendation.destination_example) {
      throw new Error('Некорректная структура ответа от AI');
    }

    res.json(recommendation);
  } catch (error) {
    console.error('Error analyzing answers:', error);
    
    // Если ошибка парсинга JSON, пробуем извлечь JSON из ответа
    if (error instanceof SyntaxError) {
      console.error('JSON Parse Error:', error.message);
    }

    res.status(500).json({ 
      error: 'Ошибка при анализе ответов',
      details: error.message 
    });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Запуск сервера
app.listen(PORT, () => {
  console.log(`🚀 Backend server running on http://localhost:${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
  console.log(`🤖 Analyze endpoint: POST http://localhost:${PORT}/api/analyze`);
});
