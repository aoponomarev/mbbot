// UI функциональность приложения
// Переключение темы

function initThemeToggle(app) {
    // Добавить метод переключения темы в Vue приложение
    app.methods = app.methods || {};

    app.methods.applyTheme = function() {
        // Применить тему к элементу <html>
        document.documentElement.setAttribute('data-bs-theme', this.theme);
    };

    app.methods.toggleTheme = function() {
        this.theme = this.theme === 'light' ? 'dark' : 'light';
        // Сохранить выбор в localStorage
        localStorage.setItem('theme', this.theme);
    };

    // Добавить watcher для темы
    app.watch = app.watch || {};
    app.watch.theme = function(newTheme) {
        this.applyTheme();
    };

    // Добавить инициализацию темы в mounted
    const originalMounted = app.mounted || function() {};
    app.mounted = function() {
        originalMounted.call(this);

        // Загрузить сохраненную тему из localStorage
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme) {
            this.theme = savedTheme;
        }

        // Применить тему к элементу <html>
        this.applyTheme();
    };

    return app;
}

