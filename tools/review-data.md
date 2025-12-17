## Цель

Свести «статику» в review-файлах к минимуму и максимально подвязать сбор данных к **фактической кодовой базе**, без подхода вида `node tools/generate-review-data.js`.

Ключевая идея: review-страницы должны уметь **в браузере** (включая GitHub Pages) собирать:
- список файлов,
- содержимое файлов,
- производные индексы (статистика, иконки, цвета, сообщения),
- и показывать пользователю, **насколько полные** получились данные.

Отдельное требование UX: использовать «системные сообщения» **под вкладками** (в хедере review) для статуса/ошибок/фоллбеков и кнопок действий.

---

## Ограничения платформы (почему раньше было много статики)

В браузере нет прямого эквивалента `ls`/`git ls-files`: по URL `./` нельзя безопасно и кроссбраузерно получить дерево файлов проекта.

Поэтому любой «автоскан всей кодовой базы» требует явного источника списка файлов:
- пользователь **выбирает папку** (File System Access API / webkitdirectory)
- или список файлов берётся из **GitHub API** (для Pages)
- или строится «неполный» список из **dependency graph** (только реально подключённые ресурсы)

`localStorage`/`IndexedDB` сами по себе не содержат кодовую базу — это только **кэш** и состояние.

---

## Архитектура системы сбора (реализовано)

Реализация находится в:
- `ui/review-manager.js` — единый менеджер review + pipeline источников + кэш + сканеры
- `ui/review-styles.css` — стили системных сообщений под вкладками

Review-страницы:
- `review-app.html` (Статистика)
- `ui/assets/review-icons.html` (Иконки)
- `ui/styles/review-colors.html` (Цвета)
- `ui/interaction/review-messages.html` (Сообщения)

---

## Принципы генерации и использования данных для review‑файлов

Цель этих принципов — чтобы review‑страницы оставались **максимально “живыми”** (данные из фактической кодовой базы), при этом **надёжными** (fallback chain + прозрачность для пользователя).

1) **Browser‑first, без node‑генераторов**
   - Review‑страницы должны уметь собирать данные **в браузере**.
   - Подходы вида `node tools/generate-review-data.js` считаются legacy и не используются как “источник правды”.

2) **Single source of truth = кодовая база**
   - Любая “статическая таблица” в review допустима только как UI‑константа (например, названия категорий).
   - Всё, что можно извлечь из файлов проекта (иконки/цвета/usage/сообщения/статистика) — должно извлекаться автоматически.

3) **Fallback chain обязателен (и должен быть виден пользователю)**
   - Порядок источников: **FS → GitHub → DepGraph → Cache**.
   - Любая деградация (например, DepGraph = неполно) должна сопровождаться системным сообщением и, по возможности, кнопкой действия (например, “Выбрать папку проекта”).

4) **Кэшируем результаты сканеров, а не “репозиторий”**
   - Кэшируем payload’ы `scanStats/scanIcons/scanColors/scanMessages` + fingerprint источника.
   - Fingerprint должен отвечать на вопрос “данные актуальны?” (FS manifest hash / GitHub tree sha / DepGraph list hash).

5) **Self‑describing extraction = best‑effort**
   - Regex/эвристики применяются поверх любого источника, который умеет `listFiles + readText`.
   - Ограничения (например, не видим динамический текст, template literals и т.п.) должны быть описаны прямо в документации сканера.

6) **Единая точка управления**
   - Общая логика (pipeline/сканеры/хедер/сообщения) хранится в `ui/review-manager.js`.
   - Общие стили review — в `ui/review-styles.css` (и при необходимости подключается `ui/styles/layout.css` для общего UI).

7) **Системные сообщения — обязательная часть UX**
   - Любые статусы/ошибки/предупреждения сборщика должны идти через единый механизм сообщений (см. раздел ниже).
   - Сообщение показывается только там, где существует host `<system-messages scope="...">` — поэтому для каждой области/страницы должен быть свой host.

