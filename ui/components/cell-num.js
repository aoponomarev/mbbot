// =========================
// КОМПОНЕНТ ЧИСЛОВОЙ ЯЧЕЙКИ ТАБЛИЦЫ
// Переиспользуемый компонент для форматирования и отображения числовых значений
// =========================
// Компонент обеспечивает гибкое форматирование чисел с поддержкой:
// - Различных типов чисел (integer, decimal, fraction)
// - Различных способов округления (precision, significant, step)
// - Разделителей (десятичный, разрядов)
// - Цветовых секторов
// - Префиксов и единиц измерения
// - Локализации
// - Tooltip с полным значением

window.cmpCellNum = {
  template: '#cell-num-template',
  
  props: {
    // Исходное число в десятичном формате
    value: {
      type: Number,
      default: 0
    },
    // Тип числа: целое / десятичная дробь / дробь со слешем
    type: {
      type: String,
      default: 'decimal',
      validator: (value) => ['integer', 'decimal', 'fraction'].includes(value)
    },
    // Способ округления: знаки/значимые/шаг
    rounding: {
      type: String,
      default: 'precision',
      validator: (value) => ['precision', 'significant', 'step'].includes(value)
    },
    // Знаки после запятой / значимых цифр (0-10)
    precision: {
      type: Number,
      default: 2,
      validator: (value) => value >= 0 && value <= 10
    },
    // Шаг округления (0.01, 0.05, 0.1, 0.5)
    roundingStep: {
      type: Number,
      default: 0.01
    },
    // Десятичный разделитель (для decimal)
    decimalSeparator: {
      type: String,
      default: ',',
      validator: (value) => [',', '.'].includes(value)
    },
    // Использовать слеш `/` вместо запятой (для fraction)
    fractionSlash: {
      type: Boolean,
      default: false
    },
    // Разделитель разрядов каждые 3 цифры
    thousandsSeparator: {
      type: String,
      default: ' ',
      validator: (value) => [' ', '&nbsp;', ',', ''].includes(value)
    },
    // Максимум цифр в целой части (с научной нотацией)
    maxDigits: {
      type: Number,
      default: 12
    },
    // Показывать знак: auto(+/- только при необходимости)/всегда/никогда
    signDisplay: {
      type: String,
      default: 'auto',
      validator: (value) => ['auto', 'always', 'never'].includes(value)
    },
    // Показывать знак для нуля (0 → +0 или −0)
    forceZeroSign: {
      type: Boolean,
      default: false
    },
    // Цветовые сектора: [[-∞,0,'red'], [0,∞,'green']]
    sectors: {
      type: Array,
      default: () => []
    },
    // CSS-класс по умолчанию (если нет сектора)
    defaultSectorClass: {
      type: String,
      default: ''
    },
    // Префикс: '$', '€', '%'
    prefix: {
      type: String,
      default: ''
    },
    // Единица измерения: '₽', 'kg', 'ms'
    unit: {
      type: String,
      default: ''
    },
    // Символы: {plus:['➕','+'], minus:['➖','−']}
    signSymbols: {
      type: Object,
      default: () => ({ plus: ['+'], minus: ['−'] })
    },
    // Отображение для NaN/null/undefined
    emptyValue: {
      type: String,
      default: '—'
    },
    // Отображение ±∞
    infinityDisplay: {
      type: String,
      default: '∞',
      validator: (value) => ['∞', '∞∞', 'N/A'].includes(value)
    },
    // Авто-разделители по локали
    locale: {
      type: String,
      default: 'auto',
      validator: (value) => ['ru', 'en', 'de', 'auto'].includes(value)
    },
    // Tooltip с полным значением
    showTooltip: {
      type: Boolean,
      default: false
    },
    // CSS-классы частей числа
    cssClasses: {
      type: Object,
      default: () => ({
        cell: '',
        prefix: '',
        sign: '',
        integer: '',
        separator: '',
        fraction: '',
        unit: ''
      })
    },
    // Уникальный идентификатор ячейки (для генерации детерминированного хэша)
    // Если не передан, хэш не генерируется
    cellId: {
      type: String,
      default: null
    },
    // Кастомный tooltip (title атрибут)
    // Если передан, используется вместо автоматического tooltip
    customTooltip: {
      type: String,
      default: null
    },
    // Включить автоматическую цветизацию на основе знака значения
    // При включении все дочерние <span> элементы получат цвет в зависимости от знака:
    // - positive: --color-success
    // - negative: --color-danger
    // - zero (|value| < 1): --color-muted
    colorize: {
      type: Boolean,
      default: false
    },
    // Округление до 0.5 (0.0, 0.5, 1.0, 1.5, 2.0, 2.5 и т.д.)
    // При включении автоматически использует rounding: 'step' с roundingStep: 0.5 и precision: 1
    roundToHalf: {
      type: Boolean,
      default: false
    }
  },
  
  computed: {
    // Детерминированный хэш экземпляра на основе cellId
    // Стабилен между сессиями - один и тот же cellId всегда дает один и тот же хэш
    // Если cellId не передан, возвращает null (хэш не добавляется)
    instanceHash() {
      if (!this.cellId) return null;
      if (!window.hashGenerator) {
        console.warn('hashGenerator not found, using fallback');
        return 'avto-00000000';
      }
      return window.hashGenerator.generateMarkupClass(this.cellId);
    },
    
    // Эффективный precision с учетом roundToHalf и больших чисел
    // При roundToHalf всегда используем precision: 1 (один знак после запятой)
    // Для чисел с абсолютным значением >= 10 округляем до целых (precision: 0)
    effectivePrecision() {
      // Если значение >= 10 по модулю, округляем до целых
      if (!this.isEmpty && !this.isInfinite) {
        const absValue = Math.abs(this.value);
        if (absValue >= 10) {
          return 0;
        }
      }
      
      if (this.roundToHalf) {
        return 1;
      }
      return this.precision;
    },
    // Проверка, является ли значение пустым или некорректным
    isEmpty() {
      return this.value === null || this.value === undefined || isNaN(this.value);
    },
    
    // Проверка, является ли значение бесконечностью
    isInfinite() {
      return !Number.isFinite(this.value);
    },
    
    // Округленное значение (для использования в других computed)
    roundedValue() {
      if (this.isEmpty || this.isInfinite) return this.value;
      return this.applyRounding(this.value);
    },
    
    // Префикс
    numberPrefix() {
      // Если есть обычный префикс через prop, используем его
      if (this.prefix) {
        return this.prefix;
      }
      
      // Если значение округлилось до 0, но изначально не было 0, добавляем префикс "~"
      if (!this.isEmpty && !this.isInfinite) {
        const rounded = this.roundedValue;
        const original = this.value;
        
        // Проверяем, что округленное значение равно 0 (или очень близко к 0)
        // И исходное значение не было 0 (чтобы не показывать "~" для настоящего нуля)
        if (Math.abs(rounded) < 0.01 && Math.abs(original) >= 0.01) {
          return '~';
        }
      }
      
      return '';
    },
    
    // Текст для всплывающей подсказки (tooltip)
    tooltipText() {
      // Если передан кастомный tooltip - используем его
      if (this.customTooltip) {
        return this.customTooltip;
      }
      
      // Если значение округлилось до 0, но изначально не было 0, показываем точное значение
      if (!this.isEmpty && !this.isInfinite) {
        const rounded = this.roundedValue;
        const original = this.value;
        
        // Проверяем, что округленное значение равно 0 (или очень близко к 0)
        // И исходное значение не было 0 (чтобы не показывать tooltip для настоящего нуля)
        if (Math.abs(rounded) < 0.01 && Math.abs(original) >= 0.01) {
          return original.toString();
        }
      }
      
      // В остальных случаях, если showTooltip включен, показываем значение
      if (this.showTooltip) {
        return this.value;
      }
      
      return null;
    },
    
    // Знак числа
    numberSign() {
      if (this.isEmpty || this.isInfinite) return '';
      if (this.signDisplay === 'never') return '';
      
      const value = this.roundedValue;
      const isPositive = value > 0;
      const isZero = value === 0;
      const isNegative = value < 0;
      
      // Определяем, нужно ли показывать знак
      let shouldShowSign = false;
      if (this.signDisplay === 'always') {
        shouldShowSign = true;
      } else if (this.signDisplay === 'auto') {
        shouldShowSign = isPositive || (isZero && this.forceZeroSign);
      }
      
      if (shouldShowSign && (isPositive || (isZero && this.forceZeroSign))) {
        return this.signSymbols.plus && this.signSymbols.plus.length > 0 
          ? this.signSymbols.plus[0] 
          : '+';
      }
      
      if (isNegative) {
        return this.signSymbols.minus && this.signSymbols.minus.length > 0 
          ? this.signSymbols.minus[0] 
          : '−';
      }
      
      return '';
    },
    
    // Целая часть числа (с разделителями разрядов)
    integerPart() {
      if (this.isEmpty || this.isInfinite) return '';
      
      const value = this.roundedValue;
      let intPart;
      
      if (this.type === 'integer') {
        intPart = Math.round(Math.abs(value));
      } else {
        intPart = Math.floor(Math.abs(value));
      }
      
      return this.addThousandsSeparator(intPart.toString());
    },
    
    // Десятичный разделитель
    decimalSeparatorDisplay() {
      if (this.isEmpty || this.isInfinite) return '';
      if (this.type === 'integer') return '';
      if (!this.hasFractionPart) return '';
      
      // Для fraction со слешем
      if (this.type === 'fraction' && this.fractionSlash) {
        return '/';
      }
      
      // Для decimal и fraction без слеша - используем decimalSeparator
      if (this.type === 'decimal' || (this.type === 'fraction' && !this.fractionSlash)) {
        return this.decimalSeparator;
      }
      
      return '';
    },
    
    // Есть ли дробная часть
    hasFractionPart() {
      if (this.isEmpty || this.isInfinite) return false;
      if (this.type === 'integer') return false;
      if (this.effectivePrecision <= 0) return false;
      
      const value = this.roundedValue;
      const absValue = Math.abs(value);
      const fracPart = absValue - Math.floor(absValue);
      
      // Для roundToHalf проверяем, есть ли дробная часть (0.5)
      if (this.roundToHalf) {
        return fracPart > 0.01; // Учитываем погрешность округления
      }
      
      // Проверяем, есть ли значащие цифры в дробной части
      const fracStr = fracPart.toFixed(this.effectivePrecision);
      const fracDigits = fracStr.substring(2);
      
      if (this.rounding === 'precision' || this.roundToHalf) {
        // Для precision показываем если precision > 0
        return this.effectivePrecision > 0;
      }
      
      // Для других типов округления - если есть ненулевые цифры
      return fracDigits.replace(/0+$/, '').length > 0;
    },
    
    // Дробная часть
    fractionPart() {
      if (this.isEmpty || this.isInfinite) return '';
      if (this.type === 'integer') return '';
      if (!this.hasFractionPart) return '';
      
      const value = this.roundedValue;
      const absValue = Math.abs(value);
      const fracPart = absValue - Math.floor(absValue);
      
      // Для roundToHalf всегда показываем один знак (0 или 5)
      if (this.roundToHalf) {
        const fracStr = fracPart.toFixed(this.effectivePrecision);
        const fracDigits = fracStr.substring(2);
        return fracDigits; // Всегда один знак: "0" или "5"
      }
      
      const fracStr = fracPart.toFixed(this.effectivePrecision);
      const fracDigits = fracStr.substring(2);
      
      // Убираем лишние нули в конце только если precision позволяет
      let trimmedFrac = fracDigits;
      if (this.rounding === 'precision') {
        // Для precision оставляем точное количество знаков, но убираем лишние нули
        trimmedFrac = fracDigits.replace(/0+$/, '');
      }
      
      // Если после удаления нулей ничего не осталось, но precision требует знаки
      if (trimmedFrac.length === 0 && this.effectivePrecision > 0 && (this.rounding === 'precision' || this.roundToHalf)) {
        return fracDigits;
      }
      
      return trimmedFrac;
    },
    
    // Единицы измерения
    numberUnit() {
      return this.unit || '';
    },
    
    // Отображение для пустых значений или бесконечности
    emptyOrInfiniteDisplay() {
      if (this.isEmpty) {
        return this.emptyValue;
      }
      
      if (this.isInfinite) {
        if (this.value === Infinity) {
          return this.infinityDisplay;
        }
        if (this.value === -Infinity) {
          return `−${this.infinityDisplay}`;
        }
        return this.emptyValue;
      }
      
      return null; // Обычное число, не пустое и не бесконечное
    },
    
    // Базовое форматирование числа (для обратной совместимости)
    formattedValue() {
      const empty = this.emptyOrInfiniteDisplay;
      if (empty !== null) return empty;
      
      // Собираем из частей для обратной совместимости
      let result = '';
      if (this.numberPrefix) result += this.numberPrefix;
      if (this.numberSign) result += this.numberSign;
      if (this.integerPart) result += this.integerPart;
      if (this.decimalSeparatorDisplay) result += this.decimalSeparatorDisplay;
      if (this.fractionPart) result += this.fractionPart;
      if (this.numberUnit) result += this.numberUnit;
      
      return result;
    },
    
    // CSS класс для ячейки на основе секторов
    cellClass() {
      // Если значение пустое - не применяем сектора
      if (this.value === null || this.value === undefined || isNaN(this.value) || !Number.isFinite(this.value)) {
        return this.defaultSectorClass || '';
      }
      
      if (!this.sectors || this.sectors.length === 0) {
        return this.defaultSectorClass || '';
      }
      
      // Находим подходящий сектор для значения
      for (const sector of this.sectors) {
        if (sector.range && Array.isArray(sector.range) && sector.range.length === 2) {
          const [min, max] = sector.range;
          // Обработка бесконечности в диапазонах
          const value = this.value;
          const minCheck = min === -Infinity || value >= min;
          const maxCheck = max === Infinity || value <= max;
          
          if (minCheck && maxCheck) {
            return sector.cssClass || '';
          }
        }
      }
      
      return this.defaultSectorClass || '';
    },
    
    // CSS классы для частей числа с наследованием от Bootstrap
    // Префикс: базовый класс Bootstrap + кастомный
    prefixClass() {
      const base = 'text-muted'; // Bootstrap класс для приглушенного текста
      const custom = this.cssClasses?.prefix || '';
      return `${base} ${custom}`.trim();
    },
    
    // Знак: наследует цвет от сектора + кастомный класс
    signClass() {
      // Знак наследует цвет от сектора (text-danger, text-success и т.д.)
      const sectorClass = this.cellClass || '';
      const custom = this.cssClasses?.sign || '';
      return `${sectorClass} ${custom}`.trim();
    },
    
    // Целая часть: наследует цвет от сектора + кастомный класс
    integerClass() {
      // Целая часть наследует цвет от сектора (text-danger, text-success и т.д.)
      const sectorClass = this.cellClass || '';
      const custom = this.cssClasses?.integer || '';
      
      // Добавляем жирный шрифт для положительных чисел с целой частью >= 1 при включенной цветизации
      let boldClass = '';
      if (this.colorize && !this.isEmpty && !this.isInfinite) {
        const value = this.roundedValue;
        const absValue = Math.abs(value);
        const intPart = Math.floor(absValue);
        
        // Если значение положительное и целая часть >= 1
        if (value > 0 && intPart >= 1) {
          boldClass = 'fw-bold'; // Bootstrap класс для жирного текста
        }
      }
      
      return `${sectorClass} ${custom} ${boldClass}`.trim();
    },
    
    // Разделитель: приглушенный Bootstrap класс
    separatorClass() {
      const base = 'text-muted'; // Bootstrap класс для приглушенного текста
      const custom = this.cssClasses?.separator || '';
      return `${base} ${custom}`.trim();
    },
    
    // Дробная часть: наследует цвет от сектора + кастомный класс
    fractionClass() {
      // Дробная часть наследует цвет от сектора (text-danger, text-success и т.д.)
      const sectorClass = this.cellClass || '';
      const custom = this.cssClasses?.fraction || '';
      return `${sectorClass} ${custom}`.trim();
    },
    
    // Единицы измерения: приглушенный Bootstrap класс
    unitClass() {
      const base = 'text-muted small'; // Bootstrap классы для приглушенного и меньшего текста
      const custom = this.cssClasses?.unit || '';
      return `${base} ${custom}`.trim();
    },
    
    // Класс для цветизации (применяется к корневому элементу)
    // Определяет знак значения и применяет соответствующий класс
    colorizeClass() {
      if (!this.colorize) return '';
      
      // Определяем знак значения
      if (this.isEmpty || this.isInfinite) return '';
      
      const value = this.roundedValue;
      const absValue = Math.abs(value);
      
      // Если значение близко к нулю (< 1), используем muted
      if (absValue < 1) {
        return 'num-coin-colorize';
      }
      
      // Иначе используем класс в зависимости от знака
      return 'num-coin-colorize';
    },
    
    // Data-атрибут для определения знака значения (для CSS селекторов)
    colorizeDataAttr() {
      if (!this.colorize) return null;
      
      // Определяем знак значения
      if (this.isEmpty || this.isInfinite) return null;
      
      const value = this.roundedValue;
      const absValue = Math.abs(value);
      
      // Если значение близко к нулю (< 1), используем 'zero'
      if (absValue < 1) {
        return 'zero';
      }
      
      // Иначе определяем по знаку
      if (value > 0) {
        return 'positive';
      } else if (value < 0) {
        return 'negative';
      } else {
        return 'zero';
      }
    }
  },
  
  methods: {
    // Применение округления в зависимости от типа
    applyRounding(value) {
      // Приоритет: roundToHalf переопределяет обычное округление
      if (this.roundToHalf) {
        // Округление до 0.5 (0.0, 0.5, 1.0, 1.5, 2.0, 2.5 и т.д.)
        // Умножаем на 2, округляем, делим на 2
        return Math.round(value * 2) / 2;
      }
      
      if (this.rounding === 'precision') {
        // Округление до N знаков после запятой
        const factor = Math.pow(10, this.precision);
        return Math.round(value * factor) / factor;
      } else if (this.rounding === 'significant') {
        // Округление до N значащих цифр
        if (value === 0) return 0;
        const magnitude = Math.floor(Math.log10(Math.abs(value)));
        const factor = Math.pow(10, this.precision - 1 - magnitude);
        return Math.round(value * factor) / factor;
      } else if (this.rounding === 'step') {
        // Округление до шага
        return Math.round(value / this.roundingStep) * this.roundingStep;
      }
      return value;
    },
    
    // Форматирование целого числа
    formatInteger(value) {
      const intValue = Math.round(value);
      return this.addThousandsSeparator(Math.abs(intValue).toString());
    },
    
    // Форматирование десятичной дроби
    formatDecimal(value) {
      // Разделяем на целую и дробную части
      const absValue = Math.abs(value);
      const intPart = Math.floor(absValue);
      const fracPart = absValue - intPart;
      
      // Форматируем целую часть с разделителями разрядов
      let formatted = this.addThousandsSeparator(intPart.toString());
      
      // Добавляем дробную часть
      if (this.effectivePrecision > 0) {
        // Используем toFixed для получения нужного количества знаков
        const fracStr = fracPart.toFixed(this.effectivePrecision);
        const fracDigits = fracStr.substring(2); // Убираем "0."
        
        // Убираем лишние нули в конце только если precision позволяет
        let trimmedFrac = fracDigits;
        if (this.rounding === 'precision' || this.roundToHalf) {
          // Для precision и roundToHalf оставляем точное количество знаков, но убираем лишние нули
          trimmedFrac = fracDigits.replace(/0+$/, '');
        }
        
        // Добавляем дробную часть, если она есть
        if (trimmedFrac.length > 0) {
          formatted += this.decimalSeparator + trimmedFrac;
        } else if (this.effectivePrecision > 0 && (this.rounding === 'precision' || this.roundToHalf)) {
          // Если precision требует знаки, но они все нули, добавляем их
          formatted += this.decimalSeparator + fracDigits;
        }
      }
      
      return formatted;
    },
    
    // Форматирование дроби со слешем (пока упрощенное, будет расширено)
    formatFraction(value) {
      // Для fraction пока используем decimal формат, но с слешем вместо запятой
      const decimal = this.formatDecimal(value);
      if (this.fractionSlash) {
        return decimal.replace(this.decimalSeparator, '/');
      }
      return decimal;
    },
    
    // Добавление разделителя разрядов (каждые 3 цифры)
    addThousandsSeparator(str) {
      if (!this.thousandsSeparator || this.thousandsSeparator === '') {
        return str;
      }
      
      // Разбиваем строку на группы по 3 цифры справа налево
      const parts = [];
      for (let i = str.length; i > 0; i -= 3) {
        parts.unshift(str.substring(Math.max(0, i - 3), i));
      }
      
      const separator = this.thousandsSeparator === '&nbsp;' ? '\u00A0' : this.thousandsSeparator;
      return parts.join(separator);
    },
    
    // Добавление знака к числу
    addSign(formatted, value) {
      if (this.signDisplay === 'never') {
        return formatted;
      }
      
      const isPositive = value > 0;
      const isZero = value === 0;
      const isNegative = value < 0;
      
      // Определяем, нужно ли показывать знак
      let shouldShowSign = false;
      if (this.signDisplay === 'always') {
        shouldShowSign = true;
      } else if (this.signDisplay === 'auto') {
        shouldShowSign = isPositive || (isZero && this.forceZeroSign);
      }
      
      if (shouldShowSign) {
        if (isPositive || (isZero && this.forceZeroSign)) {
          const plusSymbol = this.signSymbols.plus && this.signSymbols.plus.length > 0 
            ? this.signSymbols.plus[0] 
            : '+';
          return plusSymbol + formatted;
        }
      }
      
      if (isNegative) {
        const minusSymbol = this.signSymbols.minus && this.signSymbols.minus.length > 0 
          ? this.signSymbols.minus[0] 
          : '−';
        return minusSymbol + formatted;
      }
      
      return formatted;
    },
    
    // Добавление префикса и единицы измерения
    addPrefixAndUnit(formatted) {
      let result = formatted;
      
      if (this.prefix) {
        result = this.prefix + result;
      }
      
      if (this.unit) {
        result = result + this.unit;
      }
      
      return result;
    }
  }
};

