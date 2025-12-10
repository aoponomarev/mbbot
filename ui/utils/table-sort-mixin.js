// Глобальный Vue mixin для сортировки таблиц
// Циклическая сортировка: null (дефолт) → asc (возрастание) → desc (убывание) → null
window.tableSortMixin = {
  data() {
    return {
      sortBy: null,      // Текущее поле сортировки
      sortOrder: null    // null | 'asc' | 'desc'
    };
  },
  
  methods: {
    // Обработка клика на заголовок колонки для сортировки
    handleSort(field) {
      if (this.sortBy === field) {
        // Циклическое переключение: null → asc → desc → null
        if (this.sortOrder === null) {
          this.sortOrder = 'asc';
        } else if (this.sortOrder === 'asc') {
          this.sortOrder = 'desc';
        } else {
          this.sortOrder = null;
          this.sortBy = null;
        }
      } else {
        // Новое поле - начинаем с возрастания
        this.sortBy = field;
        this.sortOrder = 'asc';
      }
    },
    
    // Сортировка массива данных
    sortData(data, defaultOrder = null) {
      if (!this.sortBy || !this.sortOrder) {
        // Если сортировка сброшена - возвращаем в дефолтном порядке
        return defaultOrder ? defaultOrder.slice() : data.slice();
      }
      
      const sorted = data.slice(); // Копируем массив
      sorted.sort((a, b) => {
        let aVal = this.getSortValue(a, this.sortBy);
        let bVal = this.getSortValue(b, this.sortBy);
        
        // Обработка null/undefined
        if (aVal == null && bVal == null) return 0;
        if (aVal == null) return 1;
        if (bVal == null) return -1;
        
        // Сравнение
        let result = 0;
        if (typeof aVal === 'string') {
          result = aVal.localeCompare(bVal);
        } else {
          result = aVal - bVal;
        }
        
        return this.sortOrder === 'asc' ? result : -result;
      });
      
      return sorted;
    },
    
    // Получение значения для сортировки (можно переопределить в компоненте)
    getSortValue(item, field) {
      // Поддержка вложенных полей через точку (например: 'coin.price')
      const fields = field.split('.');
      let value = item;
      for (const f of fields) {
        value = value?.[f];
      }
      return value;
    },
    
    // Получение иконки для заголовка колонки
    getSortIcon(field) {
      if (this.sortBy !== field || !this.sortOrder) {
        return 'fas fa-sort'; // Нейтральная иконка
      }
      return this.sortOrder === 'asc' ? 'fas fa-sort-up' : 'fas fa-sort-down';
    }
  }
};

