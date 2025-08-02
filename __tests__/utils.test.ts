import { cn } from '../lib/utils';

describe('Utility Functions', () => {
  describe('cn (className utility)', () => {
    it('should merge class names correctly', () => {
      const result = cn('base-class', 'additional-class');
      expect(result).toContain('base-class');
      expect(result).toContain('additional-class');
    });

    it('should handle conditional classes', () => {
      const isActive = true;
      const result = cn('base-class', isActive && 'active-class');
      expect(result).toContain('base-class');
      expect(result).toContain('active-class');
    });

    it('should handle falsy values', () => {
      const result = cn('base-class', false && 'hidden-class', null, undefined);
      expect(result).toContain('base-class');
      expect(result).not.toContain('hidden-class');
    });

    it('should merge conflicting Tailwind classes correctly', () => {
      const result = cn('p-4', 'p-6');
      // The last class should take precedence
      expect(result).toContain('p-6');
      expect(result).not.toContain('p-4');
    });
  });
});
