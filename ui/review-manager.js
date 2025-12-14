/**
 * Единый менеджер для всех review-файлов документации
 * Управляет хедером с вкладками, навигацией и общими функциями
 */

// Конфигурация review-файлов
const REVIEW_CONFIG = {
    'icons': {
        title: 'Иконки',
        file: 'ui/assets/icons-review.html',
        description: 'Каталог всех иконок проекта'
    },
    'colors': {
        title: 'Цвета',
        file: 'ui/styles/colors-review.html',
        description: 'Каталог всех цветовых переменных проекта'
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
        // config.file содержит полный путь от корня проекта (например, 'ui/assets/icons-review.html')
        let basePath = '';
        if (currentPath.includes('/ui/assets/')) {
            basePath = '../../'; // Из ui/assets/ в корень проекта
        } else if (currentPath.includes('/ui/styles/')) {
            basePath = '../../'; // Из ui/styles/ в корень проекта
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
        return; // Хедер уже существует
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
    
    Object.entries(REVIEW_CONFIG).forEach(([id, config]) => {
        // Проверяем как по полному пути, так и по имени файла
        if (currentPath.includes(config.file) || config.file.endsWith(currentFile)) {
            currentReview = id;
        }
    });
    
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

// Экспорт для использования в других скриптах
if (typeof window !== 'undefined') {
    window.ReviewManager = {
        createReviewHeader,
        initReviewHeader,
        TableSorter,
        DataFilter,
        FileUtils,
        REVIEW_CONFIG
    };
}

