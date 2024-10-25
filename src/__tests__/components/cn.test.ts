import { cn } from '../../components/cn';

describe('cn function', () => {
  it('should merge classes correctly', () => {
    const result = cn('text-small', 'text-medium');
    expect(result).toBe('text-medium');
  });

  it('should handle custom classes from NextUI', () => {
    const result = cn('text-small', 'text-default-500');
    expect(result).toBe('text-small text-default-500');
  });

  it('should override classes with higher specificity', () => {
    const result = cn('text-small', 'text-large', 'text-medium');
    expect(result).toBe('text-medium');
  });

  it('should merge multiple class groups', () => {
    const result = cn('shadow-small', 'font-size-tiny', 'bg-stripe-gradient');
    expect(result).toBe('shadow-small font-size-tiny bg-stripe-gradient');
  });

  it('should handle empty input gracefully', () => {
    const result = cn();
    expect(result).toBe('');
  });

  it('should handle undefined and null values', () => {
    const result = cn('text-small', undefined, null, 'text-large');
    expect(result).toBe('text-large');
  });
});
