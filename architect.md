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
- tests/: unit (расчёты), integration (сценарии сборки портфелей, импорт/экспорт).

Текущее размещение файлов
- core/cfg-app.js — конфиг приложения (defaults, модели).
- core/security/u-sec-obfuscate.js — утилиты обфускации для безопасного хранения PIN и API-ключей.
- ui/components/c-ui-splash.js — сплэш-экран с защитой PIN-кодом и настройкой API-ключа.
- ui/components/c-ui-theme.js — применение темы.
- ui/components/c-ui-perplexity-settings.js — настройка ключа/модели Perplexity.
- ui/components/c-ui-chat.js — чат Perplexity.
- ui/components/c-ui-import-export.js — экспорт/импорт настроек.
- ui/components/c-ui-coingecko.js — виджет CoinGecko.
- app/app-ui-root.js — сборка и монтирование Vue-приложения.
- index.html — корневой HTML, подключает скрипты через CDN + локальные.

Ключевые сущности
- Asset: {id, symbol, name}.
- Metric: {assetId, period, kind, value}; источник — data-sources → calculator.
- Index: агрегированные скоры/метрики из набора Metric + формула.
- Strategy: правила (лимиты веса, фильтры волатильности/ликвидности, ребаланс).
- Portfolio: {strategyId, weights{assetId: number}, derivedMetrics, rebalance rules}.
- History: таймсерии цен/метрик/портфелей для backtest/корреляций.
- Correlation: матрицы между Asset/Portfolio на базе History.

Поток данных
Fetch (data-sources) → Validate/Normalize (schemas) → Compute (calculator/indices) → Build (portfolio-builder/strategy) → Persist (storage/IndexedDB) → Render (ui/components).

Хранение и оффлайн
- Настройки и ключи: localStorage.
- История цен/метрик/портфелей: IndexedDB (chunked загрузка, при необходимости delta/RLE).
- Экспорт/импорт: JSON для настроек, стратегий, портфелей, исторических срезов.

Библиотеки (при необходимости через CDN)
- Vue (уже есть), Chart.js или Lightweight Charts для графиков, zod (или легковесная своя валидация) для схем, idb-keyval для удобной работы с IndexedDB.

Именование файлов (префиксы)
- Шаблон (обязателен для новых файлов): `<категория>-<сектор?>-<имя>.<ext>`. Сектор добавлять только при реальной привязке к UI/MM/Security.
- Желаемый пул категорий: `c-` компоненты UI, `f-` фичи, `ds-` источники/адаптеры данных, `d-` доменные сущности, `svc-` сервисы/бизнес-логика, `u-` утилиты, `cfg-` конфиги, `app-` точка входа/композиция, `t-` тесты.
- Секторы: `ui-` (интерфейс, включает оформление и взаимодействие/UX), `mm-` (математическая модель), `sec-` (security, безопасность) (опционально).
- Примеры: `c-ui-modal.js`, `svc-mm-portfolio-builder.js`, `ds-market-coingecko.js`, `u-core-storage.js`, `u-sec-obfuscate.js`, `cfg-sec-keys.js`, `cfg-app.js`, `app-ui-root.js`.
- Расширение пула: при появлении новых типов файлов добавлять префикс в этот список и держать его в актуальном состоянии.
- **Примечание**: UX (User Experience) является неотъемлемой частью UI - веб-компоненты содержат и визуальное оформление, и логику взаимодействия одновременно. Поэтому используется единый префикс `ui-` вместо искусственного разделения на `ui-` и `ux-`.
