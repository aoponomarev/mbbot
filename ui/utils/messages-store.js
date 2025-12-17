// =========================
// GLOBAL MESSAGE STORE (Level 2 migration - Step 0)
// Единое хранилище сообщений для всего приложения и review-страниц.
//
// Задача шага 0: добавить инфраструктуру, НЕ меняя существующие места вывода сообщений.
//
// Примечание:
// - Хранилище должно работать и вне Vue (для рантайм-кода/скриптов),
//   но при наличии Vue использует Vue.reactive для автоматического обновления UI.
// =========================

(function () {
  const hasVueReactive = typeof window.Vue !== 'undefined' && typeof window.Vue.reactive === 'function';

  const state = hasVueReactive
    ? window.Vue.reactive({ messages: [] })
    : { messages: [] };

  function normalizeType(type) {
    // Приводим к bootstrap-типам
    const t = String(type || 'info').toLowerCase();
    if (t === 'danger' || t === 'error') return 'danger';
    if (t === 'warn' || t === 'warning') return 'warning';
    if (t === 'success') return 'success';
    return 'info';
  }

  function normalizeScope(scope) {
    const s = String(scope || 'global').trim();
    return s || 'global';
  }

  function makeId() {
    return `msg_${Date.now()}_${Math.random().toString(16).slice(2)}`;
  }

  function emitChanged() {
    // Фоллбек для не-Vue страниц: можно слушать и ререндерить руками.
    try {
      document.dispatchEvent(new CustomEvent('app-messages:changed'));
    } catch {
      // Fallback для окружений без CustomEvent
      try {
        document.dispatchEvent(new Event('app-messages:changed'));
      } catch {
        // ignore
      }
    }
  }

  function upsert(msg) {
    const id = msg.id || makeId();
    const scope = normalizeScope(msg.scope);

    const normalized = {
      id,
      scope,
      type: normalizeType(msg.type),
      text: msg.text != null ? String(msg.text) : '',
      details: msg.details != null ? String(msg.details) : null,
      // actions: [{label, kind, onClick}] — функции не сериализуем
      actions: Array.isArray(msg.actions) ? msg.actions : [],
      createdAt: msg.createdAt || new Date().toISOString(),
      sticky: Boolean(msg.sticky)
    };

    const idx = state.messages.findIndex(m => m.id === id);
    if (idx >= 0) {
      state.messages.splice(idx, 1, normalized);
    } else {
      state.messages.push(normalized);
    }

    emitChanged();
    return normalized;
  }

  function dismiss(id) {
    const idx = state.messages.findIndex(m => m.id === id);
    if (idx >= 0) {
      state.messages.splice(idx, 1);
      emitChanged();
      return true;
    }
    return false;
  }

  function clear(scope) {
    const s = scope ? normalizeScope(scope) : null;
    if (!s) {
      state.messages.splice(0, state.messages.length);
      emitChanged();
      return;
    }
    const remaining = state.messages.filter(m => m.scope !== s);
    state.messages.splice(0, state.messages.length, ...remaining);
    emitChanged();
  }

  window.AppMessages = {
    state,
    // push/replace используют один и тот же upsert; различие семантическое
    push(msg) {
      return upsert(msg);
    },
    replace(id, msg) {
      return upsert({ ...msg, id });
    },
    dismiss,
    clear
  };
})();
