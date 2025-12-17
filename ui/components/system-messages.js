// =========================
// SYSTEM MESSAGES HOST (Vue component) (Level 2 migration - Step 0)
// Единый Vue-компонент для показа сообщений из window.AppMessages.
//
// ВАЖНО (шаг 0): компонент добавляется как инфраструктура,
// но существующие места отображения сообщений пока не мигрируем.
// =========================

window.cmpSystemMessages = {
  props: {
    // scope: 'global' | 'splash' | 'settings' | 'coins' | 'review' ...
    scope: {
      type: String,
      default: 'global'
    },
    // Показать также сообщения без scope (устаревшие), если попадутся
    includeUnscoped: {
      type: Boolean,
      default: true
    },
    // Ограничение по количеству сообщений (0 = без ограничения)
    limit: {
      type: Number,
      default: 0
    }
  },

  data() {
    return {
      // Фоллбек на случай, если store был создан до загрузки Vue и не реактивен:
      // будем "пинать" ререндер через событие app-messages:changed.
      _appMessagesTick: 0,
      _onAppMessagesChanged: null
    };
  },

  mounted() {
    this._onAppMessagesChanged = () => {
      this._appMessagesTick++;
    };
    document.addEventListener('app-messages:changed', this._onAppMessagesChanged);
  },

  beforeUnmount() {
    if (this._onAppMessagesChanged) {
      document.removeEventListener('app-messages:changed', this._onAppMessagesChanged);
    }
  },

  computed: {
    store() {
      return window.AppMessages || null;
    },
    allMessages() {
      // зависимость для форс-обновления при не реактивном store
      const _tick = this._appMessagesTick;
      void _tick;
      return this.store?.state?.messages || [];
    },
    visibleMessages() {
      // ВАЖНО: этот computed используется прямо в template (v-if / v-for),
      // поэтому делаем явную зависимость от tick, чтобы Vue точно перерендерил.
      const _tick = this._appMessagesTick;
      void _tick;
      const s = String(this.scope || 'global');
      let list = this.allMessages.filter(m => {
        if (!m) return false;
        if (m.scope === s) return true;
        if (this.includeUnscoped && (!m.scope || m.scope === '')) return true;
        return false;
      });

      if (this.limit > 0) {
        list = list.slice(-this.limit);
      }
      return list;
    }
  },

  methods: {
    dismiss(msg) {
      if (!msg?.id) return;
      this.store?.dismiss?.(msg.id);
    },
    handleAction(action, msg) {
      if (!action) return;
      try {
        if (typeof action.onClick === 'function') {
          action.onClick(msg);
        }
      } catch (e) {
        console.error(e);
      }
    }
  },

  template: `
    <div class="system-messages-host d-flex flex-column gap-2" v-if="visibleMessages.length">
      <div v-for="m in visibleMessages" :key="m.id" class="alert-message-wrapper">
        <div class="alert-close-button-wrapper">
          <button
            type="button"
            class="btn btn-link btn-close-custom"
            aria-label="Закрыть"
            @click="dismiss(m)"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M2 2 L14 14 M14 2 L2 14"
                    stroke="currentColor"
                    stroke-width="0.25"
                    stroke-linecap="round"
                    fill="none"/>
            </svg>
          </button>
        </div>

        <div class="alert" :class="'alert-' + (m.type || 'info')" role="alert">
          <div>{{ m.text }}</div>
          <div v-if="m.details" class="small" style="opacity:0.85; margin-top:0.25rem;">{{ m.details }}</div>

          <div v-if="m.actions && m.actions.length" class="mt-2 d-flex gap-2 flex-wrap">
            <button
              v-for="(a, idx) in m.actions"
              :key="idx"
              type="button"
              class="btn btn-sm"
              :class="a.kind === 'primary' ? 'btn-primary' : (a.kind === 'outline' ? 'btn-outline-secondary' : 'btn-secondary')"
              @click="handleAction(a, m)"
            >{{ a.label }}</button>
          </div>
        </div>
      </div>
    </div>
  `
};
