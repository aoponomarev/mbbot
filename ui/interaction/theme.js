// Тема и применение оформления
window.cmpTheme = function (defaults) {
  const initialTheme = (defaults && defaults.theme) || 'light';
  return {
    data: {
      theme: initialTheme
    },
    methods: {
      applyTheme() {
        document.documentElement.setAttribute('data-bs-theme', this.theme);
      },
      toggleTheme() {
        this.theme = this.theme === 'light' ? 'dark' : 'light';
      },
      refreshPage() {
        // Устанавливаем флаг, чтобы пропустить сплэш при перезагрузке
        sessionStorage.setItem('skipSplash', 'true');
        location.reload();
      }
    },
    mounted(app) {
      const savedTheme = localStorage.getItem('theme');
      if (savedTheme) {
        app.theme = savedTheme;
      }
      app.applyTheme();
    },
    watch: {
      theme(newTheme) {
        localStorage.setItem('theme', newTheme);
        this.applyTheme();
      }
    }
  };
};
