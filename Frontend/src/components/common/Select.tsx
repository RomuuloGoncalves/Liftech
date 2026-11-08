import React, {
  useState,
  useRef,
  useEffect,
  useLayoutEffect,
  useId,
  forwardRef,
  useImperativeHandle,
} from 'react';
import { ChevronDown } from 'lucide-react';
import styles from './Select.module.css';

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface SelectProps {
  id?: string;
  value: string;
  options: SelectOption[];
  onChange: (value: string) => void;
  disabled?: boolean;
  className?: string;
  buttonClassName?: string;
  ariaLabel?: string;
  ariaLabelledby?: string;
  placeholder?: string;
  name?: string;
  icon?: React.ReactNode;
}

export const Select = forwardRef<HTMLButtonElement, SelectProps>(function Select(
  {
    id,
    value,
    options,
    onChange,
    disabled = false,
    className,
    buttonClassName,
    ariaLabel,
    ariaLabelledby,
    placeholder,
    name,
    icon,
  },
  forwardedRef
) {
  const generatedId = useId();
  const selectId = id || generatedId;
  const listboxId = `${selectId}-listbox`;

  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [placement, setPlacement] = useState<'bottom' | 'top'>('bottom');

  const containerRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const listboxRef = useRef<HTMLUListElement>(null);
  const optionRefs = useRef<(HTMLLIElement | null)[]>([]);

  useImperativeHandle(forwardedRef, () => buttonRef.current as HTMLButtonElement);

  const selectedOption = options.find((opt) => opt.value === value);

  const updatePlacement = () => {
    if (!buttonRef.current) return;
    const rect = buttonRef.current.getBoundingClientRect();
    const viewportHeight = window.innerHeight || document.documentElement.clientHeight;
    const spaceBelow = viewportHeight - rect.bottom;
    const spaceAbove = rect.top;
    if (spaceBelow < 220 && spaceAbove > spaceBelow) {
      setPlacement('top');
    } else {
      setPlacement('bottom');
    }
  };

  const useIsomorphicLayoutEffect =
    typeof window !== 'undefined' ? useLayoutEffect : useEffect;

  useIsomorphicLayoutEffect(() => {
    if (isOpen) {
      updatePlacement();
    }
  }, [isOpen]);

  useEffect(() => {
    const btn = buttonRef.current;
    if (!btn) return;
    const handleNativeChange = (e: Event) => {
      const target = e.target as HTMLButtonElement;
      if (target && target.value !== undefined) {
        onChange(target.value);
      }
    };
    btn.addEventListener('change', handleNativeChange);
    return () => {
      btn.removeEventListener('change', handleNativeChange);
    };
  }, [onChange]);

  useEffect(() => {
    if (!isOpen) return;

    const handlePointerDown = (event: MouseEvent | TouchEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
        buttonRef.current?.focus();
      }
    };

    const handleWindowKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        setIsOpen(false);
        buttonRef.current?.focus();
      }
    };

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('touchstart', handlePointerDown);
    window.addEventListener('keydown', handleWindowKeyDown);

    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('touchstart', handlePointerDown);
      window.removeEventListener('keydown', handleWindowKeyDown);
    };
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && highlightedIndex >= 0 && optionRefs.current[highlightedIndex]) {
      optionRefs.current[highlightedIndex]?.scrollIntoView?.({
        block: 'nearest',
      });
    }
  }, [isOpen, highlightedIndex]);

  const openList = (initialIndex?: number) => {
    if (disabled) return;
    buttonRef.current?.focus();
    let idx = initialIndex;
    if (idx === undefined) {
      const selectedIdx = options.findIndex((opt) => opt.value === value);
      idx = selectedIdx >= 0 && !options[selectedIdx].disabled
        ? selectedIdx
        : options.findIndex((opt) => !opt.disabled);
    }
    setHighlightedIndex(idx);
    setIsOpen(true);
  };

  const closeList = (restoreFocus = true) => {
    setIsOpen(false);
    if (restoreFocus) {
      buttonRef.current?.focus();
    }
  };

  const selectOption = (opt: SelectOption) => {
    if (opt.disabled) return;
    onChange(opt.value);
    closeList(true);
  };

  const handleButtonClick = () => {
    if (disabled) return;
    buttonRef.current?.focus();
    if (isOpen) {
      closeList(false);
    } else {
      openList();
    }
  };

  const getNextEnabledIndex = (currentIndex: number, step: 1 | -1) => {
    let next = currentIndex + step;
    while (next >= 0 && next < options.length) {
      if (!options[next].disabled) return next;
      next += step;
    }
    return currentIndex;
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>) => {
    if (disabled) return;

    if (!isOpen) {
      if (e.key === 'ArrowDown' || e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        openList();
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        const selectedIdx = options.findIndex((opt) => opt.value === value);
        const lastEnabled = [...options].reverse().findIndex((opt) => !opt.disabled);
        const lastIdx = lastEnabled !== -1 ? options.length - 1 - lastEnabled : 0;
        openList(selectedIdx >= 0 && !options[selectedIdx].disabled ? selectedIdx : lastIdx);
      }
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex((prev) => getNextEnabledIndex(prev, 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex((prev) => getNextEnabledIndex(prev, -1));
    } else if (e.key === 'Home') {
      e.preventDefault();
      const first = options.findIndex((opt) => !opt.disabled);
      if (first !== -1) setHighlightedIndex(first);
    } else if (e.key === 'End') {
      e.preventDefault();
      const last = [...options].reverse().findIndex((opt) => !opt.disabled);
      if (last !== -1) setHighlightedIndex(options.length - 1 - last);
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      if (highlightedIndex >= 0 && highlightedIndex < options.length) {
        selectOption(options[highlightedIndex]);
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      closeList(true);
    } else if (e.key === 'Tab') {
      closeList(false);
    } else if (e.key.length === 1 && !e.ctrlKey && !e.altKey && !e.metaKey) {
      const char = e.key.toLowerCase();
      const matchIndex = options.findIndex(
        (opt) => !opt.disabled && opt.label.trim().toLowerCase().startsWith(char)
      );
      if (matchIndex !== -1) {
        e.preventDefault();
        setHighlightedIndex(matchIndex);
      }
    }
  };

  return (
    <div
      ref={containerRef}
      className={`${styles.container} ${className ?? ''}`}
    >
      <button
        ref={buttonRef}
        id={id}
        name={name}
        type="button"
        role="combobox"
        value={value}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-controls={listboxId}
        aria-label={ariaLabel}
        aria-labelledby={ariaLabelledby}
        aria-activedescendant={
          isOpen && highlightedIndex >= 0
            ? `${listboxId}-opt-${highlightedIndex}`
            : undefined
        }
        aria-disabled={disabled}
        disabled={disabled}
        className={`${styles.button} ${buttonClassName ?? ''} ${
          disabled ? styles.buttonDisabled : ''
        }`}
        onClick={handleButtonClick}
        onKeyDown={handleKeyDown}
        onChange={(e) => {
          const target = e.target as HTMLButtonElement | HTMLInputElement;
          if (target && target.value !== undefined) {
            onChange(target.value);
          }
        }}
      >
        <span className={styles.labelWrapper}>
          {icon && <span className={styles.icon}>{icon}</span>}
          <span className={styles.selectedText}>
            {selectedOption ? selectedOption.label : (placeholder ?? '')}
          </span>
        </span>
        <ChevronDown
          size={16}
          className={`${styles.chevron} ${isOpen ? styles.chevronOpen : ''}`}
          aria-hidden="true"
        />
      </button>

      {isOpen && (
        <ul
          ref={listboxRef}
          id={listboxId}
          role="listbox"
          aria-label={ariaLabel}
          aria-labelledby={ariaLabelledby}
          tabIndex={-1}
          className={`${styles.listbox} ${
            placement === 'top' ? styles.placementTop : styles.placementBottom
          }`}
        >
          {options.map((option, index) => {
            const isSelected = option.value === value;
            const isHighlighted = index === highlightedIndex;
            return (
              <li
                key={option.value || `opt-${index}`}
                ref={(el) => {
                  optionRefs.current[index] = el;
                  if (el) {
                    el.setAttribute('value', option.value);
                  }
                }}
                id={`${listboxId}-opt-${index}`}
                role="option"
                aria-selected={isSelected}
                aria-disabled={option.disabled}
                className={`${styles.option} ${
                  isHighlighted ? styles.optionHighlighted : ''
                } ${isSelected ? styles.optionSelected : ''} ${
                  option.disabled ? styles.optionDisabled : ''
                }`}
                onMouseEnter={() => {
                  if (!option.disabled) setHighlightedIndex(index);
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  selectOption(option);
                }}
              >
                <span>{option.label}</span>
                {isSelected && (
                  <span className={styles.checkmark} aria-hidden="true">
                    ✓
                  </span>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
});

export default Select;
