// Экспорт/импорт настроек проекта
// Универсальная система для всех настроек приложения
// Поддерживает обфусцированное хранение чувствительных данных (PIN, API-ключи)
// Автоматически собирает все настройки из localStorage
window.cmpImportExport = function () {
  // Ключи обфусцированных данных (хранятся через securityObfuscate)
  const SECURE_KEYS = ['app-pin', 'perplexity-api-key'];
  
  // Ключи, которые НЕ должны экспортироваться (служебные, временные)
  const EXCLUDED_KEYS = ['skipSplash']; // sessionStorage ключи и другие служебные

  return {
    data: {
      importStatus: null
    },
    methods: {
      /**
       * Собирает все настройки из localStorage для экспорта
       * Автоматически определяет обычные и обфусцированные настройки
       * @returns {Object} Объект с настройками для экспорта
       */
      collectAllSettings() {
        const settings = {
          _version: '3.0', // Версия формата (3.0 - универсальная система)
          _obfuscated: true, // Флаг, что чувствительные данные обфусцированы
          // Обычные настройки (не обфусцированные)
          regularSettings: {},
          // Обфусцированные настройки (чувствительные данные)
          secureData: {}
        };

        // Собираем все ключи из localStorage
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          
          // Пропускаем исключенные ключи
          if (EXCLUDED_KEYS.includes(key)) {
            continue;
          }

          // Проверяем, является ли ключ обфусцированным
          if (SECURE_KEYS.includes(key)) {
            // Обфусцированные данные: сохраняем как есть (уже обфусцированы)
            const obfuscatedValue = localStorage.getItem(key);
            if (obfuscatedValue) {
              // Преобразуем ключ в понятное имя для экспорта
              const exportKey = key === 'app-pin' ? 'pin' : 
                               key === 'perplexity-api-key' ? 'apiKeyPerplexity' : key;
              settings.secureData[exportKey] = obfuscatedValue;
            }
          } else {
            // Обычные настройки: сохраняем напрямую
            try {
              const value = localStorage.getItem(key);
              // Пытаемся распарсить JSON, если не получается - сохраняем как строку
              try {
                settings.regularSettings[key] = JSON.parse(value);
              } catch {
                settings.regularSettings[key] = value;
              }
            } catch (error) {
              console.warn(`Не удалось экспортировать настройку ${key}:`, error);
            }
          }
        }

        // Добавляем реактивные настройки из Vue (если они не в localStorage)
        // Например, theme может быть в this.theme, но не в localStorage
        if (this.theme && !settings.regularSettings.theme) {
          settings.regularSettings.theme = this.theme;
        }
        if (this.perplexityModel && !settings.regularSettings.perplexityModel) {
          settings.regularSettings.perplexityModel = this.perplexityModel;
        }

        return settings;
      },

      /**
       * Экспортирует все настройки проекта в JSON файл
       */
      exportSettings() {
        try {
          const settings = this.collectAllSettings();

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
            message: 'Настройки проекта успешно экспортированы (чувствительные данные обфусцированы)'
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

      /**
       * Восстанавливает все настройки из импортированного файла
       * Поддерживает обратную совместимость со старыми форматами (v1.0, v2.0)
       * @param {Object} settings - Объект с настройками из файла
       */
      restoreAllSettings(settings) {
        const version = settings._version || (settings._obfuscated ? '2.0' : '1.0');

        // Обратная совместимость: старый формат v1.0 (открытые данные)
        if (version === '1.0' || (!settings._obfuscated && !settings.regularSettings)) {
          console.warn('Importing legacy format (v1.0) - converting to secure format');
          
          // Обработка темы
          if (settings.theme !== undefined) {
            this.theme = settings.theme;
            localStorage.setItem('theme', settings.theme);
            if (typeof this.applyTheme === 'function') {
              this.applyTheme();
            }
          }

          // Обработка модели
          if (settings.perplexityModel !== undefined) {
            this.perplexityModel = settings.perplexityModel;
            localStorage.setItem('perplexityModel', settings.perplexityModel);
          }

          // Обработка открытого API-ключа (обфусцируем и сохраняем)
          if (settings.perplexityApiKey !== undefined) {
            window.securityObfuscate?.saveSecure('perplexity-api-key', settings.perplexityApiKey);
            if (this.perplexityApiKey !== undefined) {
              this.perplexityApiKey = settings.perplexityApiKey;
            }
          }

          return;
        }

        // Обратная совместимость: формат v2.0 (обфусцированные данные, но без regularSettings)
        if (version === '2.0' && !settings.regularSettings) {

          // Обработка темы
          if (settings.theme !== undefined) {
            localStorage.setItem('theme', settings.theme);
            this.theme = settings.theme; // watch автоматически применит тему
          }

          // Обработка модели
          if (settings.perplexityModel !== undefined) {
            localStorage.setItem('perplexityModel', settings.perplexityModel);
            this.perplexityModel = settings.perplexityModel;
          }

          // Обработка обфусцированных данных
          if (settings.secureData) {
            // PIN
            if (settings.secureData.pin) {
              localStorage.setItem('app-pin', settings.secureData.pin);
            }

            // API-ключ: сохраняем обфусцированное значение и разворачиваем для UI
            if (settings.secureData.apiKeyPerplexity) {
              localStorage.setItem('perplexity-api-key', settings.secureData.apiKeyPerplexity);
              if (this.perplexityApiKey !== undefined && window.securityObfuscate) {
                this.perplexityApiKey = window.securityObfuscate.deobfuscate(settings.secureData.apiKeyPerplexity);
              }
            }
          }

          return;
        }

        // Новый формат v3.0 (универсальная система)
        if (version === '3.0' || settings.regularSettings) {
          // Восстанавливаем обычные настройки
          if (settings.regularSettings) {
            Object.keys(settings.regularSettings).forEach(key => {
              // Пропускаем исключенные ключи
              if (EXCLUDED_KEYS.includes(key)) {
                return;
              }

              try {
                const value = settings.regularSettings[key];
                // Сохраняем в localStorage
                if (typeof value === 'string') {
                  localStorage.setItem(key, value);
                } else {
                  localStorage.setItem(key, JSON.stringify(value));
                }

                // Обновляем реактивные свойства Vue, если они существуют
                // watch в cmpTheme автоматически применит изменения
                if (key === 'theme' && this.theme !== undefined) {
                  this.theme = value;
                } else if (key === 'perplexityModel' && this.perplexityModel !== undefined) {
                  this.perplexityModel = value;
                }
              } catch (error) {
                console.warn(`Не удалось восстановить настройку ${key}:`, error);
              }
            });
          }

          // Восстанавливаем обфусцированные данные
          if (settings.secureData) {
            // Маппинг экспортированных ключей на реальные ключи localStorage
            const secureKeyMap = {
              'pin': 'app-pin',
              'apiKeyPerplexity': 'perplexity-api-key'
            };

            Object.keys(settings.secureData).forEach(exportKey => {
              const storageKey = secureKeyMap[exportKey] || exportKey;
              
              if (SECURE_KEYS.includes(storageKey)) {
                // Сохраняем обфусцированное значение как есть
                localStorage.setItem(storageKey, settings.secureData[exportKey]);
                
                // Разворачиваем для UI, если свойство существует
                if (exportKey === 'apiKeyPerplexity' && this.perplexityApiKey !== undefined && window.securityObfuscate) {
                  this.perplexityApiKey = window.securityObfuscate.deobfuscate(settings.secureData[exportKey]);
                }
              }
            });
          }
        }
      },

      /**
       * Импортирует настройки проекта из JSON файла
       */
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

            // Восстанавливаем все настройки
            this.restoreAllSettings(settings);

            // Проверяем, были ли импортированы данные монет
            const hasCoinsData = !!(settings.regularSettings && (
              settings.regularSettings.cgCoins || 
              settings.regularSettings.cgSelectedCoins
            ));
            
            // Если были импортированы данные монет - обновляем компонент coins-manager
            if (hasCoinsData) {
              // Используем $nextTick для гарантии, что все компоненты обновлены
              this.$nextTick(() => {
                // ВАЖНО: Компонент coins-manager может быть не смонтирован, если открыты настройки (v-if скрывает его)
                // Поэтому всегда используем событие для надежности - компонент подпишется на него при монтировании
                window.dispatchEvent(new CustomEvent('coins-data-imported'));
              });
            }

            const version = settings._version || (settings._obfuscated ? '2.0' : '1.0');
            this.importStatus = {
              type: 'success',
              message: `Настройки проекта импортированы (формат: v${version})`
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
