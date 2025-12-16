/**
 * Единый менеджер для всех review-файлов документации
 * Управляет хедером с вкладками, навигацией и общими функциями
 */

// Конфигурация review-файлов
const REVIEW_CONFIG = {
    'stats': {
        title: 'Статистика',
        file: 'review-app.html',
        description: 'Статистика проекта: рейтинг файлов, диаграммы, метрики'
    },
    'icons': {
        title: 'Иконки',
        file: 'ui/assets/review-icons.html',
        description: 'Каталог всех иконок проекта'
    },
    'colors': {
        title: 'Цвета',
        file: 'ui/styles/review-colors.html',
        description: 'Каталог всех цветовых переменных проекта'
    },
    'messages': {
        title: 'Сообщения',
        file: 'ui/interaction/review-messages.html',
        description: 'Шаблоны сообщений Bootstrap: info, success, warning, danger'
    }
    // Здесь можно добавлять новые review в будущем
};

/**
 * Создает хедер с вкладками для переключения между review
 * @param {string} currentReview - ID текущего review
 */
function createReviewHeader(currentReview) {
    const header = document.createElement('div');
    header.className = 'review-header';
    
    const tabs = document.createElement('ul');
    tabs.className = 'review-tabs';
    
    // Определяем текущий review из URL или используем переданный
    const urlParams = new URLSearchParams(window.location.search);
    const activeReview = urlParams.get('review') || currentReview || Object.keys(REVIEW_CONFIG)[0];
    
    // Создаем вкладки для каждого review
    Object.entries(REVIEW_CONFIG).forEach(([id, config]) => {
        const li = document.createElement('li');
        const a = document.createElement('a');
        // Вычисляем относительный путь от текущего файла к целевому
        const currentPath = window.location.pathname;
        
        // Определяем базовый путь в зависимости от текущего местоположения
        // config.file содержит полный путь от корня проекта (например, 'ui/assets/review-icons.html')
        let basePath = '';
        if (currentPath.includes('/ui/assets/')) {
            basePath = '../../'; // Из ui/assets/ в корень проекта
        } else if (currentPath.includes('/ui/styles/')) {
            basePath = '../../'; // Из ui/styles/ в корень проекта
        } else if (currentPath.includes('/ui/interaction/')) {
            basePath = '../../'; // Из ui/interaction/ в корень проекта
        } else if (currentPath.includes('/ui/')) {
            basePath = '../'; // Из ui/ в корень проекта
        } else if (currentPath.includes('/docs/')) {
            basePath = '../'; // Из docs/ в корень проекта
        }
        
        a.href = `${basePath}${config.file}?review=${id}`;
        a.textContent = config.title;
        a.title = config.description;
        
        if (id === activeReview) {
            a.classList.add('active');
        }
        
        li.appendChild(a);
        tabs.appendChild(li);
    });
    
    header.appendChild(tabs);
    
    // Проверяем, не вставлен ли уже хедер
    if (document.querySelector('.review-header')) {
        return null; // Хедер уже существует
    }
    
    // Вставляем хедер перед блоком фильтрации или контейнером
    const body = document.body;
    const filterControls = body.querySelector('.filter-controls');
    const container = body.querySelector('.container-fluid');
    
    if (filterControls) {
        // Вставляем перед блоком фильтрации
        filterControls.parentNode.insertBefore(header, filterControls);
    } else if (container) {
        // Если нет фильтров, вставляем перед контейнером
        body.insertBefore(header, container);
    } else {
        // В крайнем случае - в начало body
        body.insertBefore(header, body.firstChild);
    }
}

/**
 * Инициализирует хедер при загрузке страницы
 */
function initReviewHeader() {
    // Определяем текущий review из имени файла или полного пути
    const currentPath = window.location.pathname;
    const currentFile = currentPath.split('/').pop();
    let currentReview = null;
    
    // Специальная проверка для review-app.html (должен быть 'stats')
    if (currentFile === 'review-app.html') {
        currentReview = 'stats';
    } else {
        // Для остальных файлов проверяем по конфигурации
        Object.entries(REVIEW_CONFIG).forEach(([id, config]) => {
            // Проверяем как по полному пути, так и по имени файла
            const configFileName = config.file.split('/').pop();
            if (currentPath.includes(config.file) || config.file.endsWith(currentFile) || 
                currentFile === configFileName) {
                currentReview = id;
            }
        });
    }
    
    createReviewHeader(currentReview);
}

/**
 * Утилита для сортировки данных в таблицах
 */
