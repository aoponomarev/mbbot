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

        const question = this.currentQuestion.trim();
        this.currentQuestion = '';
        this.error = null;
        this.isLoading = true;

        this.messages.push({ role: 'user', content: question });

        try {
          const response = await fetch('https://api.perplexity.ai/chat/completions', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${this.perplexityApiKey}`,
              'Content-Type': 'application/json',
              'Accept': 'application/json'
            },
            body: JSON.stringify({
              model: this.perplexityModel,
              messages: this.messages.map(msg => ({
                role: msg.role,
                content: msg.content
              }))
            })
          });

          if (!response.ok) {
            const errorData = await response.json().catch(() => ({ error: { message: 'Неизвестная ошибка' } }));
            throw new Error(errorData.error?.message || `HTTP ${response.status}: ${response.statusText}`);
          }

          const data = await response.json();

          if (data.choices && data.choices.length > 0) {
            const answer = data.choices[0].message.content;
            this.messages.push({ role: 'assistant', content: answer });
          } else {
            throw new Error('Пустой ответ от API');
          }
        } catch (error) {
          console.error('Ошибка при запросе к Perplexity:', error);
          this.error = error.message || 'Произошла ошибка при запросе к Perplexity AI';
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
