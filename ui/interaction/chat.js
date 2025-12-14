// Чат с Perplexity: сообщения, отправка запроса, автопрокрутка
window.cmpChat = function () {
  return {
    data: {
      messages: [],
      currentQuestion: '',
      isLoading: false,
      error: null
    },
    methods: {
      async askPerplexity() {
        if (!this.perplexityApiKey || !this.currentQuestion.trim() || this.isLoading) {
          return;
        }

        // Проверяем доступность API утилиты
        if (!window.perplexityAPI || !window.perplexityAPI.sendPerplexityRequest) {
          console.error('perplexityAPI module not loaded');
          this.error = 'Модуль Perplexity API не загружен';
          return;
        }

        const question = this.currentQuestion.trim();
        this.currentQuestion = '';
        this.error = null;
        this.isLoading = true;

        this.messages.push({ role: 'user', content: question });

        try {
          // Используем утилиту из core/api/perplexity.js
          const answer = await window.perplexityAPI.sendPerplexityRequest(
            this.perplexityApiKey,
            this.perplexityModel,
            this.messages,
            null // timeoutManager опционален, пока не используется
          );

          this.messages.push({ role: 'assistant', content: answer });
        } catch (error) {
          console.error('Ошибка при запросе к Perplexity:', error);
          this.error = error.message || 'Произошла ошибка при запросе к Perplexity AI';
          // Удаляем последнее сообщение пользователя при ошибке
          if (this.messages.length > 0 && this.messages[this.messages.length - 1].role === 'user') {
            this.messages.pop();
          }
        } finally {
          this.isLoading = false;
        }
      },
      clearChat() {
        this.messages = [];
        this.error = null;
      },
      formatMessage(text) {
        return text.replace(/\n/g, '<br>');
      }
    },
    watch: {
      messages() {
        this.$nextTick(() => {
          const container = this.$refs.messagesContainer;
          if (container) {
            container.scrollTop = container.scrollHeight;
          }
        });
      }
    }
  };
};
