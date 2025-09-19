import { formatCurrency } from '../formatCurrency';
import { formatDate } from '../formatDate';
import { formatTime } from '../formatTime';
import { validateEmail } from '../validateEmail';
import { validatePhone } from '../validatePhone';
import { debounce } from '../debounce';
import { throttle } from '../throttle';
import { generateId } from '../generateId';
import { capitalize } from '../capitalize';
import { truncateText } from '../truncateText';

describe('formatCurrency', () => {
  it('should format currency correctly', () => {
    expect(formatCurrency(100)).toBe('100.00 ج.م');
    expect(formatCurrency(50.5)).toBe('50.50 ج.م');
    expect(formatCurrency(0)).toBe('0.00 ج.م');
  });

  it('should handle negative values', () => {
    expect(formatCurrency(-100)).toBe('-100.00 ج.م');
  });

  it('should handle large numbers', () => {
    expect(formatCurrency(1000000)).toBe('1,000,000.00 ج.م');
  });
});

describe('formatDate', () => {
  it('should format date correctly', () => {
    const date = new Date('2024-01-15T10:30:00Z');
    expect(formatDate(date)).toBe('15 يناير 2024');
  });

  it('should handle different date formats', () => {
    const date = new Date('2024-12-25T00:00:00Z');
    expect(formatDate(date)).toBe('25 ديسمبر 2024');
  });
});

describe('formatTime', () => {
  it('should format time correctly', () => {
    const date = new Date('2024-01-15T14:30:00Z');
    expect(formatTime(date)).toBe('2:30 م');
  });

  it('should handle AM time', () => {
    const date = new Date('2024-01-15T09:15:00Z');
    expect(formatTime(date)).toBe('9:15 ص');
  });

  it('should handle midnight', () => {
    const date = new Date('2024-01-15T00:00:00Z');
    expect(formatTime(date)).toBe('12:00 ص');
  });
});

describe('validateEmail', () => {
  it('should validate correct email addresses', () => {
    expect(validateEmail('test@example.com')).toBe(true);
    expect(validateEmail('user.name@domain.co.uk')).toBe(true);
    expect(validateEmail('test+tag@example.org')).toBe(true);
  });

  it('should reject invalid email addresses', () => {
    expect(validateEmail('invalid-email')).toBe(false);
    expect(validateEmail('test@')).toBe(false);
    expect(validateEmail('@example.com')).toBe(false);
    expect(validateEmail('test.example.com')).toBe(false);
  });
});

describe('validatePhone', () => {
  it('should validate Egyptian phone numbers', () => {
    expect(validatePhone('+201234567890')).toBe(true);
    expect(validatePhone('01234567890')).toBe(true);
    expect(validatePhone('+201012345678')).toBe(true);
  });

  it('should reject invalid phone numbers', () => {
    expect(validatePhone('123456789')).toBe(false);
    expect(validatePhone('+20123456789')).toBe(false);
    expect(validatePhone('0123456789')).toBe(false);
  });
});

describe('debounce', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('should debounce function calls', () => {
    const mockFn = jest.fn();
    const debouncedFn = debounce(mockFn, 100);

    debouncedFn();
    debouncedFn();
    debouncedFn();

    expect(mockFn).not.toHaveBeenCalled();

    jest.advanceTimersByTime(100);

    expect(mockFn).toHaveBeenCalledTimes(1);
  });

  it('should call function with correct arguments', () => {
    const mockFn = jest.fn();
    const debouncedFn = debounce(mockFn, 100);

    debouncedFn('arg1', 'arg2');

    jest.advanceTimersByTime(100);

    expect(mockFn).toHaveBeenCalledWith('arg1', 'arg2');
  });
});

describe('throttle', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('should throttle function calls', () => {
    const mockFn = jest.fn();
    const throttledFn = throttle(mockFn, 100);

    throttledFn();
    throttledFn();
    throttledFn();

    expect(mockFn).toHaveBeenCalledTimes(1);

    jest.advanceTimersByTime(100);

    throttledFn();
    expect(mockFn).toHaveBeenCalledTimes(2);
  });
});

describe('generateId', () => {
  it('should generate unique IDs', () => {
    const id1 = generateId();
    const id2 = generateId();

    expect(id1).toBeDefined();
    expect(id2).toBeDefined();
    expect(id1).not.toBe(id2);
  });

  it('should generate IDs with correct length', () => {
    const id = generateId();
    expect(id.length).toBe(8);
  });

  it('should generate alphanumeric IDs', () => {
    const id = generateId();
    expect(/^[a-zA-Z0-9]+$/.test(id)).toBe(true);
  });
});

describe('capitalize', () => {
  it('should capitalize first letter', () => {
    expect(capitalize('hello')).toBe('Hello');
    expect(capitalize('world')).toBe('World');
  });

  it('should handle empty strings', () => {
    expect(capitalize('')).toBe('');
  });

  it('should handle single character strings', () => {
    expect(capitalize('a')).toBe('A');
  });

  it('should handle already capitalized strings', () => {
    expect(capitalize('Hello')).toBe('Hello');
  });
});

describe('truncateText', () => {
  it('should truncate long text', () => {
    const longText = 'This is a very long text that should be truncated';
    expect(truncateText(longText, 20)).toBe('This is a very long...');
  });

  it('should not truncate short text', () => {
    const shortText = 'Short text';
    expect(truncateText(shortText, 20)).toBe('Short text');
  });

  it('should handle empty strings', () => {
    expect(truncateText('', 10)).toBe('');
  });

  it('should handle custom suffix', () => {
    const longText = 'This is a very long text';
    expect(truncateText(longText, 10, '...')).toBe('This is a...');
  });
});