8) **Чистота хранилища иконок (uiElementHelper)**
   - Хранилище иконок/команд — это **production‑зависимость UI**, поэтому в нём должны оставаться только реально используемые элементы.
   - Файлы‑источники:
     - `ui/config/ui-element-mapping.json` — человеко‑читаемая “таблица соответствий”
     - `ui/utils/ui-element-helper.js` — встроенная копия mapping (нужна для корректной работы при `file://` и в окружениях с ограничениями fetch)
   - Требование синхронизации: изменения состава иконок/команд должны вноситься **в оба файла** (чтобы не было расхождений между “mapping” и “embedded mapping”).
   - Процедура удаления (обязательно перед любым удалением):
     - Проверить по всему проекту отсутствие использования:
       - **iconCommand/icon-command**: `icon-command="..."`, `:icon-command="..."`
       - **строковых литералов команд** (например, `'favorite'`, `'open-external'`) в местах, где формируются пункты меню/кнопки
       - **прямых CSS‑классов иконок**: `fas fa-...`, `fab fa-...`, `icon-...` (в шаблонах и JS, где строки используются как class)
       - **indicator value** (например, `value: 'selected'`, `value: 'not-in-table'`), если иконка используется как indicator‑иконка
     - Если подтверждено отсутствие ссылок — удалить запись иконки из `ui/config/ui-element-mapping.json` и из `ui/utils/ui-element-helper.js`.
     - После удаления проверить вкладку review `Иконки` (`ui/assets/review-icons.html`): иконка/команда не должны больше появляться в каталоге.
   - Правило добавления: новая иконка должна появляться в mapping **только вместе** с реальным использованием в UI (либо через `icon-command`, либо через прямой класс в шаблоне, либо через indicator‑value).

---

## UI: системные сообщения под вкладками

### DOM

Хедер создаётся в `createReviewHeader()` (`ui/review-manager.js`). Под `<ul class="review-tabs">` добавлен контейнер:

- `.review-system-messages` (role="status", aria-live="polite")
- внутри него: `#review-system-messages-vue` — mount‑point для `<system-messages scope="review">`

### API сообщений

`ReviewSystemMessages` (экспортируется в `window.ReviewManager`) предоставляет:
- `add({ level, text, details?, actions?, id? })` — низкоуровневое добавление сообщения
- `post(key, overrides?)` — добавление сообщения по шаблону из централизованной хранилки
- `clear()`

Фактический рендер (Level 2):
- `ReviewSystemMessages.add()` пишет в `window.AppMessages` с `scope: 'review'` (id префиксуется как `review_<id>` для избегания коллизий)
- UI рисует единый Vue‑компонент `<system-messages scope="review">`
- DOM‑рендер через `document.createElement('div.alert')` остаётся только как fallback, если `AppMessages` недоступен

Особенности:
- **id-дедупликация**: если сообщение с тем же `id` уже существует — оно заменяется, чтобы не спамить.
- **actions**: список кнопок (primary/secondary/outline) с `onClick()`.

### Использование

Pipeline и страницы используют сообщения для:
- выбранного источника (FS/GitHub/DepGraph)
- предупреждений о деградации (например, DepGraph неполный)
- ошибок сбора и подсказок (например, «Выбрать папку проекта»)

---

## Единая система сообщений (достойно фиксировать отдельно)

В проекте реализована “тотальная” миграция отображения сообщений на единый стек:

- `ui/utils/messages-store.js` → глобальное хранилище `window.AppMessages`:
  - `push({ id?, scope, type, text, details?, actions? })`
  - `replace(id, { scope, type, text, ... })` (удобно для статусов, которые нужно обновлять без спама)
  - `dismiss(id)`, `clear(scope?)`
  - эмитит событие `app-messages:changed` (нужно для страниц, где store был создан до загрузки Vue)

- `ui/components/system-messages.js` → единый Vue‑компонент‑хост `<system-messages>`:
  - фильтрует по `scope`
  - рисует сообщения с крестиком закрытия
  - поддерживает `actions` (кнопки)
  - имеет “event bridge” через `app-messages:changed` на случай не‑реактивного store

Практика использования:
- В каждом UI‑контексте должна быть явная точка вывода: `<system-messages scope="...">`
  - пример: `global`, `splash`, `settings`, `coins`, `coins-tickers`
  - в review: `scope="review"` в хедере + дополнительные scope’ы для demo/auto‑scan на `review-messages.html`