const TableSorter = {
    /**
     * Сортирует массив данных по указанной колонке
     * @param {Array} data - Массив данных для сортировки
     * @param {string} column - Имя колонки для сортировки
     * @param {string} direction - Направление сортировки ('asc' или 'desc')
     * @param {Function} getValue - Функция для получения значения из элемента данных
     */
    sort(data, column, direction, getValue) {
        const sorted = [...data];
        sorted.sort((a, b) => {
            let valA = getValue ? getValue(a, column) : a[column];
            let valB = getValue ? getValue(b, column) : b[column];
            
            // Обработка строк
            if (typeof valA === 'string') {
                valA = valA.toLowerCase();
                valB = valB.toLowerCase();
            }
            
            // Обработка null/undefined
            if (valA == null) valA = '';
            if (valB == null) valB = '';
            
            if (valA < valB) return direction === 'asc' ? -1 : 1;
            if (valA > valB) return direction === 'asc' ? 1 : -1;
            return 0;
        });
        
        return sorted;
    },
    
    /**
     * Добавляет обработчики сортировки к заголовкам таблицы
     * @param {HTMLElement} table - Элемент таблицы
     * @param {Array} data - Исходные данные
     * @param {Function} renderRow - Функция для рендеринга строки
     * @param {Function} getValue - Функция для получения значения из элемента данных
     */
    attachSortHandlers(table, data, renderRow, getValue) {
        const thead = table.querySelector('thead');
        if (!thead) return;
        
        const sortableHeaders = thead.querySelectorAll('th[data-column]');
        const tbody = table.querySelector('tbody');
        
        sortableHeaders.forEach(th => {
            let sortDirection = null;
            
            th.addEventListener('click', () => {
                const column = th.dataset.column;
                
                // Переключаем направление сортировки
                if (th.classList.contains('sort-asc')) {
                    sortDirection = 'desc';
                    th.classList.remove('sort-asc');
                    th.classList.add('sort-desc');
                } else if (th.classList.contains('sort-desc')) {
                    sortDirection = 'asc';
                    th.classList.remove('sort-desc');
                    th.classList.add('sort-asc');
                } else {
                    sortDirection = 'asc';
                    // Убираем сортировку с других заголовков
                    sortableHeaders.forEach(h => {
                        h.classList.remove('sort-asc', 'sort-desc');
                    });
                    th.classList.add('sort-asc');
                }
                
                // Сортируем данные
                const sortedData = this.sort(data, column, sortDirection, getValue);
                
                // Перерисовываем таблицу
                tbody.innerHTML = '';
                sortedData.forEach(item => {
                    tbody.appendChild(renderRow(item));
                });
            });
        });
    }
};

/**
 * Утилита для фильтрации данных
 */
const DataFilter = {
    /**
     * Применяет фильтры к данным
     * @param {Array} data - Исходные данные
     * @param {Object} filters - Объект с фильтрами
     * @param {Function} matchesFilter - Функция для проверки соответствия фильтру
     */
    apply(data, filters, matchesFilter) {
        let filtered = [...data];
        
        Object.entries(filters).forEach(([key, value]) => {
            if (value && value !== '') {
                filtered = filtered.filter(item => matchesFilter(item, key, value));
            }
        });
        
        return filtered;
    }
};

/**
 * Утилита для работы с файлами
 */
const FileUtils = {
    /**
     * Получает только имя файла из пути
     * @param {string} filePath - Полный путь к файлу
     * @returns {string} Имя файла
     */
    getFileName(filePath) {
        if (!filePath) return '';
        const match = filePath.match(/([^\/\\]+\.\w+)(?:\s|$)/);
        if (match) return match[1];
        const parts = filePath.split(/[\/\\]/);
        return parts[parts.length - 1] || filePath;
    },
    
    /**
     * Извлекает основной текст и пояснение в скобках
     * @param {string} text - Текст для обработки
     * @returns {Object} Объект с main и tooltip
     */
    extractMainTextAndTooltip(text) {
        if (!text) return { main: '', tooltip: '' };
        const match = text.match(/^([^(]+)(\s*\([^)]+\))?$/);
        if (match) {
            const main = match[1].trim();
            const tooltip = match[2] ? match[2].trim() : '';
            return { main, tooltip: tooltip ? text : '' };
        }
        return { main: text, tooltip: '' };
    }
};

