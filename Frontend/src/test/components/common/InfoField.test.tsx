import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { InfoField } from '../../../components/common/InfoField'
import styles from '../../../components/common/InfoField.module.css'

describe('InfoField (CARD-02)', () => {
  it('renders dt with label and dd with value inside a dl', () => {
    const { container } = render(
      <dl>
        <InfoField label="Setor:">Expedição</InfoField>
      </dl>,
    )

    const dt = screen.getByText('Setor:')
    const dd = screen.getByText('Expedição')

    expect(dt.tagName.toLowerCase()).toBe('dt')
    expect(dd.tagName.toLowerCase()).toBe('dd')
    expect(dt).toHaveClass(styles.label)
    expect(dd).toHaveClass(styles.value)

    const root = container.querySelector(`.${styles.field}`)
    expect(root).toBeInTheDocument()
    expect(root?.tagName.toLowerCase()).toBe('div')
  })

  it('passes title to the dd element', () => {
    render(
      <dl>
        <InfoField label="MAC:" title="00:1B:44:11:3A:B7">
          00:1B:44:11:3A:B7
        </InfoField>
      </dl>,
    )

    const dd = screen.getByText('00:1B:44:11:3A:B7')
    expect(dd).toHaveAttribute('title', '00:1B:44:11:3A:B7')
  })

  it('appends valueClassName to the dd element class list', () => {
    render(
      <dl>
        <InfoField label="Status:" valueClassName="custom-value-class">
          Operando
        </InfoField>
      </dl>,
    )

    const dd = screen.getByText('Operando')
    expect(dd).toHaveClass(styles.value)
    expect(dd).toHaveClass('custom-value-class')
  })

  it('adds inline and highlight classes to the root element when requested', () => {
    const { container } = render(
      <dl>
        <InfoField
          label="Urgência:"
          inline
          highlight
          className="extra-root"
        >
          Crítica
        </InfoField>
      </dl>,
    )

    const root = container.querySelector(`.${styles.field}`)
    expect(root).toHaveClass(styles.field)
    expect(root).toHaveClass(styles.inline)
    expect(root).toHaveClass(styles.highlight)
    expect(root).toHaveClass('extra-root')
  })
})
