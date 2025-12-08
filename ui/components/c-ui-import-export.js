// Экспорт/импорт настроек
// Поддерживает обфусцированное хранение чувствительных данных (PIN, API-ключи)
window.cmpImportExport = function () {
  const STORAGE_KEY_PIN = 'app-pin';
  const STORAGE_KEY_API = 'perplexity-api-key';

  return {
    data: {
      importStatus: null
    },
    methods: {
      exportSettings() {
        try {
          // Получаем обфусцированные значения напрямую из localStorage
          const obfuscatedPin = localStorage.getItem(STORAGE_KEY_PIN) || '';
          const obfuscatedApiKey = localStorage.getItem(STORAGE_KEY_API) || '';

          const settings = {
            _version: '2.0', // Версия формата для обратной совместимости
            _obfuscated: true, // Флаг, что чувствительные данные обфусцированы
            theme: this.theme,
            perplexityModel: this.perplexityModel,
            messages: this.messages,
            // Сохраняем обфусцированные значения (не разворачиваем)
            secureData: {
              pin: obfuscatedPin,
              apiKeyPerplexity: obfuscatedApiKey
            }
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
            message: 'Настройки успешно экспортированы (PIN и API-ключ обфусцированы)'
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

            // Обработка темы
            if (settings.theme !== undefined) {
              this.theme = settings.theme;
              localStorage.setItem('theme', settings.theme);
              this.applyTheme();
            }

            // Обработка модели
            if (settings.perplexityModel !== undefined) {
              this.perplexityModel = settings.perplexityModel;
              localStorage.setItem('perplexityModel', settings.perplexityModel);
            }

            // Обработка сообщений
            if (settings.messages !== undefined && Array.isArray(settings.messages)) {
              this.messages = settings.messages;
            }

            // Обработка чувствительных данных (PIN и API-ключ)
            // Поддержка старого формата (v1.0 - открытые данные)
            if (settings.perplexityApiKey !== undefined && !settings._obfuscated) {
              // Старый формат: открытый ключ - обфусцируем и сохраняем
              console.warn('Importing legacy format (v1.0) - obfuscating API key');
              window.securityObfuscate.saveSecure(STORAGE_KEY_API, settings.perplexityApiKey);
              this.perplexityApiKey = settings.perplexityApiKey;
            }

            // Поддержка нового формата (v2.0 - обфусцированные данные)
            if (settings._obfuscated && settings.secureData) {
              console.log('Importing new format (v2.0) - data already obfuscated');

              // PIN: сохраняем обфусцированное значение как есть
              if (settings.secureData.pin) {
                localStorage.setItem(STORAGE_KEY_PIN, settings.secureData.pin);
              }

              // API-ключ: сохраняем обфусцированное значение и разворачиваем для UI
              if (settings.secureData.apiKeyPerplexity) {
                localStorage.setItem(STORAGE_KEY_API, settings.secureData.apiKeyPerplexity);
                this.perplexityApiKey = window.securityObfuscate.deobfuscate(settings.secureData.apiKeyPerplexity);
              }
            }

            this.importStatus = {
              type: 'success',
              message: `Настройки импортированы (формат: ${settings._obfuscated ? 'v2.0 обфусцированный' : 'v1.0 legacy'})`
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