- Если сообщение “не появляется”, в 90% случаев причина — **нет host’а в DOM** (например, `settings`‑host существует только когда открыт компонент настроек).

### Хранилка системных сообщений

Шаблоны системных сообщений и кнопок действий вынесены в:
- `tools/review-system-messages.json`

Формат:
- `messages.<key>`: `{ level, text, details?, actions?: [actionId...] }`
- `actions.<actionId>`: `{ label, kind }`

Код привязки обработчиков (onClick) остаётся в `ui/review-manager.js`, а тексты/лейблы централизованы в JSON.

---

## Data layer: ReviewDataPipeline

`ReviewDataPipeline` (экспортируется в `window.ReviewManager`) — единый слой доступа к кодовой базе.

### Источники (fallback chain)

В текущей реализации источники выбираются в порядке:

1) **FS** (локальная папка проекта)
   - если пользователь уже выбирал папку в текущей сессии (in-memory)
   - выбор осуществляется кнопкой (через системное сообщение) и приводит к `reload()`

2) **GitHub**
   - используется GitHub API:
     - `GET /repos/:owner/:repo/branches/:branch` → commit sha
     - `GET /repos/:owner/:repo/git/trees/:sha?recursive=1` → дерево
   - чтение файлов: `raw.githubusercontent.com/:owner/:repo/:branch/:path`

3) **DepGraph** (fallback)
   - строит список только из entrypoint’ов и их `<script src>`/`<link href>`
   - это **неполный режим**: не увидит файлы, которые лежат в репо, но не подключены.

> Важно: «Self-describing extraction» (поиск `fa-`, `icon-`, `var(--x)`) — не источник, а метод извлечения данных поверх любого источника, который умеет `listFiles + readText`.

### Почему FS не auto-prompt

File System Access API требует user gesture. Поэтому pipeline:
- не пытается сам вызвать picker при загрузке,
- вместо этого показывает системное сообщение с кнопкой.

### Исключения по правилам проекта

Во всех сканерах и FS-walk применяются исключения:
- `docs/` (не читать автоматически)
- `old_app_not_write/` (не читать/не трогать)
- `.git/`, `node_modules/`
- `history/` (для статистики исключается отдельно)

---

## Кэширование

### Что кэшируется

Кэшируется не “файловая система”, а **результаты сканеров**:
- `stats`, `icons`, `colors`, `messages`

### Где

Сейчас используется `localStorage`:
- ключи формата: `review.data.cache.v1:<scannerId>:<sourceId>:<fingerprint>`
- value: `{ fingerprint, updatedAt, payload }`

### Fingerprint

Fingerprint нужен для ответа на вопрос: «кэш ещё актуален?»

- **FS**: SHA-256 от manifest `{path,size,lastModified}`
- **GitHub**: `tree.sha` (из GitHub tree API)
- **DepGraph**: SHA-256 от списка найденных файлов (entrypoint-derived)

Если fingerprint совпадает — используем cached payload.

---

## Репо-конфиг для GitHub источника

GitHub источник требует `owner/repo/branch`.

Порядок определения:
1) query params: `?owner=...&repo=...&branch=...`
2) `localStorage` (ключ `review.data.config.v1`, поле `github`)
3) GitHub Pages URL: `https://<owner>.github.io/<repo>/...` (branch по умолчанию `master`)

Локально `.git/config` **не читается браузером**. Для локальной разработки GitHub источник обычно не нужен (FS удобнее), но для Pages — обязателен.

---

## Сканеры (автоматизация статики)

### 1) Статистика (`scanStats`)

Собирает:
- `totalLines`
- `totalFiles`
- `files[]`: `{path,type,lines,size}` (sorted desc)

Файлы:
- берутся из `idx.listFiles()`
- читаются через `idx.readText()`
- фильтруются по расширениям: `js/css/html/json/md`
- исключаются: `docs/`, `old_app_not_write/`, `history/`, `.git/`, `node_modules/`, review-страницы

`ProjectStats.loadFilesData()` теперь использует `ReviewDataPipeline.scanStats()`.

