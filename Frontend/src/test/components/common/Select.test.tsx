import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import Select, { type SelectOption } from '../../../components/common/Select';

const sampleOptions: SelectOption[] = [
  { value: 'apple', label: 'Apple' },
  { value: 'banana', label: 'Banana' },
  { value: 'cherry', label: 'Cherry' },
  { value: 'date', label: 'Date', disabled: true },
  { value: 'elderberry', label: 'Elderberry' },
];

describe('Select component (UXP-04)', () => {
  it('renders with combobox role, label and closed listbox by default (AC 1, AC 7)', () => {
    render(
      <Select
        id="fruit-select"
        value="banana"
        options={sampleOptions}
        onChange={vi.fn()}
        ariaLabel="Pick a fruit"
      />
    );

    const combobox = screen.getByRole('combobox', { name: 'Pick a fruit' });
    expect(combobox).toBeInTheDocument();
    expect(combobox).toHaveTextContent('Banana');
    expect(combobox).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  });

  it('associates with label via htmlFor/id and focuses on click (AC 9)', () => {
    render(
      <div>
        <label htmlFor="fruit-select">Fruit label</label>
        <Select
          id="fruit-select"
          value="banana"
          options={sampleOptions}
          onChange={vi.fn()}
        />
      </div>
    );

    const label = screen.getByText('Fruit label');
    const combobox = screen.getByRole('combobox');
    fireEvent.click(label);
    expect(combobox).toHaveFocus();
  });

  it('opens list on click, Enter, Space or ArrowDown with current option highlighted (AC 3, AC 7)', () => {
    render(
      <Select
        value="banana"
        options={sampleOptions}
        onChange={vi.fn()}
      />
    );

    const combobox = screen.getByRole('combobox');
    // Clique abre
    fireEvent.click(combobox);
    expect(combobox).toHaveAttribute('aria-expanded', 'true');
    const listbox = screen.getByRole('listbox');
    expect(listbox).toBeInTheDocument();

    const options = screen.getAllByRole('option');
    expect(options).toHaveLength(5);
    expect(options[1]).toHaveAttribute('aria-selected', 'true');
    expect(options[0]).toHaveAttribute('aria-selected', 'false');

    // Fecha pressionando Escape
    fireEvent.keyDown(combobox, { key: 'Escape' });
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();

    // Abre via Enter
    fireEvent.keyDown(combobox, { key: 'Enter' });
    expect(screen.getByRole('listbox')).toBeInTheDocument();
    fireEvent.keyDown(combobox, { key: 'Escape' });

    // Abre via Espaço
    fireEvent.keyDown(combobox, { key: ' ' });
    expect(screen.getByRole('listbox')).toBeInTheDocument();
    fireEvent.keyDown(combobox, { key: 'Escape' });

    // Abre via ArrowDown
    fireEvent.keyDown(combobox, { key: 'ArrowDown' });
    expect(screen.getByRole('listbox')).toBeInTheDocument();
  });

  it('navigates with arrows, Home, End and selects with Enter, restoring focus (AC 4, AC 5)', () => {
    const onChange = vi.fn();
    render(
      <Select
        value="apple"
        options={sampleOptions}
        onChange={onChange}
      />
    );

    const combobox = screen.getByRole('combobox');
    fireEvent.click(combobox);

    // ArrowDown move de Apple (índice 0) para Banana (índice 1)
    fireEvent.keyDown(combobox, { key: 'ArrowDown' });
    // ArrowDown move de Banana (índice 1) para Cherry (índice 2)
    fireEvent.keyDown(combobox, { key: 'ArrowDown' });
    // ArrowDown pula Date (índice 3, desabilitado) e move para Elderberry (índice 4)
    fireEvent.keyDown(combobox, { key: 'ArrowDown' });

    // Seleciona com Enter
    fireEvent.keyDown(combobox, { key: 'Enter' });
    expect(onChange).toHaveBeenCalledWith('elderberry');
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    expect(combobox).toHaveFocus();
  });

  it('selects option on click and calls onChange (AC 5)', () => {
    const onChange = vi.fn();
    render(
      <Select
        value="apple"
        options={sampleOptions}
        onChange={onChange}
      />
    );

    const combobox = screen.getByRole('combobox');
    fireEvent.click(combobox);

    const cherry = screen.getByText('Cherry');
    fireEvent.click(cherry);

    expect(onChange).toHaveBeenCalledWith('cherry');
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    expect(combobox).toHaveFocus();
  });

  it('does not select disabled options on click or key', () => {
    const onChange = vi.fn();
    render(
      <Select
        value="apple"
        options={sampleOptions}
        onChange={onChange}
      />
    );

    const combobox = screen.getByRole('combobox');
    fireEvent.click(combobox);

    const date = screen.getByText('Date');
    fireEvent.click(date);
    expect(onChange).not.toHaveBeenCalled();
    expect(screen.getByRole('listbox')).toBeInTheDocument();
  });

  it('closes on click outside and returns focus (AC 4)', () => {
    render(
      <div>
        <Select
          value="apple"
          options={sampleOptions}
          onChange={vi.fn()}
        />
        <div data-testid="outside">outside element</div>
      </div>
    );

    const combobox = screen.getByRole('combobox');
    fireEvent.click(combobox);
    expect(screen.getByRole('listbox')).toBeInTheDocument();

    fireEvent.mouseDown(screen.getByTestId('outside'));
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    expect(combobox).toHaveFocus();
  });

  it('remains disabled and does not open when disabled is true (AC 6)', () => {
    render(
      <Select
        disabled
        value="apple"
        options={sampleOptions}
        onChange={vi.fn()}
      />
    );

    const combobox = screen.getByRole('combobox');
    expect(combobox).toBeDisabled();
    expect(combobox).toHaveAttribute('aria-disabled', 'true');

    fireEvent.click(combobox);
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();

    fireEvent.keyDown(combobox, { key: 'ArrowDown' });
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  });

  it('jumps to option starting with typed letter (edge case)', () => {
    const onChange = vi.fn();
    render(
      <Select
        value="apple"
        options={sampleOptions}
        onChange={onChange}
      />
    );

    const combobox = screen.getByRole('combobox');
    fireEvent.click(combobox);

    // Digita 'c' -> deve pular para Cherry
    fireEvent.keyDown(combobox, { key: 'c' });
    // Pressiona Enter para selecionar
    fireEvent.keyDown(combobox, { key: 'Enter' });
    expect(onChange).toHaveBeenCalledWith('cherry');
  });

  it('supports fireEvent.change for test compatibility', () => {
    const onChange = vi.fn();
    render(
      <Select
        value="apple"
        options={sampleOptions}
        onChange={onChange}
      />
    );

    const combobox = screen.getByRole('combobox');
    fireEvent.change(combobox, { target: { value: 'banana' } });
    expect(onChange).toHaveBeenCalledWith('banana');
  });

  it('opens upward when there is not enough room below (AC 8)', () => {
    render(
      <Select
        value="apple"
        options={sampleOptions}
        onChange={vi.fn()}
      />
    );

    const combobox = screen.getByRole('combobox');
    // Simula getBoundingClientRect próximo ao rodapé da janela de visualização
    vi.spyOn(combobox, 'getBoundingClientRect').mockReturnValue({
      top: 600,
      bottom: 640,
      left: 0,
      right: 200,
      width: 200,
      height: 40,
      x: 0,
      y: 600,
      toJSON: () => {},
    });
    // Altura da viewport 700 -> espaço abaixo é 60px (< 220px), espaço acima é 600px
    Object.defineProperty(window, 'innerHeight', { writable: true, configurable: true, value: 700 });

    fireEvent.click(combobox);
    const listbox = screen.getByRole('listbox');
    expect(listbox.className).toContain('placementTop');
  });
});
