// =========================
// УТИЛИТЫ ДЛЯ РАБОТЫ С PERPLEXITY API
// Независимый модуль (не Vue компонент), экспортирует функции через window
// =========================
// Этот модуль содержит чистые функции для работы с Perplexity API:
// - Отправка запросов к Perplexity Chat Completions API
// - Обработка ошибок и форматирование ответов
//
// ВАЖНО: Функции не зависят от Vue компонентов и могут использоваться
// в любом контексте.

// =========================
// API ФУНКЦИИ
// =========================

/**
 * sendPerplexityRequest(apiKey, model, messages, timeoutManager)
 * Отправка запроса к Perplexity Chat Completions API
 * 
 * @param {string} apiKey - API ключ Perplexity
 * @param {string} model - Модель Perplexity (например: 'sonar-pro', 'sonar')
 * @param {Array<Object>} messages - Массив сообщений в формате {role: 'user'|'assistant', content: string}
 * @param {Object} timeoutManager - Объект для управления адаптивным таймаутом (опционально)
 *   - increaseAdaptiveTimeout() - увеличить таймаут при rate limiting
 *   - decreaseAdaptiveTimeout() - уменьшить таймаут при успешном запросе
 *   - adaptiveTimeout - текущее значение таймаута в миллисекундах
 * @returns {Promise<string>} Текст ответа от Perplexity AI
 * @throws {Error} При ошибке HTTP запроса или пустом ответе
 */
async function sendPerplexityRequest(apiKey, model, messages, timeoutManager) {
  if (!apiKey || !model || !messages || messages.length === 0) {
    throw new Error('Необходимы apiKey, model и messages для запроса к Perplexity');
  }

  try {
    const response = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        model: model,
        messages: messages.map(msg => ({
          role: msg.role,
          content: msg.content
        }))
      })
    });

    if (!response.ok) {
      // Обработка rate limiting (429)
      if (response.status === 429 && timeoutManager) {
        timeoutManager.increaseAdaptiveTimeout();
        // Добавляем задержку перед следующей попыткой
        if (timeoutManager.adaptiveTimeout) {
          await new Promise(resolve => setTimeout(resolve, timeoutManager.adaptiveTimeout));
        }
      }

      const errorData = await response.json().catch(() => ({ error: { message: 'Неизвестная ошибка' } }));
      throw new Error(errorData.error?.message || `HTTP ${response.status}: ${response.statusText}`);
    }

    // Успешный запрос - уменьшаем таймаут
    if (timeoutManager) {
      timeoutManager.decreaseAdaptiveTimeout();
    }

    const data = await response.json();

    if (data.choices && data.choices.length > 0) {
      const answer = data.choices[0].message.content;
      if (!answer || answer.trim().length === 0) {
        throw new Error('Пустой ответ от API');
      }
      return answer;
    } else {
      throw new Error('Пустой ответ от API');
    }
  } catch (error) {
    // Если это уже наша ошибка - пробрасываем её дальше
    if (error instanceof Error && error.message) {
      throw error;
    }
    // Иначе оборачиваем в общую ошибку
    throw new Error(`Ошибка при запросе к Perplexity: ${error.message || 'Неизвестная ошибка'}`);
  }
}

// Экспорт функций через window для использования в других модулях
try {
  window.perplexityAPI = {
    sendPerplexityRequest
  };
  console.log('✅ perplexityAPI module loaded successfully');
} catch (error) {
  console.error('❌ perplexityAPI module failed to load:', error);
}

