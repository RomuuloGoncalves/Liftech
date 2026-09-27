import { renderHook, act } from '@testing-library/react';
import { useLanguage } from '../../hooks/useLanguage';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { VALID_LANGUAGES } from '../../types/i18n';

const changeLanguageMock = vi.fn();

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    i18n: {
      language: 'pt-BR',
      changeLanguage: changeLanguageMock,
    },
  }),
}));

describe('useLanguage', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it('returns current language, languages list, and changeLanguage function', () => {
    const { result } = renderHook(() => useLanguage());
    expect(result.current.language).toBe('pt-BR');
    expect(typeof result.current.changeLanguage).toBe('function');
    expect(result.current.languages).toHaveLength(VALID_LANGUAGES.length);
  });

  it('changeLanguage updates i18n language and localStorage', () => {
    const { result } = renderHook(() => useLanguage());
    
    act(() => {
      result.current.changeLanguage('en-US');
    });

    expect(changeLanguageMock).toHaveBeenCalledWith('en-US');
    expect(localStorage.getItem('liftech-lang')).toBe('en-US');
  });

  it('changeLanguage ignores invalid languages', () => {
    const { result } = renderHook(() => useLanguage());

    act(() => {
      result.current.changeLanguage('zz');
    });

    expect(changeLanguageMock).not.toHaveBeenCalled();
    expect(localStorage.getItem('liftech-lang')).toBeNull();
  });

  it('languages list contains correct format', () => {
    const { result } = renderHook(() => useLanguage());
    const firstLang = result.current.languages[0];
    
    expect(firstLang).toHaveProperty('code');
    expect(firstLang).toHaveProperty('label');
    expect(firstLang).toHaveProperty('nativeLabel');
    expect(firstLang).toHaveProperty('flag');
  });
});
