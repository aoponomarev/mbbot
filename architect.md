# Архитектурный план (BOT)

Цели: запуск без бэкенда (CDN Vue + локальные файлы), работа из папки/`file://`, данные тянем из публичных API (CoinGecko и др.), всё состояние и история — локально (localStorage/IndexedDB).

Слои
- core/: конфиг, fetch-обёртка (таймауты/ретраи), абстракция хранения (localStorage/IndexedDB), общие расчётные хелперы, схемы валидации входящих данных.
  - core/security/: утилиты обфускации, валидация ключей, безопасное хранение чувствительных данных (PIN-коды, API-ключи).
- data-sources/: адаптеры провайдеров (coingecko, другие аналитические API), нормализация в общий формат.
- domain/:
  - entities/: asset, metric, index, strategy, portfolio, history (таймсерии), correlation.
  - services/: calculator (метрики/индексы), portfolio-builder (weights/стратегии), backtest, correlation.
- features/ (feature-first):
  - markets: загрузка и отображение рынка (цены, проценты, объёмы).
  - metrics: расчёт/просмотр метрик по периодам.
  - indices: конструирование пользовательских индексов/скорингов.
  - portfolios: конструктор портфелей под стратегии, предпросмотр метрик.
  - strategies: пресеты правил (ребаланс, лимиты веса, фильтры).
  - correlations: матрицы корреляций для активов/портфелей.
  - history: загрузка/кэш/просмотр временных рядов.
  - import-export: JSON экспорт/импорт настроек, стратегий, портфелей.
  - settings: тема, API-ключи, периодичность обновлений.
- ui/: переиспользуемые компоненты (таблицы, карточки, формы, графики), layout, тема/токены (через Bootstrap-утилиты).
  - ui/api/: компоненты для работы с внешними API (Perplexity, CoinGecko, импорт/экспорт).
  - ui/interaction/: компоненты взаимодействия с пользователем (сплэш, тема, чат).
- tests/: unit (расчёты), integration (сценарии сборки портфелей, импорт/экспорт).

Текущее размещение файлов
- core/cfg-app.js — конфиг приложения (defaults, модели).
- core/security/u-sec-obfuscate.js — утилиты обфускации для безопасного хранения PIN и API-ключей.
- ui/api/import-export.js — экспорт/импорт настроек.
- ui/api/perplexity.js — настройка ключа/модели Perplexity.
- ui/api/coingecko.js — виджет CoinGecko.
- ui/interaction/splash.js — сплэш-экран с защитой PIN-кодом и настройкой API-ключа.
- ui/interaction/theme.js — применение темы.
- ui/interaction/chat.js — чат Perplexity.
- app/app-ui-root.js — сборка и монтирование Vue-приложения.
- index.html — корневой HTML, подключает скрипты через CDN + локальные.

Структура папок по специализации
- Папки специализации (`<сектор>/<специализация>/`) создаются по мере накопления файлов родственного назначения.
- Примеры: `ui/api/` (компоненты для работы с API), `ui/interaction/` (компоненты взаимодействия), `mm/` (математическая модель).
- Имена файлов без префиксов — специализация понятна из пути папки.

Ключевые сущности
- Asset: {id, symbol, name}.
- Metric: {assetId, period, kind, value}; источник — data-sources → calculator.
- Index: агрегированные скоры/метрики из набора Metric + формула.
- Strategy: правила (лимиты веса, фильтры волатильности/ликвидности, ребаланс).
- Portfolio: {strategyId, weights{assetId: number}, derivedMetrics, rebalance rules}.
- History: таймсерии цен/метрик/портфелей для backtest/корреляций.
- Correlation: матрицы между Asset/Portfolio на базе History.

Поток данных
Fetch (data-sources) → Validate/Normalize (schemas) → Compute (calculator/indices) → Build (portfolio-builder/strategy) → Persist (storage/IndexedDB) → Render (ui/api, ui/interaction).

Хранение и оффлайн
- Настройки и ключи: localStorage.
- История цен/метрик/портфелей: IndexedDB (chunked загрузка, при необходимости delta/RLE).
- Экспорт/импорт: JSON для настроек, стратегий, портфелей, исторических срезов.

Библиотеки (при необходимости через CDN)
- Vue (уже есть), Chart.js или Lightweight Charts для графиков, zod (или легковесная своя валидация) для схем, idb-keyval для удобной работы с IndexedDB.

