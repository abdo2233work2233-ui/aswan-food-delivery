import { theme } from '../theme';
import { colors } from '../colors';
import { spacing } from '../spacing';
import { typography } from '../typography';
import { breakpoints } from '../breakpoints';
import { shadows } from '../shadows';
import { borderRadius } from '../borderRadius';
import { transitions } from '../transitions';
import { zIndex } from '../zIndex';

describe('Theme', () => {
  it('should have correct structure', () => {
    expect(theme).toBeDefined();
    expect(theme.colors).toBeDefined();
    expect(theme.spacing).toBeDefined();
    expect(theme.typography).toBeDefined();
    expect(theme.breakpoints).toBeDefined();
    expect(theme.shadows).toBeDefined();
    expect(theme.borderRadius).toBeDefined();
    expect(theme.transitions).toBeDefined();
    expect(theme.zIndex).toBeDefined();
  });
});

describe('Colors', () => {
  it('should have primary colors', () => {
    expect(colors.primary).toBeDefined();
    expect(colors.primary.main).toBeDefined();
    expect(colors.primary.light).toBeDefined();
    expect(colors.primary.dark).toBeDefined();
  });

  it('should have secondary colors', () => {
    expect(colors.secondary).toBeDefined();
    expect(colors.secondary.main).toBeDefined();
    expect(colors.secondary.light).toBeDefined();
    expect(colors.secondary.dark).toBeDefined();
  });

  it('should have neutral colors', () => {
    expect(colors.neutral).toBeDefined();
    expect(colors.neutral.white).toBeDefined();
    expect(colors.neutral.black).toBeDefined();
    expect(colors.neutral.gray).toBeDefined();
  });
});

describe('Spacing', () => {
  it('should have correct spacing values', () => {
    expect(spacing.xs).toBe('4px');
    expect(spacing.sm).toBe('8px');
    expect(spacing.md).toBe('16px');
    expect(spacing.lg).toBe('24px');
    expect(spacing.xl).toBe('32px');
    expect(spacing.xxl).toBe('48px');
  });
});

describe('Typography', () => {
  it('should have correct font families', () => {
    expect(typography.fontFamily.primary).toBeDefined();
    expect(typography.fontFamily.secondary).toBeDefined();
  });

  it('should have correct font sizes', () => {
    expect(typography.fontSize.xs).toBeDefined();
    expect(typography.fontSize.sm).toBeDefined();
    expect(typography.fontSize.md).toBeDefined();
    expect(typography.fontSize.lg).toBeDefined();
    expect(typography.fontSize.xl).toBeDefined();
  });
});

describe('Breakpoints', () => {
  it('should have correct breakpoint values', () => {
    expect(breakpoints.mobile).toBe('768px');
    expect(breakpoints.tablet).toBe('1024px');
    expect(breakpoints.desktop).toBe('1280px');
    expect(breakpoints.large).toBe('1536px');
  });
});

describe('Shadows', () => {
  it('should have correct shadow values', () => {
    expect(shadows.sm).toBeDefined();
    expect(shadows.md).toBeDefined();
    expect(shadows.lg).toBeDefined();
    expect(shadows.xl).toBeDefined();
  });
});

describe('Border Radius', () => {
  it('should have correct border radius values', () => {
    expect(borderRadius.sm).toBe('4px');
    expect(borderRadius.md).toBe('8px');
    expect(borderRadius.lg).toBe('12px');
    expect(borderRadius.xl).toBe('16px');
  });
});

describe('Transitions', () => {
  it('should have correct transition values', () => {
    expect(transitions.fast).toBe('150ms ease-in-out');
    expect(transitions.normal).toBe('300ms ease-in-out');
    expect(transitions.slow).toBe('500ms ease-in-out');
  });
});

describe('Z Index', () => {
  it('should have correct z-index values', () => {
    expect(zIndex.dropdown).toBe(1000);
    expect(zIndex.sticky).toBe(1020);
    expect(zIndex.fixed).toBe(1030);
    expect(zIndex.modal).toBe(1040);
    expect(zIndex.popover).toBe(1050);
    expect(zIndex.tooltip).toBe(1060);
  });
});