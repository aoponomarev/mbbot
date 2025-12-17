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
        description: 'Демо единого компонента сообщений (AppMessages + system-messages)'
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

    // Контейнер системных сообщений (под вкладками).
    // Используется всеми review-страницами для информирования о статусе/проблемах сбора данных.
    const systemMessages = document.createElement('div');
    systemMessages.className = 'review-system-messages';
    systemMessages.setAttribute('role', 'status');
    systemMessages.setAttribute('aria-live', 'polite');

    // Mount-point для Vue-host системных сообщений (Level 2 migration, Step 1).
    // Внутри него будет смонтирован <system-messages scope="review" />.
    const vueMessagesMount = document.createElement('div');
    vueMessagesMount.id = 'review-system-messages-vue';
    systemMessages.appendChild(vueMessagesMount);

    header.appendChild(systemMessages);
    
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

    return header;
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
 * Системные сообщения для review-страниц (под вкладками).
 * Используется для:
 * - индикации выбранного источника данных (FS/GitHub/DepGraph/Cache)
 * - предупреждений о неполноте данных (например, DepGraph видит только подключённые файлы)
 * - ошибок сбора и подсказок с действиями (например, "Выбрать папку проекта")
 */
const ReviewSystemMessages = {
    _store: null,
    _storeLoading: null,

    _getBasePathToRoot() {
        const currentPath = window.location.pathname;
        if (currentPath.includes('/ui/assets/')) return '../../';
        if (currentPath.includes('/ui/styles/')) return '../../';
        if (currentPath.includes('/ui/interaction/')) return '../../';
        if (currentPath.includes('/ui/')) return '../';
        if (currentPath.includes('/docs/')) return '../';
        return '';
    },

    async _loadStore() {
        if (this._store) return this._store;
        if (this._storeLoading) return await this._storeLoading;

        this._storeLoading = (async () => {
            try {
                const base = this._getBasePathToRoot();
                const resp = await fetch(`${base}tools/review-system-messages.json`);
                if (!resp.ok) return null;
                const json = await resp.json();
                this._store = json;
                return json;
            } catch {
                return null;
            } finally {
                this._storeLoading = null;
            }
        })();

        return await this._storeLoading;
    },

    async post(key, overrides = {}) {
        const store = await this._loadStore();
        const tpl = store?.messages?.[key] || null;

        const msg = {
            ...(tpl || {}),
            ...overrides
        };

        // Action IDs -> real actions
        if (tpl?.actions && !overrides.actions) {
            msg.actions = (tpl.actions || []).map(actionId => {
                const def = store?.actions?.[actionId] || {};

                // Привязка handler’ов (код остаётся в JS, а label/kind — в store)
                if (actionId === 'retry') {
                    return { label: def.label || 'Повторить', kind: def.kind || 'primary', onClick: () => window.location.reload() };
                }
                if (actionId === 'chooseFolder' || actionId === 'chooseFolderFull') {
                    return {
                        label: def.label || 'Выбрать папку',
                        kind: def.kind || 'primary',
                        onClick: async () => {
                            try {
                                const pipeline = window.ReviewManager?.ReviewDataPipeline;
                                if (pipeline?.chooseFolder) {
                                    await pipeline.chooseFolder();
                                }
                                window.location.reload();
                            } catch (err) {
                                ReviewSystemMessages.add({
                                    id: 'choose-folder-error',
                                    level: 'error',
                                    text: 'Не удалось выбрать папку.',
                                    details: String(err?.message || err)
                                });
                            }
                        }
                    };
                }

                // Unknown actionId: no-op
                return { label: def.label || actionId, kind: def.kind || 'secondary', onClick: () => {} };
            });
        }

        this.add(msg);
    },

    /**
     * Возвращает контейнер сообщений, создавая хедер при необходимости.
     * @returns {HTMLElement|null}
     */
    getContainer() {
        // Хедер может ещё не быть вставлен, если скрипт загрузился раньше body.
        const container = document.querySelector('.review-system-messages');
        if (container) return container;
        // Пытаемся вставить хедер и повторить.
        try {
            initReviewHeader();
        } catch (_) {
            // ignore
        }
        return document.querySelector('.review-system-messages');
    },

    clear() {
        // Новый рендер (Level 2): очищаем сообщения в store (scope = review)
        try {
            window.AppMessages?.clear?.('review');
        } catch (_) {
            // ignore
        }

        const c = this.getContainer();
        if (!c) return;

        // Legacy DOM-рендер: удаляем только старые alert, НЕ трогая Vue mount.
        const mount = c.querySelector('#review-system-messages-vue');
        if (!mount) {
            c.innerHTML = '';
            return;
        }
        Array.from(c.children).forEach(ch => {
            if (ch === mount) return;
            ch.remove();
        });
    },

    /**
     * Добавляет сообщение.
     * @param {Object} msg
     * @param {'info'|'warning'|'error'} msg.level
     * @param {string} msg.text
     * @param {string=} msg.details
     * @param {Array<{label:string, kind?:'primary'|'secondary'|'outline', onClick:Function}>=} msg.actions
     * @param {string=} msg.id
     */
    add(msg) {
        // Новый рендер (Level 2): пишем в единое хранилище, которое рендерит Vue-компонент.
        if (window.AppMessages?.push) {
            const level = (msg.level || msg.type || 'info');
            const type =
                level === 'error' ? 'danger' :
                level === 'warning' ? 'warning' :
                level === 'success' ? 'success' :
                'info';

            const id = msg.id ? `review_${msg.id}` : undefined;

            window.AppMessages.push({
                id,
                scope: 'review',
                type,
                text: msg.text || '',
                details: msg.details || null,
                actions: Array.isArray(msg.actions) ? msg.actions : []
            });
            return;
        }

        const c = this.getContainer();
        if (!c) return;

        const level = msg.level || 'info';
        const alertClass = level === 'error' ? 'alert-danger' : (level === 'warning' ? 'alert-warning' : 'alert-info');

        // Если задан id — заменяем существующее сообщение с тем же id (чтобы не спамить).
        if (msg.id) {
            const esc = (window.CSS && typeof window.CSS.escape === 'function')
                ? window.CSS.escape(msg.id)
                : String(msg.id).replace(/"/g, '\\"');
            const existing = c.querySelector(`[data-review-msg-id="${esc}"]`);
            if (existing) existing.remove();
        }

        const alert = document.createElement('div');
        alert.className = `alert ${alertClass}`;
        if (msg.id) alert.dataset.reviewMsgId = msg.id;

        // Кнопка закрытия (крестик)
        const closeBtn = document.createElement('button');
        closeBtn.type = 'button';
        closeBtn.className = 'review-msg-close';
        closeBtn.setAttribute('aria-label', 'Закрыть сообщение');
        closeBtn.innerHTML = `
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M2 2 L14 14 M14 2 L2 14"
                      stroke="currentColor"
                      stroke-width="0.8"
                      stroke-linecap="round"
                      fill="none"/>
            </svg>
        `;
        closeBtn.addEventListener('click', () => alert.remove());
        alert.appendChild(closeBtn);

        const main = document.createElement('div');
        main.textContent = msg.text || '';
        alert.appendChild(main);

        if (msg.details) {
            const details = document.createElement('div');
            details.style.opacity = '0.85';
            details.style.marginTop = '0.25rem';
            details.style.fontSize = '0.85em';
            details.textContent = msg.details;
            alert.appendChild(details);
        }

        if (Array.isArray(msg.actions) && msg.actions.length > 0) {
            const actions = document.createElement('div');
            actions.className = 'review-msg-actions';

            msg.actions.forEach(action => {
                const btn = document.createElement('button');
                btn.type = 'button';
                const kind = action.kind || 'secondary';
                const cls =
                    kind === 'primary' ? 'btn btn-sm btn-primary' :
                    kind === 'outline' ? 'btn btn-sm btn-outline-secondary' :
                    'btn btn-sm btn-secondary';
                btn.className = cls;
                btn.textContent = action.label;
                btn.addEventListener('click', (e) => {
                    e.preventDefault();
                    try { action.onClick?.(); } catch (err) { console.error(err); }
                });
                actions.appendChild(btn);
            });

            alert.appendChild(actions);
        }

        c.appendChild(alert);
    }
};

/**
 * ReviewDataPipeline: единый слой доступа к "фактической кодовой базе" (без Node-генераторов).
 *
 * Источники (fallback chain):
 * - FS: File System Access API / webkitdirectory (локальная папка проекта)
 * - GitHub: GitHub API tree + raw.githubusercontent.com (GitHub Pages/онлайн)
 * - DepGraph: dependency graph от entrypoint'ов (без списка файлов)
 *
 * Кэш:
 * - localStorage (результаты сканеров + fingerprint) — для мгновенного старта
 */
const ReviewDataPipeline = (() => {
    const CACHE_PREFIX = 'review.data.cache.v1';
    const CONFIG_KEY = 'review.data.config.v1';

    /**
     * Определяет относительный путь от текущей страницы к корню проекта.
     * (копирует логику basePath из createReviewHeader)
     */
    function getBasePathToRoot() {
        const currentPath = window.location.pathname;
        if (currentPath.includes('/ui/assets/')) return '../../';
        if (currentPath.includes('/ui/styles/')) return '../../';
        if (currentPath.includes('/ui/interaction/')) return '../../';
        if (currentPath.includes('/ui/')) return '../';
        if (currentPath.includes('/docs/')) return '../';
        return '';
    }

    function nowIso() {
        return new Date().toISOString();
    }

    function getConfig() {
        try {
            const raw = localStorage.getItem(CONFIG_KEY);
            return raw ? JSON.parse(raw) : {};
        } catch {
            return {};
        }
    }

    function setConfig(next) {
        try {
            localStorage.setItem(CONFIG_KEY, JSON.stringify(next || {}));
        } catch {
            // ignore
        }
    }

    function parseRepoFromOriginUrl(originUrl) {
        // https://github.com/<owner>/<repo>.git
        const m = String(originUrl || '').match(/github\.com\/([^/]+)\/([^/.]+)(?:\.git)?$/i);
        if (!m) return null;
        return { owner: m[1], repo: m[2] };
    }

    function parseRepoFromLocation() {
        // GitHub Pages: https://<owner>.github.io/<repo>/...
        const host = window.location.host || '';
        const path = window.location.pathname || '';
        if (!host.endsWith('.github.io')) return null;
        const owner = host.split('.')[0];
        const repo = path.replace(/^\/+/, '').split('/')[0];
        if (!owner || !repo) return null;
        return { owner, repo };
    }

    function parseRepoConfig() {
        const url = new URL(window.location.href);
        const qpOwner = url.searchParams.get('owner');
        const qpRepo = url.searchParams.get('repo');
        const qpBranch = url.searchParams.get('branch');
        if (qpOwner && qpRepo) {
            return { owner: qpOwner, repo: qpRepo, branch: qpBranch || 'master', from: 'query' };
        }

        const cfg = getConfig();
        if (cfg?.github?.owner && cfg?.github?.repo) {
            return { owner: cfg.github.owner, repo: cfg.github.repo, branch: cfg.github.branch || 'master', from: 'storage' };
        }

        const fromPages = parseRepoFromLocation();
        if (fromPages) {
            return { owner: fromPages.owner, repo: fromPages.repo, branch: 'master', from: 'pages' };
        }

        // Последний безопасный fallback: если кто-то вручную положит originUrl в config.
        if (cfg?.github?.originUrl) {
            const parsed = parseRepoFromOriginUrl(cfg.github.originUrl);
            if (parsed) {
                return { owner: parsed.owner, repo: parsed.repo, branch: cfg.github.branch || 'master', from: 'originUrl' };
            }
        }

        return null;
    }

    function cacheKeyFor(scannerId, fingerprint, sourceId) {
        return `${CACHE_PREFIX}:${scannerId}:${sourceId}:${fingerprint}`;
    }

    function cacheGet(key) {
        try {
            const raw = localStorage.getItem(key);
            return raw ? JSON.parse(raw) : null;
        } catch {
            return null;
        }
    }

    function cacheSet(key, value) {
        try {
            localStorage.setItem(key, JSON.stringify(value));
        } catch {
            // ignore
        }
    }

    async function sha256(text) {
        if (!crypto?.subtle) return null;
        const data = new TextEncoder().encode(String(text ?? ''));
        const hash = await crypto.subtle.digest('SHA-256', data);
        return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('');
    }

    /** Базовый интерфейс файлового индекса */
    class FileIndex {
        constructor(sourceId) {
            this.sourceId = sourceId;
        }
        async fingerprint() { return null; }
        async listFiles() { return []; }
        async readText(_path) { throw new Error('Not implemented'); }
    }

    /** FS index: выбирается пользователем (папка/набор файлов) */
    class FsFileIndex extends FileIndex {
        constructor(mode, payload) {
            super('fs');
            this.mode = mode; // 'directoryHandle' | 'fileList'
            this.payload = payload;
            this._fileMap = new Map(); // path -> File or FileSystemFileHandle
            this._manifest = null;
        }

        static async fromDirectoryHandle(handle) {
            const idx = new FsFileIndex('directoryHandle', { handle });
            await idx._indexDirectoryHandle();
            return idx;
        }

        static async fromFileList(fileList) {
            const idx = new FsFileIndex('fileList', { files: Array.from(fileList || []) });
            idx._indexFileList();
            return idx;
        }

        _indexFileList() {
            const files = this.payload.files || [];
            const manifest = [];
            files.forEach(f => {
                const rel = f.webkitRelativePath || f.name;
                const norm = rel.replace(/^\/+/, '');
                this._fileMap.set(norm, f);
                manifest.push({ path: norm, size: f.size, lastModified: f.lastModified || 0 });
            });
            this._manifest = manifest.sort((a, b) => a.path.localeCompare(b.path));
        }

        async _indexDirectoryHandle() {
            const root = this.payload.handle;
            const manifest = [];

            const walk = async (dirHandle, prefix) => {
                // eslint-disable-next-line no-restricted-syntax
                for await (const [name, entry] of dirHandle.entries()) {
                    const relPath = `${prefix}${name}`;
                    if (entry.kind === 'directory') {
                        // Исключения по правилам проекта
                        if (name === '.git' || name === 'node_modules' || name === 'old_app_not_write' || name === 'docs') {
                            continue;
                        }
                        await walk(entry, `${relPath}/`);
                    } else if (entry.kind === 'file') {
                        this._fileMap.set(relPath, entry);
                        try {
                            const file = await entry.getFile();
                            manifest.push({ path: relPath, size: file.size, lastModified: file.lastModified || 0 });
                        } catch {
                            manifest.push({ path: relPath, size: 0, lastModified: 0 });
                        }
                    }
                }
            };

            await walk(root, '');
            this._manifest = manifest.sort((a, b) => a.path.localeCompare(b.path));
        }

        async fingerprint() {
            if (!this._manifest) return null;
            const h = await sha256(JSON.stringify(this._manifest));
            return h ? `fs:${h}` : null;
        }

        async listFiles() {
            return Array.from(this._fileMap.keys());
        }

        async readText(path) {
            const entry = this._fileMap.get(path);
            if (!entry) throw new Error(`FS: file not found: ${path}`);
            const file = (entry instanceof File) ? entry : await entry.getFile();
            return await file.text();
        }
    }

    /** GitHub index: дерево репозитория + чтение через raw.githubusercontent.com */
    class GitHubFileIndex extends FileIndex {
        constructor(owner, repo, branch, tree, treeSha) {
            super('github');
            this.owner = owner;
            this.repo = repo;
            this.branch = branch;
            this.tree = tree; // array of {path,type}
            this.treeSha = treeSha;
        }

        async fingerprint() {
            return this.treeSha ? `gh:${this.owner}/${this.repo}:${this.branch}:${this.treeSha}` : null;
        }

        async listFiles() {
            return this.tree.filter(n => n.type === 'blob').map(n => n.path);
        }

        async readText(path) {
            const url = `https://raw.githubusercontent.com/${this.owner}/${this.repo}/${this.branch}/${path}`;
            const resp = await fetch(url);
            if (!resp.ok) throw new Error(`GitHub raw fetch failed (${resp.status}): ${path}`);
            return await resp.text();
        }
    }

    /** DepGraph index: собирает файлы, реально подключённые из entrypoint'ов */
    class DepGraphFileIndex extends FileIndex {
        constructor(rootBasePath, filesSet, fingerprintValue) {
            super('depgraph');
            this.rootBasePath = rootBasePath;
            this._files = Array.from(filesSet || []).sort();
            this._fingerprint = fingerprintValue || null;
        }

        async fingerprint() {
            return this._fingerprint ? `dg:${this._fingerprint}` : null;
        }

        async listFiles() {
            return this._files;
        }

        async readText(path) {
            const url = `${this.rootBasePath}${path}`;
            const resp = await fetch(url);
            if (!resp.ok) throw new Error(`DepGraph fetch failed (${resp.status}): ${path}`);
            return await resp.text();
        }
    }

    function shouldExcludePath(p) {
        // Правила проекта: docs/ не читаем; old_app_not_write/ не трогаем
        return (
            p.startsWith('docs/') ||
            p.startsWith('old_app_not_write/') ||
            p.startsWith('.git/') ||
            p.includes('/.git/') ||
            p.startsWith('node_modules/') ||
            p.includes('/node_modules/')
        );
    }

    async function buildGitHubIndex() {
        const repoCfg = parseRepoConfig();
        if (!repoCfg) {
            throw new Error('GitHub repo config not found');
        }

        const { owner, repo, branch } = repoCfg;
        const branchUrl = `https://api.github.com/repos/${owner}/${repo}/branches/${branch}`;
        const br = await fetch(branchUrl, { headers: { 'Accept': 'application/vnd.github+json' } });
        if (!br.ok) {
            throw new Error(`GitHub branch API failed (${br.status})`);
        }
        const brJson = await br.json();
        const commitSha = brJson?.commit?.sha;
        if (!commitSha) throw new Error('GitHub branch response missing commit.sha');

        const treeUrl = `https://api.github.com/repos/${owner}/${repo}/git/trees/${commitSha}?recursive=1`;
        const tr = await fetch(treeUrl, { headers: { 'Accept': 'application/vnd.github+json' } });
        if (!tr.ok) {
            // 403 здесь часто означает rate-limit — делаем текст для системного сообщения.
            throw new Error(`GitHub tree API failed (${tr.status})`);
        }
        const trJson = await tr.json();
        const treeSha = trJson?.sha;
        const tree = Array.isArray(trJson?.tree) ? trJson.tree : [];
        return new GitHubFileIndex(owner, repo, branch, tree, treeSha);
    }

    async function buildDepGraphIndex() {
        const base = getBasePathToRoot();
        const entrypoints = [
            'index.html',
            'review-app.html',
            'ui/review-manager.js'
        ];

        const visited = new Set();
        const queue = [...entrypoints];
        const collected = new Set();

        const addLocal = (ref) => {
            if (!ref) return;
            // Отбрасываем внешние ссылки
            if (/^(https?:)?\/\//i.test(ref)) return;
            if (ref.startsWith('data:')) return;
            if (ref.startsWith('#')) return;
            const clean = ref.split('#')[0].split('?')[0];
            const norm = clean.replace(/^\/+/, '');
            if (!norm) return;
            if (shouldExcludePath(norm)) return;
            collected.add(norm);
            if (!visited.has(norm) && (norm.endsWith('.html') || norm.endsWith('.css') || norm.endsWith('.js'))) {
                queue.push(norm);
            }
        };

        while (queue.length > 0) {
            const p = queue.shift();
            if (!p || visited.has(p)) continue;
            visited.add(p);
            try {
                const resp = await fetch(`${base}${p}`);
                if (!resp.ok) continue;
                const text = await resp.text();
                collected.add(p);
                if (p.endsWith('.html')) {
                    // Примитивный парсинг: script src / link href
                    const srcRe = /<script[^>]+src=["']([^"']+)["']/gi;
                    const hrefRe = /<link[^>]+href=["']([^"']+)["']/gi;
                    let m;
                    while ((m = srcRe.exec(text))) addLocal(m[1]);
                    while ((m = hrefRe.exec(text))) addLocal(m[1]);
                }
                // CSS/JS рекурсивно не парсим (умышленно: быстрый фоллбек, не полный граф)
            } catch {
                // ignore
            }
        }

        // Fingerprint: хэш entrypoint'ов (достаточно для кэша DepGraph)
        const fp = await sha256(Array.from(collected).sort().join('\n'));
        return new DepGraphFileIndex(base, collected, fp);
    }

    // In-memory state
    let fsIndex = null;
    let activeIndex = null;

    async function chooseFolderWithPicker() {
        if (typeof window.showDirectoryPicker === 'function') {
            const handle = await window.showDirectoryPicker({ mode: 'read' });
            fsIndex = await FsFileIndex.fromDirectoryHandle(handle);
            return fsIndex;
        }

        // Fallback: input[webkitdirectory]
        return await new Promise((resolve, reject) => {
            const input = document.createElement('input');
            input.type = 'file';
            input.multiple = true;
            input.setAttribute('webkitdirectory', '');
            input.style.position = 'fixed';
            input.style.left = '-9999px';
            input.style.top = '-9999px';
            document.body.appendChild(input);

            input.addEventListener('change', async () => {
                try {
                    const files = input.files;
                    document.body.removeChild(input);
                    if (!files || files.length === 0) {
                        reject(new Error('No files selected'));
                        return;
                    }
                    fsIndex = await FsFileIndex.fromFileList(files);
                    resolve(fsIndex);
                } catch (e) {
                    reject(e);
                }
            }, { once: true });

            input.click();
        });
    }

    async function getFileIndex(options = {}) {
        const allowPrompt = options.allowPrompt === true;

        // 1) Если пользователь уже выбрал папку — используем её.
        if (fsIndex) {
            activeIndex = fsIndex;
            // best-effort: показываем источник через централизованный store (если доступен)
            ReviewSystemMessages.post?.('source.fs', { id: 'source' });
            return fsIndex;
        }

        // 2) Пробуем GitHub (если настроено/определилось).
        try {
            const repoCfg = parseRepoConfig();
            if (repoCfg) {
                const gh = await buildGitHubIndex();
                activeIndex = gh;
                ReviewSystemMessages.post?.('source.github', {
                    id: 'source',
                    text: `Источник данных: GitHub (${repoCfg.owner}/${repoCfg.repo}@${repoCfg.branch}).`
                });
                return gh;
            }
        } catch (e) {
            ReviewSystemMessages.post?.('github.unavailable', { id: 'github-warning', details: String(e?.message || e) });
        }

        // 3) DepGraph fallback (всегда доступен, но неполный).
        try {
            const dg = await buildDepGraphIndex();
            activeIndex = dg;
            ReviewSystemMessages.post?.('source.depgraph', { id: 'source' });
            return dg;
        } catch (e) {
            // ignore and fallthrough
        }

        // 4) Если разрешено — предлагаем выбрать папку.
        if (allowPrompt) {
            ReviewSystemMessages.post?.('chooseFolder.prompt', { id: 'choose-folder' });
        } else {
            ReviewSystemMessages.add({
                id: 'no-source',
                level: 'error',
                text: 'Не удалось определить источник данных для review.',
                details: 'Включите сеть (для GitHub) или выберите папку проекта (FS).'
            });
        }

        throw new Error('No available data source');
    }

    /**
     * Возвращает fingerprint активного источника (для кэша сканеров).
     */
    async function getActiveFingerprint() {
        const idx = activeIndex || await getFileIndex({ allowPrompt: false });
        const fp = await idx.fingerprint();
        return fp || `${idx.sourceId}:no-fp`;
    }

    /**
     * Универсальный helper: выполняет сканер с кэшем.
     */
    async function runScannerWithCache(scannerId, runner) {
        const idx = await getFileIndex({ allowPrompt: true });
        const fp = await getActiveFingerprint();
        const key = cacheKeyFor(scannerId, fp, idx.sourceId);

        const cached = cacheGet(key);
        if (cached?.payload && cached?.fingerprint === fp) {
            // Кэш-сообщение оставляем динамическим (не храним в store, т.к. scannerId/updatedAt — переменные).
            ReviewSystemMessages.add({
                id: `cache-${scannerId}`,
                level: 'info',
                text: `Кэш: ${scannerId} (актуально)`,
                details: `updatedAt: ${cached.updatedAt}`
            });
            return cached.payload;
        }

        const payload = await runner(idx);
        cacheSet(key, { fingerprint: fp, updatedAt: nowIso(), payload });
        return payload;
    }

    /**
     * Сканер: статистика по файлам (строки/размеры/типы/папки).
     * Исключает docs/, old_app_not_write/, node_modules/, .git/ и history/ (дневники).
     */
    async function scanStats() {
        return await runScannerWithCache('stats', async (idx) => {
            const paths = (await idx.listFiles()).filter(p => !shouldExcludePath(p) && !p.startsWith('history/'));
            const allowedExt = new Set(['js', 'css', 'html', 'json', 'md']);
            const reviewFiles = new Set([
                'review-app.html',
                'ui/assets/review-icons.html',
                'ui/styles/review-colors.html',
                'ui/interaction/review-messages.html'
            ]);

            const isCommentLine = (trimmed, fileType) => {
                if (fileType === 'js') {
                    return trimmed.startsWith('//') || trimmed.startsWith('/*') || trimmed.startsWith('*');
                } else if (fileType === 'html') {
                    return trimmed.startsWith('<!--') || trimmed.endsWith('-->');
                } else if (fileType === 'css') {
                    return trimmed.startsWith('/*') || trimmed.startsWith('*');
                }
                return false;
            };

            const countCodeLines = (content, ext) => {
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

                    if (trimmed && !isCommentLine(trimmed, ext)) {
                        codeLines++;
                    }
                }

                return codeLines;
            };

            const files = [];
            let totalLines = 0;

            for (const path of paths) {
                const fileName = path.split('/').pop();
                if (reviewFiles.has(path) || reviewFiles.has(fileName)) {
                    continue;
                }
                const ext = (fileName.includes('.') ? fileName.split('.').pop() : '').toLowerCase();
                if (!allowedExt.has(ext)) continue;
                try {
                    const content = await idx.readText(path);
                    const lines = countCodeLines(content, ext);
                    totalLines += lines;
                    files.push({ path, type: ext, lines, size: content.length });
                } catch {
                    // ignore unreadable
                }
            }

            const sorted = files.sort((a, b) => b.lines - a.lines);
            return {
                totalLines,
                totalFiles: sorted.length,
                files: sorted,
                generatedAt: nowIso()
            };
        });
    }

    /**
     * Сканер: иконки (минимизация статики).
     * Источники данных:
     * - ui/config/ui-element-mapping.json (если доступен)
     * - self-describing scan по кодовой базе (Font Awesome, icon-*, etc.)
     */
    async function scanIcons() {
        return await runScannerWithCache('icons', async (idx) => {
            const paths = (await idx.listFiles())
                .filter(p => !shouldExcludePath(p) && !p.startsWith('history/'));

            const textExt = new Set(['js', 'css', 'html', 'json', 'md']);
            const scanPaths = paths.filter(p => {
                const fileName = p.split('/').pop();
                const ext = (fileName.includes('.') ? fileName.split('.').pop() : '').toLowerCase();
                return textExt.has(ext);
            });

            // 1) mapping icons (пытаемся загрузить независимо от listFiles, чтобы работать даже в DepGraph)
            let mapping = null;
            try {
                const raw = await idx.readText('ui/config/ui-element-mapping.json');
                mapping = JSON.parse(raw);
            } catch {
                mapping = null;
            }

            const iconOcc = new Map(); // key -> Set(files)
            const faOcc = new Map();   // key "fas fa-xxx" -> Set(files)

            const faComboRe = /\b(fas|far|fab|fal|fad|fak)\s+(fa-[a-z0-9-]+)\b/gi;
            const faSingleRe = /\bfa-[a-z0-9-]+\b/gi;
            const iconClassRe = /\bicon-[a-z0-9-]+\b/gi;

            for (const p of scanPaths) {
                let content = '';
                try {
                    content = await idx.readText(p);
                } catch {
                    continue;
                }

                // icon-*
                let m;
                while ((m = iconClassRe.exec(content))) {
                    const cls = m[0];
                    if (!iconOcc.has(cls)) iconOcc.set(cls, new Set());
                    iconOcc.get(cls).add(p);
                }

                // fontawesome combos: "fas fa-..."
                while ((m = faComboRe.exec(content))) {
                    const combo = `${m[1].toLowerCase()} ${m[2].toLowerCase()}`;
                    if (!faOcc.has(combo)) faOcc.set(combo, new Set());
                    faOcc.get(combo).add(p);
                }

                // fontawesome singles: "fa-..." (без стиля) → считаем fas
                while ((m = faSingleRe.exec(content))) {
                    const name = m[0].toLowerCase();
                    const combo = `fas ${name}`;
                    if (!faOcc.has(combo)) faOcc.set(combo, new Set());
                    faOcc.get(combo).add(p);
                }
            }

            // Собираем unified list
            const icons = [];
            const seen = new Set();

            // mapping icons first
            const mappingIcons = mapping?.icons || {};
            Object.entries(mappingIcons).forEach(([iconClass, iconData]) => {
                const key = `map:${iconClass}`;
                if (seen.has(key)) return;
                seen.add(key);

                const commands = [];
                if (iconData?.commands) {
                    Object.entries(iconData.commands).forEach(([cmdName, cmdData]) => {
                        commands.push({
                            name: cmdName,
                            label: cmdData?.label || '',
                            tooltip: cmdData?.tooltip || '',
                            category: cmdData?.category || 'other'
                        });
                    });
                }

                const category = commands[0]?.category || 'other';
                const type = iconClass.startsWith('icon-') ? 'svg-file' : 'fontawesome';
                // Помечаем как уже учтённую, чтобы auto-detected не дублировал mapping-иконки.
                if (type === 'fontawesome') {
                    seen.add(`fa:${String(iconClass).toLowerCase()}`);
                } else if (type === 'svg-file') {
                    seen.add(`svg:${String(iconClass)}`);
                }
                const usageFiles = iconOcc.get(iconClass) || faOcc.get(iconClass) || new Set();

                icons.push({
                    type,
                    identifier: iconClass,
                    iconClass,
                    category,
                    commands,
                    usage: Array.from(usageFiles).slice(0, 20),
                    file: 'ui/config/ui-element-mapping.json',
                    baseIcon: iconData?.baseIcon || iconClass
                });
            });

            // detected fontawesome
            for (const [combo, filesSet] of faOcc.entries()) {
                const key = `fa:${combo}`;
                if (seen.has(key)) continue;
                seen.add(key);
                icons.push({
                    type: 'fontawesome',
                    identifier: combo,
                    iconClass: combo,
                    category: 'other',
                    commands: [],
                    usage: Array.from(filesSet).slice(0, 20),
                    file: 'auto-detected (Font Awesome)'
                });
            }

            // detected svg classes
            for (const [cls, filesSet] of iconOcc.entries()) {
                const key = `svg:${cls}`;
                if (seen.has(key)) continue;
                seen.add(key);
                icons.push({
                    type: 'svg-file',
                    identifier: cls,
                    iconClass: cls,
                    category: 'other',
                    commands: [],
                    usage: Array.from(filesSet).slice(0, 20),
                    file: 'auto-detected (class usage)'
                });
            }

            // Stats for other pages
            const byType = {};
            const byCategory = {};
            let totalCommands = 0;
            icons.forEach(i => { byType[i.type] = (byType[i.type] || 0) + 1; });
            icons.forEach(i => {
                const cat = i.category || 'other';
                byCategory[cat] = (byCategory[cat] || 0) + 1;
                totalCommands += Array.isArray(i.commands) ? i.commands.length : 0;
            });

            return {
                icons,
                stats: {
                    total: icons.length,
                    totalCommands,
                    byType,
                    byCategory
                },
                generatedAt: nowIso()
            };
        });
    }

    /**
     * Сканер: CSS переменные (автопарс из *.css + usage из var(--x)).
     */
    async function scanColors() {
        return await runScannerWithCache('colors', async (idx) => {
            const paths = (await idx.listFiles())
                .filter(p => !shouldExcludePath(p) && !p.startsWith('history/'));

            const cssFiles = paths.filter(p => p.endsWith('.css'));
            const textFiles = paths.filter(p => /\.(css|js|html|md|json)$/i.test(p));

            const defs = new Map(); // varName -> { files:Set, values:Set }
            const defRe = /(--[a-zA-Z0-9-_]+)\s*:\s*([^;]+);/g;

            for (const p of cssFiles) {
                let css = '';
                try { css = await idx.readText(p); } catch { continue; }
                let m;
                while ((m = defRe.exec(css))) {
                    const name = m[1];
                    const value = m[2].trim();
                    if (!defs.has(name)) defs.set(name, { files: new Set(), values: new Set() });
                    const d = defs.get(name);
                    d.files.add(p);
                    d.values.add(value);
                }
            }

            // usage: var(--x)
            const usage = new Map(); // varName -> { count:number, files:Set }
            const useRe = /var\(\s*(--[a-zA-Z0-9-_]+)\s*\)/g;

            for (const p of textFiles) {
                let text = '';
                try { text = await idx.readText(p); } catch { continue; }
                let m;
                while ((m = useRe.exec(text))) {
                    const name = m[1];
                    if (!usage.has(name)) usage.set(name, { count: 0, files: new Set() });
                    const u = usage.get(name);
                    u.count += 1;
                    u.files.add(p);
                }
            }

            const categorize = (name) => {
                if (name.startsWith('--bs-danger')) return 'danger';
                if (name.startsWith('--bs-success')) return 'success';
                if (name.startsWith('--bs-')) return 'bootstrap';
                if (name.startsWith('--color-header-')) return 'header';
                if (name.startsWith('--color-dropdown-')) return 'dropdown';
                if (name.startsWith('--color-theme-')) return 'theme';
                if (name.startsWith('--color-')) return 'ui';
                return 'other';
            };

            const colors = [];
            for (const [name, d] of defs.entries()) {
                const u = usage.get(name);
                colors.push({
                    category: categorize(name),
                    identifier: name,
                    // value* поля заполняются на странице через getComputedStyle,
                    // но тут оставляем rawValue как подсказку/фоллбек.
                    rawValue: Array.from(d.values)[0] || null,
                    usageCount: u?.count || 0,
                    usageFiles: Array.from(u?.files || []).slice(0, 20),
                    file: Array.from(d.files)[0] || ''
                });
            }

            colors.sort((a, b) => (b.usageCount - a.usageCount) || a.identifier.localeCompare(b.identifier));

            const byCategory = {};
            colors.forEach(c => { byCategory[c.category] = (byCategory[c.category] || 0) + 1; });

            return {
                colors,
                stats: {
                    total: colors.length,
                    byCategory
                },
                generatedAt: nowIso()
            };
        });
    }

    /**
     * Сканер: сообщения (best-effort).
     * Источники:
     * - tools/review-system-messages.json (шаблоны системных сообщений review)
     * - AppMessages.push/replace({ scope, type, text, details }) (эвристика, JS/HTML)
     */
    async function scanMessages() {
        // ВАЖНО: bump версии кэша сканера сообщений, т.к. логика расширилась
        // (store + AppMessages эвристика) и старый кэш может быть пустым/неполным.
        return await runScannerWithCache('messages_v2', async (idx) => {
            const allPaths = (await idx.listFiles())
                .filter(p => !shouldExcludePath(p) && !p.startsWith('history/'))
                .filter(p => p.endsWith('.html') || p.endsWith('.js') || p.endsWith('.json'));

            const messages = new Map(); // key -> {type,text,files:Set}

            const stripTags = (s) => String(s || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
            const normalizeType = (t) => {
                const x = String(t || 'info').toLowerCase();
                if (x === 'error') return 'danger';
                if (x === 'warn') return 'warning';
                return x;
            };
            const addMessage = ({ type, text, file }) => {
                const tt = normalizeType(type);
                const tx = String(text || '').replace(/\s+/g, ' ').trim().slice(0, 180);
                if (!tx) return;
                const key = `${tt}::${tx}`;
                if (!messages.has(key)) messages.set(key, { type: tt, text: tx, files: new Set() });
                if (file) messages.get(key).files.add(file);
            };

            // 1) review-system-messages.json (если доступен через выбранный fileIndex)
            let storeCount = 0;
            try {
                const raw = await idx.readText('tools/review-system-messages.json');
                const json = raw ? JSON.parse(raw) : null;
                const storeMsgs = json?.messages || {};
                Object.entries(storeMsgs).forEach(([k, tpl]) => {
                    const level = tpl?.level || 'info';
                    const type = level === 'error' ? 'danger' : (level === 'warning' ? 'warning' : 'info');
                    const text = tpl?.text || k;
                    addMessage({ type, text, file: 'tools/review-system-messages.json' });
                    storeCount++;
                });
            } catch (_) {
                // ignore
            }

            // 2) эвристика AppMessages в .html/.js
            const appMsgRe = /\bAppMessages\.(push|replace)\s*\(\s*(?:['"][^'"]+['"]\s*,\s*)?\{[\s\S]*?\}\s*\)/g;
            const scopeRe = /\bscope\s*:\s*["']([^"']+)["']/i;
            const objTypeRe = /\btype\s*:\s*["']([^"']+)["']/i;
            const textRe = /\btext\s*:\s*["']([^"'\n]{1,200})["']/i;
            const levelRe = /\blevel\s*:\s*["']([^"']+)["']/i; // иногда называют level

            for (const p of allPaths) {
                let content = '';
                try { content = await idx.readText(p); } catch { continue; }

                // эвристика AppMessages: собираем только случаи с literal text
                let m;
                while ((m = appMsgRe.exec(content)) !== null) {
                    const snippet = m[0] || '';
                    const textMatch = snippet.match(textRe);
                    if (!textMatch) continue;
                    const scopeMatch = snippet.match(scopeRe);
                    const typeMatch = snippet.match(objTypeRe);
                    const lvlMatch = snippet.match(levelRe);
                    const type = typeMatch ? typeMatch[1] : (lvlMatch ? lvlMatch[1] : 'info');
                    const scope = scopeMatch ? scopeMatch[1] : null;
                    const text = textMatch[1];
                    addMessage({ type, text: scope ? `[${scope}] ${text}` : text, file: p });
                }
            }

            const list = Array.from(messages.values()).map(m => ({
                type: m.type,
                text: m.text,
                files: Array.from(m.files).slice(0, 20)
            }));

            return { messages: list, generatedAt: nowIso() };
        });
    }

    // Публичный API
    return {
        getBasePathToRoot,
        getFileIndex,
        chooseFolder: chooseFolderWithPicker,
        getActiveFingerprint,
        runScannerWithCache,
        scanStats,
        scanIcons,
        scanColors,
        scanMessages,
        getConfig,
        setConfig
    };
})();

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

/**
 * Step 1 (Level 2 migration): подключение единого Vue-host системных сообщений на review-страницах.
 *
 * Цель шага: чтобы в review был доступен window.AppMessages и работал
 * <system-messages scope="review"> под вкладками.
 *
 * ВАЖНО: на этом шаге мы НЕ меняем существующий вывод сообщений в review (ReviewSystemMessages / старые алерты).
 */
async function initReviewVueSystemMessages() {
    const mount = document.getElementById('review-system-messages-vue');
    if (!mount) return;
    if (mount.dataset.mounted === '1') return;

    const base = (() => {
        const currentPath = window.location.pathname;
        if (currentPath.includes('/ui/assets/')) return '../../';
        if (currentPath.includes('/ui/styles/')) return '../../';
        if (currentPath.includes('/ui/interaction/')) return '../../';
        if (currentPath.includes('/ui/')) return '../';
        if (currentPath.includes('/docs/')) return '../';
        return '';
    })();

    function loadScriptOnce(src, isLoaded) {
        return new Promise((resolve, reject) => {
            try {
                if (isLoaded()) {
                    resolve();
                    return;
                }
                const existing = document.querySelector(`script[data-review-src="${src}"]`);
                if (existing) {
                    existing.addEventListener('load', () => resolve(), { once: true });
                    existing.addEventListener('error', () => reject(new Error(`Failed to load ${src}`)), { once: true });
                    return;
                }
                const s = document.createElement('script');
                s.src = src;
                s.async = true;
                s.dataset.reviewSrc = src;
                s.addEventListener('load', () => resolve(), { once: true });
                s.addEventListener('error', () => reject(new Error(`Failed to load ${src}`)), { once: true });
                document.head.appendChild(s);
            } catch (e) {
                reject(e);
            }
        });
    }

    // 1) Vue (global build with compiler)
    await loadScriptOnce('https://unpkg.com/vue@3.5.25/dist/vue.global.prod.js', () => typeof window.Vue !== 'undefined');
    // 2) Store
    await loadScriptOnce(`${base}ui/utils/messages-store.js`, () => typeof window.AppMessages !== 'undefined');
    // 3) Component
    await loadScriptOnce(`${base}ui/components/system-messages.js`, () => typeof window.cmpSystemMessages !== 'undefined');

    // Mount
    const { createApp } = window.Vue;
    const app = createApp({
        template: '<system-messages scope="review"></system-messages>'
    });
    app.component('system-messages', window.cmpSystemMessages);
    app.mount(mount);
    mount.dataset.mounted = '1';
}

// Инициализация при загрузке DOM
function initializeWhenReady() {
    async function initReviewHeaderAndVueMessages() {
        initReviewHeader();
        // Vue-host: нужен, чтобы window.AppMessages и <system-messages> работали в review-страницах.
        // Ничего не мигрируем на этом шаге — только инфраструктура.
        try {
            await initReviewVueSystemMessages();
        } catch (e) {
            // Не ломаем review-страницы при проблемах сети/скриптов — остаётся legacy DOM-рендер.
            console.warn('[review] Vue system messages not available:', e);
        }
    }

    if (document.body) {
        initReviewHeaderAndVueMessages();
    } else {
        // Если body еще не загружен, ждем
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', initReviewHeaderAndVueMessages);
        } else {
            // Если DOM уже загружен, но body еще нет, ждем немного
            setTimeout(initReviewHeaderAndVueMessages, 10);
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
        try {
            ReviewSystemMessages.post?.('stats.loading', { id: 'stats-loading' });

            const stats = await ReviewDataPipeline.scanStats();
            this.filesData = stats.files || [];
            this.codeStats = {
                totalLines: stats.totalLines || 0,
                totalFiles: stats.totalFiles || 0,
                files: stats.files || []
            };

            ReviewSystemMessages.post?.('stats.done', {
                id: 'stats-loading',
                details: `Файлов: ${this.codeStats.totalFiles}, строк кода: ${this.codeStats.totalLines.toLocaleString()}`
            });
        } catch (e) {
            ReviewSystemMessages.post?.('stats.error', {
                id: 'stats-loading',
                details: String(e?.message || e)
            });
            throw e;
        }
    },

    // Загрузка статистики иконок (через ReviewDataPipeline)
    async loadIconsStats() {
        try {
            const res = await ReviewDataPipeline.scanIcons();
            this.iconsStats = res?.stats || null;
        } catch (e) {
            console.warn('Не удалось собрать статистику иконок:', e);
            this.iconsStats = null;
        }
    },

    // Загрузка статистики цветов (через ReviewDataPipeline)
    async loadColorsStats() {
        try {
            const res = await ReviewDataPipeline.scanColors();
            this.colorsStats = res?.stats || null;
        } catch (e) {
            console.warn('Не удалось собрать статистику цветов:', e);
            this.colorsStats = null;
        }
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
        await this.loadIconsStats();
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
        ReviewSystemMessages,
        ReviewDataPipeline,
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