// Инициализация при загрузке DOM
function initializeWhenReady() {
    if (document.body) {
        initReviewHeader();
    } else {
        // Если body еще не загружен, ждем
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', initReviewHeader);
        } else {
            // Если DOM уже загружен, но body еще нет, ждем немного
            setTimeout(initReviewHeader, 10);
        }
    }
}

// Запускаем инициализацию
initializeWhenReady();

/**
 * Модуль статистики проекта (только для review-app.html)
 */
const ProjectStats = {
    // Данные файлов проекта
    filesData: [],
    codeStats: null,
    iconsStats: null,
    colorsStats: null,

    // Функция для подсчета строк кода без комментариев
    countCodeLines(content, ext) {
        const lines = content.split('\n');
        let codeLines = 0;
        let inBlockComment = false;
        
        for (let line of lines) {
            const trimmed = line.trim();
            
            if (ext === 'js' || ext === 'css') {
                if (trimmed.includes('/*')) {
                    inBlockComment = true;
                }
                if (trimmed.includes('*/')) {
                    inBlockComment = false;
                    continue;
                }
                if (inBlockComment) continue;
            }
            
            if (trimmed && !this.isCommentLine(trimmed, ext)) {
                codeLines++;
            }
        }
        
        return codeLines;
    },

    isCommentLine(trimmed, fileType) {
        if (fileType === 'js') {
            return trimmed.startsWith('//') || trimmed.startsWith('/*') || trimmed.startsWith('*');
        } else if (fileType === 'html') {
            return trimmed.startsWith('<!--') || trimmed.endsWith('-->');
        } else if (fileType === 'css') {
            return trimmed.startsWith('/*') || trimmed.startsWith('*');
        }
        return false;
    },

    // Загрузка данных о файлах
    async loadFilesData() {
        // Список файлов проекта (исключая node_modules, .git, old_app_not_write, docs, review-файлы)
        const reviewFiles = ['review-app.html', 'review-icons.html', 'review-colors.html'];
        const fileList = [
            // Core
            { path: 'core/cfg-app.js', type: 'js' },
            { path: 'core/security/u-sec-obfuscate.js', type: 'js' },
            { path: 'core/api/coingecko.js', type: 'js' },
            { path: 'core/api/market-metrics.js', type: 'js' },
            { path: 'core/api/perplexity.js', type: 'js' },
            // App
            { path: 'app/app-ui-root.js', type: 'js' },
            // UI API
            { path: 'ui/api/coins-manager.js', type: 'js' },
            { path: 'ui/api/import-export.js', type: 'js' },
            { path: 'ui/api/perplexity.js', type: 'js' },
            // UI Interaction
            { path: 'ui/interaction/header.js', type: 'js' },
            { path: 'ui/interaction/footer.js', type: 'js' },
            { path: 'ui/interaction/splash.js', type: 'js' },
            { path: 'ui/interaction/theme.js', type: 'js' },
            { path: 'ui/interaction/chat.js', type: 'js' },
            // UI Components
            { path: 'ui/components/button.js', type: 'js' },
            { path: 'ui/components/menu-item.js', type: 'js' },
            { path: 'ui/components/dropdown-menu.js', type: 'js' },
            { path: 'ui/components/header-coins.js', type: 'js' },
            { path: 'ui/components/sortable-header.js', type: 'js' },
            { path: 'ui/components/table-coin-row.js', type: 'js' },
            { path: 'ui/components/cell-num.js', type: 'js' },
            { path: 'ui/components/cell-row-select.js', type: 'js' },
            { path: 'ui/components/cell-coin.js', type: 'js' },
            { path: 'ui/components/header-cell.js', type: 'js' },
            { path: 'ui/components/header-cell-check.js', type: 'js' },
            { path: 'ui/components/table-data.js', type: 'js' },
            { path: 'ui/components/horizon-input.js', type: 'js' },
            // UI Utils
            { path: 'ui/utils/ui-element-helper.js', type: 'js' },
            { path: 'ui/utils/hash-generator.js', type: 'js' },
            { path: 'ui/utils/table-sort-mixin.js', type: 'js' },
            { path: 'ui/utils/column-visibility-mixin.js', type: 'js' },
            { path: 'ui/utils/pluralize.js', type: 'js' },
            { path: 'ui/utils/coins-cd-helpers.js', type: 'js' },
            { path: 'ui/utils/coins-favorites-helpers.js', type: 'js' },
            // UI Config
            { path: 'ui/config/ui-element-mapping.json', type: 'json' },
            { path: 'ui/config/table-columns-config.js', type: 'js' },
            // UI Styles
            { path: 'ui/styles/layout.css', type: 'css' },
            { path: 'ui/styles/header.css', type: 'css' },
            { path: 'ui/styles/footer.css', type: 'css' },
            { path: 'ui/styles/splash.css', type: 'css' },
            { path: 'ui/styles/dropdown.css', type: 'css' },
            { path: 'ui/styles/button.css', type: 'css' },
            { path: 'ui/styles/chat.css', type: 'css' },
            { path: 'ui/styles/theme-colors.css', type: 'css' },
            { path: 'ui/styles/icons.css', type: 'css' },
            { path: 'ui/styles/z-index.css', type: 'css' },
            { path: 'ui/review-styles.css', type: 'css' },
            { path: 'ui/review-manager.js', type: 'js' },
            // MM
            { path: 'mm/median/utils/math-helpers.js', type: 'js' },
            { path: 'mm/median/core/prc-weights.js', type: 'js' },
            { path: 'mm/median/core/pv1h-clip.js', type: 'js' },
            { path: 'mm/median/metrics/cpt.js', type: 'js' },
            { path: 'mm/median/metrics/cd.js', type: 'js' },
            // HTML
            { path: 'index.html', type: 'html' }
        ];
        
        const filesWithStats = [];
        let totalLines = 0;
        
        for (const file of fileList) {
            // Пропускаем review-файлы
            const fileName = file.path.split('/').pop();
            if (reviewFiles.includes(fileName)) {
                continue;
            }
            
            try {
                const response = await fetch(file.path);
                if (response.ok) {
                    const content = await response.text();
                    const lines = this.countCodeLines(content, file.type);
                    totalLines += lines;
                    
                    filesWithStats.push({
                        path: file.path,
                        type: file.type,
                        lines: lines,
                        size: content.length
                    });
                }
            } catch (e) {
                // Файл не найден или ошибка загрузки
                console.warn(`Не удалось загрузить ${file.path}:`, e);
            }
        }
        
        this.filesData = filesWithStats.sort((a, b) => b.lines - a.lines);
        this.codeStats = {
            totalLines: totalLines,
            totalFiles: filesWithStats.length,
            files: filesWithStats
        };
    },

    // Загрузка статистики иконок
    loadIconsStats() {
        if (window.uiElementHelper) {
            const mapping = window.uiElementHelper.loadUIElementMapping();
            const icons = mapping.icons || {};
            
            const byCategory = {};
            const byType = {};
            let totalCommands = 0;
            
            Object.entries(icons).forEach(([iconClass, iconData]) => {
                // Определяем тип иконки
                let type = 'fontawesome';
                if (iconClass.startsWith('icon-')) {
                    type = 'svg-file';
                } else if (iconClass.includes('inline')) {
                    type = 'inline-svg';
                }
                byType[type] = (byType[type] || 0) + 1;
                
                // Подсчитываем команды по категориям
                if (iconData.commands) {
                    Object.values(iconData.commands).forEach(cmd => {
                        const category = cmd.category || 'other';
                        byCategory[category] = (byCategory[category] || 0) + 1;
                        totalCommands++;
                    });
                }
            });
            
            this.iconsStats = {
                total: Object.keys(icons).length,
                totalCommands: totalCommands,
                byCategory: byCategory,
                byType: byType
            };
        }
    },

    // Загрузка статистики цветов
    async loadColorsStats() {
        // Пытаемся загрузить данные из review-colors.html
        // Если colorData уже есть в window (страница уже загружена), используем его
        if (!window.colorData) {
            try {
                // Загружаем review-colors.html и извлекаем colorData
                const response = await fetch('ui/styles/review-colors.html');
                if (response.ok) {
                    const html = await response.text();
                    // Извлекаем определение colorData из скрипта
                    // Ищем строку "const colorData = {" и до "window.colorData = colorData;"
                    const startMatch = html.indexOf('const colorData = {');
                    const endMatch = html.indexOf('window.colorData = colorData;');
                    if (startMatch !== -1 && endMatch !== -1) {
                        try {
                            // Извлекаем код определения colorData и его экспорт
                            const colorDataCode = html.substring(startMatch, endMatch + 'window.colorData = colorData;'.length);
                            // Выполняем только код определения colorData
                            const func = new Function(colorDataCode);
                            func();
                            // Теперь window.colorData должен быть доступен
                        } catch (e) {
                            console.warn('Не удалось выполнить код colorData из review-colors.html:', e);
                        }
                    }
                }
            } catch (e) {
                console.warn('Не удалось загрузить review-colors.html:', e);
            }
        }
        
        const colorData = window.colorData || {};
        
        const byCategory = {};
        let total = 0;
        
        Object.values(colorData).forEach(color => {
            const category = color.category || 'other';
            byCategory[category] = (byCategory[category] || 0) + 1;
            total++;
        });
        
        this.colorsStats = {
            total: total,
            byCategory: byCategory
        };
    },

    // Отображение основной статистики
    renderMainStats() {
        if (this.codeStats) {
            const totalLinesEl = document.getElementById('total-code-lines');
            const totalFilesEl = document.getElementById('total-files');
            if (totalLinesEl) totalLinesEl.textContent = this.codeStats.totalLines.toLocaleString();
            if (totalFilesEl) totalFilesEl.textContent = this.codeStats.totalFiles;
        }
        
        if (this.iconsStats) {
            const totalIconsEl = document.getElementById('total-icons');
            if (totalIconsEl) totalIconsEl.textContent = this.iconsStats.total;
        }
        
        if (this.colorsStats) {
            const totalColorsEl = document.getElementById('total-colors');
            if (totalColorsEl) totalColorsEl.textContent = this.colorsStats.total;
        }
    },

    // Отображение рейтинга файлов
    renderFilesRanking() {
        const tbody = document.getElementById('files-ranking-body');
        if (!tbody) return;
        
        tbody.innerHTML = '';
        
        this.filesData.forEach((file, index) => {
            const tr = document.createElement('tr');
            
            // Медаль для топ-3
            let medal = '';
            if (index === 0) medal = '<i class="fas fa-medal text-warning"></i>';
            else if (index === 1) medal = '<i class="fas fa-medal text-secondary"></i>';
            else if (index === 2) medal = '<i class="fas fa-medal" style="color: #cd7f32;"></i>';
            
            tr.innerHTML = `
                <td>${medal} ${index + 1}</td>
                <td><strong>${file.lines.toLocaleString()}</strong></td>
                <td><code>${file.path}</code></td>
                <td><span class="badge bg-secondary">${file.type.toUpperCase()}</span></td>
                <td>${this.formatFileSize(file.size)}</td>
            `;
            
            tbody.appendChild(tr);
        });
        
        // Добавляем обработчики сортировки
        this.attachSortHandlers();
    },

    formatFileSize(bytes) {
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
    },

    attachSortHandlers() {
        const table = document.getElementById('files-ranking-table');
        if (!table) return;
        
        const headers = table.querySelectorAll('th[data-column]');
        
        headers.forEach(th => {
            th.style.cursor = 'pointer';
            th.addEventListener('click', () => {
                const column = th.dataset.column;
                const currentDir = th.classList.contains('sort-asc') ? 'desc' : 
                                  th.classList.contains('sort-desc') ? null : 'asc';
                
                // Убираем сортировку с других заголовков
                headers.forEach(h => h.classList.remove('sort-asc', 'sort-desc'));
                
                if (currentDir) {
                    th.classList.add(`sort-${currentDir}`);
                    
                    // Сортируем данные
                    const sorted = [...this.filesData];
                    sorted.sort((a, b) => {
                        let valA = a[column];
                        let valB = b[column];
                        
                        if (column === 'path') {
                            valA = valA.toLowerCase();
                            valB = valB.toLowerCase();
                        }
                        
                        if (valA < valB) return currentDir === 'asc' ? -1 : 1;
                        if (valA > valB) return currentDir === 'asc' ? 1 : -1;
                        return 0;
                    });
                    
                    this.filesData = sorted;
                    this.renderFilesRanking();
                }
            });
        });
    },

    // Отображение диаграмм
    async renderCharts() {
        this.renderFileTypesChart();
        await this.renderContentDistributionChart();
    },

    renderFileTypesChart() {
        const canvas = document.getElementById('file-types-chart');
        if (!canvas) return;
        
        // Устанавливаем размер canvas для четкого отображения
        const size = 300;
        canvas.width = size;
        canvas.height = size;
        
        const ctx = canvas.getContext('2d');
        const typeStats = {};
        
        this.filesData.forEach(file => {
            typeStats[file.type] = (typeStats[file.type] || 0) + file.lines;
        });
        
        // Сортируем от больших к меньшим
        const sortedTypes = Object.entries(typeStats)
            .sort((a, b) => b[1] - a[1])
            .map(([type, lines]) => ({ type, lines }));
        
        // Переставляем: первый и последний - два наибольших
        let arrangedTypes = [...sortedTypes];
        if (arrangedTypes.length >= 2) {
            const first = arrangedTypes[0];
            const second = arrangedTypes[1];
            const rest = arrangedTypes.slice(2);
            arrangedTypes = [first, ...rest, second];
        }
        
        const types = arrangedTypes.map(item => item.type);
        const values = arrangedTypes.map(item => item.lines);
        const colors = ['#0d6efd', '#198754', '#dc3545', '#ffc107', '#6f42c1', '#fd7e14'];
        
        // Простая круговая диаграмма
        const total = values.reduce((a, b) => a + b, 0);
        if (total === 0) return;
        
        const centerX = size / 2;
        const centerY = size / 2;
        const radius = size / 3;
        let currentAngle = -Math.PI / 2;
        
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        types.forEach((type, index) => {
            const sliceAngle = (values[index] / total) * 2 * Math.PI;
            
            ctx.beginPath();
            ctx.moveTo(centerX, centerY);
            ctx.arc(centerX, centerY, radius, currentAngle, currentAngle + sliceAngle);
            ctx.closePath();
            ctx.fillStyle = colors[index % colors.length];
            ctx.fill();
            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 2;
            ctx.stroke();
            
            // Подпись
            const labelAngle = currentAngle + sliceAngle / 2;
            const labelX = centerX + Math.cos(labelAngle) * (radius + 30);
            const labelY = centerY + Math.sin(labelAngle) * (radius + 30);
            
            ctx.fillStyle = '#333';
            ctx.font = 'bold 12px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(type.toUpperCase(), labelX, labelY);
            
            // Процент
            const percent = ((values[index] / total) * 100).toFixed(1);
            ctx.font = '10px Arial';
            ctx.fillText(`${percent}%`, labelX, labelY + 15);
            
            currentAngle += sliceAngle;
        });
    },

    // Определение корневой папки файла
    getRootFolder(filePath) {
        // Если путь не содержит слэш - файл в корне
        if (!filePath.includes('/')) {
            return 'root';
        }
        
        // Берем первую часть пути (корневая папка)
        const parts = filePath.split('/');
        return parts[0];
    },
    
    // Определение подпапки UI (для разбиения сектора UI)
    getUISubfolder(filePath) {
        // Если файл не в UI - возвращаем null
        if (!filePath.startsWith('ui/')) {
            return null;
        }
        
        const parts = filePath.split('/');
        // Если файл прямо в ui/ (например, ui/review-manager.js)
        if (parts.length === 2) {
            return 'ui-root';
        }
        
        // Возвращаем подпапку (например, ui/api/ -> api, ui/components/ -> components)
        return parts[1];
    },
    
    // Загрузка данных о review-файлах
    async loadReviewFilesData() {
        const reviewFiles = [
            { path: 'review-app.html', type: 'html' },
            { path: 'ui/assets/review-icons.html', type: 'html' },
            { path: 'ui/styles/review-colors.html', type: 'html' }
        ];
        
        const reviewFilesData = [];
        
        for (const file of reviewFiles) {
            try {
                const response = await fetch(file.path);
                if (response.ok) {
                    const content = await response.text();
                    const lines = this.countCodeLines(content, file.type);
                    
                    reviewFilesData.push({
                        path: file.path,
                        type: file.type,
                        lines: lines,
                        size: content.length
                    });
                }
            } catch (e) {
                console.warn(`Не удалось загрузить ${file.path}:`, e);
            }
        }
        
        return reviewFilesData;
    },

    // Отображение диаграммы распределения контента
    async renderContentDistributionChart() {
        const canvas = document.getElementById('content-distribution-chart');
        if (!canvas) return;
        
        // Устанавливаем размер canvas
        const size = 300;
        canvas.width = size;
        canvas.height = size;
        
        const ctx = canvas.getContext('2d');
        
        // Загружаем review-файлы
        const reviewFilesData = await this.loadReviewFilesData();
        
        // Подсчитываем размеры по корневым папкам (UI разбиваем на подпапки)
        const folderStats = {};
        const uiSubfolderStats = {};
        
        // Обрабатываем основные файлы
        this.filesData.forEach(file => {
            const uiSubfolder = this.getUISubfolder(file.path);
            
            if (uiSubfolder !== null) {
                // Файл в UI - группируем по подпапкам
                if (!uiSubfolderStats[uiSubfolder]) {
                    uiSubfolderStats[uiSubfolder] = { lines: 0, files: [] };
                }
                uiSubfolderStats[uiSubfolder].lines += file.lines;
                if (!uiSubfolderStats[uiSubfolder].files.includes(file.path)) {
                    uiSubfolderStats[uiSubfolder].files.push(file.path);
                }
            } else {
                // Файл не в UI - группируем по корневым папкам
                const folder = this.getRootFolder(file.path);
                if (!folderStats[folder]) {
                    folderStats[folder] = { lines: 0, files: [] };
                }
                folderStats[folder].lines += file.lines;
                if (!folderStats[folder].files.includes(file.path)) {
                    folderStats[folder].files.push(file.path);
                }
            }
        });
        
        // Обрабатываем review-файлы
        reviewFilesData.forEach(file => {
            const uiSubfolder = this.getUISubfolder(file.path);
            
            if (uiSubfolder !== null) {
                // Review-файл в UI
                if (!uiSubfolderStats[uiSubfolder]) {
                    uiSubfolderStats[uiSubfolder] = { lines: 0, files: [] };
                }
                uiSubfolderStats[uiSubfolder].lines += file.lines;
                if (!uiSubfolderStats[uiSubfolder].files.includes(file.path)) {
                    uiSubfolderStats[uiSubfolder].files.push(file.path);
                }
            } else {
                // Review-файл не в UI
                const folder = this.getRootFolder(file.path);
                if (!folderStats[folder]) {
                    folderStats[folder] = { lines: 0, files: [] };
                }
                folderStats[folder].lines += file.lines;
                if (!folderStats[folder].files.includes(file.path)) {
                    folderStats[folder].files.push(file.path);
                }
            }
        });
        
        // Объединяем статистику: UI подпапки + остальные папки
        const allSections = [];
        
        // Добавляем UI подпапки (сортируем от больших к меньшим)
        const sortedUISubfolders = Object.entries(uiSubfolderStats)
            .filter(([subfolder, stats]) => stats.lines > 0)
            .sort((a, b) => b[1].lines - a[1].lines);
        
        sortedUISubfolders.forEach(([subfolder, stats]) => {
            allSections.push({
                id: `ui-${subfolder}`,
                name: subfolder === 'ui-root' ? 'UI (root)' : `UI/${subfolder}`,
                lines: stats.lines,
                isUI: true
            });
        });
        
        // Добавляем остальные папки (сортируем от больших к меньшим)
        const sortedFolders = Object.entries(folderStats)
            .filter(([folder, stats]) => stats.lines > 0)
            .sort((a, b) => b[1].lines - a[1].lines);
        
        sortedFolders.forEach(([folder, stats]) => {
            allSections.push({
                id: folder,
                name: folder,
                lines: stats.lines,
                isUI: false
            });
        });
        
        // Сортируем все секции от больших к меньшим
        allSections.sort((a, b) => b.lines - a.lines);
        
        if (allSections.length === 0) return;
        
        // Переставляем: первый и последний - два наибольших
        let sortedSections = [...allSections];
        if (sortedSections.length >= 2) {
            const first = sortedSections[0];
            const second = sortedSections[1];
            const rest = sortedSections.slice(2);
            sortedSections = [first, ...rest, second];
        }
        
        // Маппинг имен папок на отображаемые названия
        const folderNames = {
            'root': 'Root',
            'core': 'Core',
            'mm': 'MM',
            'app': 'App',
            'docs': 'Docs',
            'api': 'API',
            'components': 'Components',
            'styles': 'Styles',
            'interaction': 'Interaction',
            'utils': 'Utils',
            'config': 'Config',
            'assets': 'Assets',
            'ui-root': 'UI'
        };
        
        // Базовые цвета для папок
        const baseColors = {
            'root': '#6c757d',
            'core': '#6f42c1',
            'mm': '#198754',
            'app': '#0d6efd',
            'docs': '#ffc107'
        };
        
        // Разноцветные цвета для UI подпапок
        const uiColors = {
            'api': '#dc3545',
            'components': '#fd7e14',
            'styles': '#ffc107',
            'interaction': '#198754',
            'utils': '#0d6efd',
            'config': '#6f42c1',
            'assets': '#20c997',
            'ui-root': '#e83e8c'
        };
        
        const defaultColors = ['#0d6efd', '#198754', '#dc3545', '#ffc107', '#6f42c1', '#fd7e14', '#6c757d'];
        
        const values = sortedSections.map(section => section.lines);
        const total = values.reduce((a, b) => a + b, 0);
        
        const centerX = size / 2;
        const centerY = size / 2;
        const radius = size / 3;
        let currentAngle = -Math.PI / 2;
        
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        sortedSections.forEach((section, index) => {
            const sliceAngle = (values[index] / total) * 2 * Math.PI;
            
            ctx.beginPath();
            ctx.moveTo(centerX, centerY);
            ctx.arc(centerX, centerY, radius, currentAngle, currentAngle + sliceAngle);
            ctx.closePath();
            
            // Определяем цвет
            let fillColor;
            if (section.isUI) {
                const subfolder = section.id.replace('ui-', '');
                fillColor = uiColors[subfolder] || 'rgba(220, 53, 69, 0.5)';
            } else {
                fillColor = baseColors[section.id] || defaultColors[index % defaultColors.length];
            }
            
            ctx.fillStyle = fillColor;
            ctx.fill();
            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 2;
            ctx.stroke();
            
            // Подпись
            const labelAngle = currentAngle + sliceAngle / 2;
            const labelX = centerX + Math.cos(labelAngle) * (radius + 30);
            const labelY = centerY + Math.sin(labelAngle) * (radius + 30);
            
            ctx.fillStyle = '#333';
            ctx.font = 'bold 12px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            const displayName = folderNames[section.name] || (section.isUI ? section.name.replace('ui-', '') : section.name.toUpperCase());
            ctx.fillText(displayName, labelX, labelY);
            
            currentAngle += sliceAngle;
        });
    },

    // Отображение статистики иконок (для popover)
    renderIconsStats() {
        if (!this.iconsStats) return '';
        
        let html = `
            <div class="stat-item">
                <div class="stat-item-label"><strong>По категориям:</strong></div>
            </div>
        `;
        
        Object.entries(this.iconsStats.byCategory).sort((a, b) => b[1] - a[1]).forEach(([category, count]) => {
            html += `
                <div class="stat-item">
                    <div class="stat-item-label">${category}:</div>
                    <div class="stat-item-value">${count}</div>
                </div>
            `;
        });
        
        return html;
    },

    // Отображение статистики цветов (для popover)
    renderColorsStats() {
        if (!this.colorsStats) return '';
        
        let html = `
            <div class="stat-item">
                <div class="stat-item-label"><strong>По категориям:</strong></div>
            </div>
        `;
        
        Object.entries(this.colorsStats.byCategory).sort((a, b) => b[1] - a[1]).forEach(([category, count]) => {
            html += `
                <div class="stat-item">
                    <div class="stat-item-label">${category}:</div>
                    <div class="stat-item-value">${count}</div>
                </div>
            `;
        });
        
        return html;
    },

    // Инициализация статистики (только для review-app.html)
    async init() {
        // Проверяем, что мы на странице статистики
        const currentFile = window.location.pathname.split('/').pop();
        if (currentFile !== 'review-app.html') {
            return; // Не инициализируем статистику на других страницах
        }
        
        await this.loadFilesData();
        this.loadIconsStats();
        await this.loadColorsStats();
        
        this.renderMainStats();
        this.renderFilesRanking();
        await this.renderCharts();
        
        // Инициализируем popover для карточек иконок и цветов
        this.initPopovers();
    },
    
    // Инициализация popover для карточек
    initPopovers() {
        // Ждем загрузки Bootstrap
        if (typeof bootstrap === 'undefined') {
            setTimeout(() => this.initPopovers(), 100);
            return;
        }
        
        // Popover для иконок
        const iconsCard = document.getElementById('icons-stat-card');
        if (iconsCard) {
            const iconsContent = this.renderIconsStats();
            if (iconsContent) {
                new bootstrap.Popover(iconsCard, {
                    content: iconsContent,
                    html: true,
                    trigger: 'click',
                    placement: 'bottom'
                });
            }
        }
        
        // Popover для цветов
        const colorsCard = document.getElementById('colors-stat-card');
        if (colorsCard) {
            const colorsContent = this.renderColorsStats();
            if (colorsContent) {
                new bootstrap.Popover(colorsCard, {
                    content: colorsContent,
                    html: true,
                    trigger: 'click',
                    placement: 'bottom'
                });
            }
        }
    }
};

// Экспорт для использования в других скриптах
if (typeof window !== 'undefined') {
    window.ReviewManager = {
        createReviewHeader,
        initReviewHeader,
        TableSorter,
        DataFilter,
        FileUtils,
        REVIEW_CONFIG,
        ProjectStats
    };
}

// Автоматическая инициализация статистики при загрузке DOM (только для review-app.html)
document.addEventListener('DOMContentLoaded', () => {
    ProjectStats.init();
});

