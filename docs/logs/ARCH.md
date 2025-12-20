# Архитектура, структура файлов/компонентов, js/api/io

## Коммит: 20.12.2025 - Move thematic logs to docs/logs and rename to match chat tabs

◆ Тематические логи перемещены из `history/` в `docs/logs/` с переименованием файлов для соответствия вкладкам чатов агента. Обновлена структура: `UI.md` → `HTML CSS.md`, `UX.md` и `MM.md` → `Cursor.md`, `ARCH.md` и `DOCS.md` без изменений имен.

→ Создана папка `docs/logs/` с файлами `Cursor.md`, `ARCH.md`, `HTML CSS.md`, `DOCS.md`. Удалены старые файлы из `history/`: `ARCH.md`, `DOCS.md`, `UI.md`, `UX.md`, `MM.md`. Обновлен `.cursorrules`: изменен путь тематических логов с `history/` на `docs/logs/`, обновлены имена файлов и описания тем.

◉ Упорядочивание структуры тематических логов для соответствия вкладкам чатов агента. Централизация документации в папке `docs/`.

## Коммит: 18.12.2025 - Configure VS Code settings sync and fix Git configuration

◆ Добавлены полные настройки VS Code (редактор, терминал, Git, тема, проверка орфографии). Переименованы review-файлы в `docs/review/` с префиксом `r-` для единообразия.

→ Создан `.vscode/settings.json` с полными настройками проекта (редактор, терминал Git Bash, тема Default Light+, Git интеграция, cSpell). Создан `.vscode/cspell-dict.txt` со словарем проекта. Переименованы review-файлы: `review-app.html` → `docs/review/r-app.html`, `review-colors.html` → `docs/review/r-colors.html`, `review-data.md` → `docs/review/r-data.md`, `review-icons.html` → `docs/review/r-icons.html`, `review-manager.js` → `docs/review/r-manager.js`, `review-messages.html` → `docs/review/r-messages.html`, `review-styles.css` → `docs/review/r-styles.css`, `review-system-messages.json` → `docs/review/r-system-messages.json`.

◉ Обеспечение совместимости проекта с VS Code через полную синхронизацию настроек. Упорядочивание структуры review-файлов в единой папке с единым префиксом именования.

