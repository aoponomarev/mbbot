// Конфигурация приложения (обычные скрипты, совместимо с file://)
// Примечание: API-ключи и PIN-коды хранятся обфусцированными через u-sec-obfuscate.js
window.appConfig = {
  defaults: {
    theme: 'light',
    perplexityModel: 'sonar-pro',
    // defaultApiKey используется как fallback, если пользователь не установил свой ключ
    defaultApiKey: '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'
  },
  models: [
    { value: 'sonar-pro', label: 'sonar-pro' },
    { value: 'sonar', label: 'sonar' },
    { value: 'llama-3.1-sonar-small-128k-online', label: 'llama-3.1-sonar-small-128k-online' },
    { value: 'llama-3.1-sonar-large-128k-online', label: 'llama-3.1-sonar-large-128k-online' }
  ],
  lastCommitMessage: 'Fix window.uiElementHelper access in Vue templates and restore icons catalog'
};
