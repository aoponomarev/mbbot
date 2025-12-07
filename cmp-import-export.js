// Экспорт/импорт настроек
window.cmpImportExport = function () {
  return {
    data: {
      importStatus: null
    },
    methods: {
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
  };
};