### 2) Иконки (`scanIcons`)

Собирает unified каталог:
- **mapping icons**: `ui/config/ui-element-mapping.json`
- **auto-detected**:
  - Font Awesome: `fas fa-...`, `fa-...`
  - SVG file classes: `icon-...`

Данные возвращаются в формате, который может напрямую потреблять `review-icons.html`:
`{ type, identifier, iconClass, category, commands, usage, file }`

`ProjectStats.loadIconsStats()` теперь использует `ReviewDataPipeline.scanIcons()`.

Ограничения:
- Категоризация auto-detected сейчас грубая (`other`).
- Inline SVG/data-uri/bitmap пока не выделяются как отдельные типы (можно расширить).

### 3) Цвета (`scanColors`)

Собирает:
- определения CSS переменных из всех `*.css` (`--var: value;`)
- usage из всех текстовых файлов по `var(--name)`

Категоризация:
- `--bs-danger*` → `danger`
- `--bs-success*` → `success`
- `--bs-*` → `bootstrap`
- `--color-header-*` → `header`
- `--color-dropdown-*` → `dropdown`
- `--color-theme-*` → `theme`
- `--color-*` → `ui`
- иначе `other`

`review-colors.html` переведён на данные `scanColors()` (убран гигантский статический `colorData`).

`ProjectStats.loadColorsStats()` теперь использует `ReviewDataPipeline.scanColors()`.

Ограничения:
- Значение отображается из `getComputedStyle` (реальная “эффективная” величина), rawValue используется как фоллбек.

### 4) Сообщения (`scanMessages`)

Собирает сообщения **best-effort** из нескольких источников:

- `tools/review-system-messages.json` — шаблоны системных сообщений review (источник “правды” для ReviewSystemMessages)
- эвристика по вызовам `AppMessages.push/replace({ scope, type, text, ... })` в `*.js`/`*.html` (только случаи с текстом-литералом)

Возвращает:
- `messages[]`: `{ type, text, files[] }`

`review-messages.html` дополнен блоком **Auto-scan** (таблица), при этом демонстрационные шаблоны остаются как витрина.

Ограничения:
- Сканер regex-based: динамический текст/переменные (не строковые литералы) не будут извлечены.
- Эвристика `AppMessages.*` извлекает только `text: "..."`/`'...'` (template literals и конкатенации не парсятся).

---

## Матрица сред выполнения (ожидаемое поведение)

### GitHub Pages (https)
- FS picker: зависит от браузера (обычно доступен в Chromium, требует user gesture)
- GitHub tree: доступен (онлайн)
- DepGraph: доступен

Рекомендация: GitHub как default, FS как усиление/локальный режим.

### Localhost (http://localhost)
- FS picker: обычно доступен
- GitHub tree: доступен при наличии сети
- DepGraph: доступен

Рекомендация: FS как основной источник.

### file://
- многие браузеры ограничивают fetch/доступ к ресурсам; поведение нестабильно
- Simple Browser внутри Cursor часто ограничивает file://

Рекомендация: использовать локальный http-сервер.

---

## Legacy (что НЕ использовать)

Ранее в проекте появлялся файл `ui/review-data.generated.js`, помеченный как auto-generated (генерация через `tools/generate-review-data.js`).

В текущем треке (browser-first, без node-генераторов) этот подход считается **устаревшим** — файл не используется как источник правды и был удалён из рабочего дерева (чтобы не провоцировать откат к генерации).

---

## Что осталось не автоматизированным (следующее ревью)

1) `review-icons.html` всё ещё содержит «старую» логику/функции, хотя данные берутся через pipeline. Можно упростить код, убрать мёртвые ветки и расширить auto-detected для data-uri/inline-svg/bitmap.
2) Usage для иконок/цветов сейчас выводится как список файлов (по вхождениям). Можно дополнить:
   - “кто именно использует” (компонент/шаблон) через более точный парсинг шаблонов.
3) Сообщения: сканировать не только HTML, но и JS-шаблоны/строки ошибок.
4) Добавить UX-кнопки в системные сообщения:
   - "Сбросить кэш"
   - "Настроить GitHub repo" (пишет в localStorage config)

