// Инициализация Vue без module/fetch, совместимо с file://
(function () {
  const fallbackConfig = {
    defaults: {
      theme: 'light',
      perplexityModel: 'sonar-pro',
      defaultApiKey: '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'
    }
  };

  const cfg = window.appConfig || fallbackConfig;
  const defaults = cfg.defaults || fallbackConfig.defaults;

  const { createApp } = Vue;

  createApp({
    data() {
      return {
        vueVersion: '3.5.25',
        theme: defaults.theme || 'light',
        perplexityApiKey: '',
        perplexityModel: defaults.perplexityModel || 'sonar-pro',
        showApiKey: false,
        messages: [],
        currentQuestion: '',
        isLoading: false,
        error: null,
        importStatus: null
      };
    },
    mounted() {
      this.vueVersion = Vue.version || '3.x';

      const savedTheme = localStorage.getItem('theme');
      if (savedTheme) {
        this.theme = savedTheme;
      }

      const savedApiKey = localStorage.getItem('perplexityApiKey');
      if (savedApiKey) {
        this.perplexityApiKey = savedApiKey;
      } else if (defaults.defaultApiKey) {
        this.perplexityApiKey = defaults.defaultApiKey;
        localStorage.setItem('perplexityApiKey', defaults.defaultApiKey);
      }

      const savedModel = localStorage.getItem('perplexityModel');
      if (savedModel) {
        this.perplexityModel = savedModel;
      }

      this.applyTheme();

      console.log('Vue.js загружен:', this.vueVersion);
      console.log('Bootstrap загружен');
      console.log('Font Awesome загружен');
    },
    watch: {
      theme(newTheme) {
        this.applyTheme();
        localStorage.setItem('theme', newTheme);
      },
      perplexityModel(newModel) {
        localStorage.setItem('perplexityModel', newModel);
      },
      messages() {
        this.$nextTick(() => {
          const container = this.$refs.messagesContainer;
          if (container) {
            container.scrollTop = container.scrollHeight;
          }
        });
      }
    },
    methods: {
      applyTheme() {
        document.documentElement.setAttribute('data-bs-theme', this.theme);
      },
      toggleTheme() {
        this.theme = this.theme === 'light' ? 'dark' : 'light';
      },
      saveApiKey() {
        if (this.perplexityApiKey) {
          localStorage.setItem('perplexityApiKey', this.perplexityApiKey);
        } else {
          localStorage.removeItem('perplexityApiKey');
        }
      },
      toggleApiKeyVisibility() {
        this.showApiKey = !this.showApiKey;
        const input = document.getElementById('apiKey');
        if (input) {
          input.type = this.showApiKey ? 'text' : 'password';
        }
      },
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
      },
      exportSettings() {
        try {
          const settings = {
            theme: this.theme,
            perplexityApiKey: this.perplexityApiKey,
            perplexityModel: this.perplexityModel,
            messages: this.messages
          };

          const jsonString = JSON.stringify(settings, null, 2);
          const blob = new Blob([jsonString], { type: 'application/json' });
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = 'data-app.json';
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(url);

          this.importStatus = {
            type: 'success',
            message: 'Настройки успешно экспортированы в data-app.json'
          };
          setTimeout(() => {
            this.importStatus = null;
          }, 3000);
        } catch (error) {
          console.error('Ошибка при экспорте:', error);
          this.importStatus = {
            type: 'error',
            message: 'Ошибка при экспорте настроек: ' + error.message
          };
        }
      },
      triggerImport() {
        this.$refs.fileInput.click();
      },
      importSettings(event) {
        const file = event.target.files[0];
        if (!file) {
          return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
          try {
            const settings = JSON.parse(e.target.result);

            if (typeof settings !== 'object') {
              throw new Error('Неверный формат файла');
            }

            if (settings.theme !== undefined) {
              this.theme = settings.theme;
              localStorage.setItem('theme', settings.theme);
              this.applyTheme();
            }

            if (settings.perplexityApiKey !== undefined) {
              this.perplexityApiKey = settings.perplexityApiKey;
              localStorage.setItem('perplexityApiKey', settings.perplexityApiKey);
            }

            if (settings.perplexityModel !== undefined) {
              this.perplexityModel = settings.perplexityModel;
              localStorage.setItem('perplexityModel', settings.perplexityModel);
            }

            if (settings.messages !== undefined && Array.isArray(settings.messages)) {
              this.messages = settings.messages;
            }

            this.importStatus = {
              type: 'success',
              message: 'Настройки успешно импортированы из data-app.json'
            };
            setTimeout(() => {
              this.importStatus = null;
            }, 3000);

            event.target.value = '';
          } catch (error) {
            console.error('Ошибка при импорте:', error);
            this.importStatus = {
              type: 'error',
              message: 'Ошибка при импорте настроек: ' + error.message
            };
            event.target.value = '';
          }
        };
        reader.onerror = () => {
          this.importStatus = {
            type: 'error',
            message: 'Ошибка при чтении файла'
          };
          event.target.value = '';
        };
        reader.readAsText(file);
      }
    }
  }).mount('#app');
})();
