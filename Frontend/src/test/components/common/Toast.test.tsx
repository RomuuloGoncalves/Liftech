import { act, fireEvent, render, renderHook, screen, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ToastProvider, useToast } from '../../../components/common/Toast'

const Trigger: React.FC<{ messages: string[]; label?: string }> = ({ messages, label = 'fire' }) => {
  const { show } = useToast()
  return (
    <button type="button" onClick={() => messages.forEach(show)}>
      {label}
    </button>
  )
}

function setup(messages = ['Categoria "Reserva" criada']) {
  render(
    <ToastProvider>
      <Trigger messages={messages} />
    </ToastProvider>
  )
  fireEvent.click(screen.getByRole('button', { name: 'fire' }))
}

const toasts = () =>
  within(screen.getByRole('status'))
    .queryAllByRole('listitem')
    .map((li) => li.textContent)

describe('Toast', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => vi.useRealTimers())

  it('shows the message inside a polite live status region', () => {
    setup()
    const region = screen.getByRole('status')
    expect(region).toHaveAttribute('aria-live', 'polite')
    expect(toasts()).toEqual(['Categoria "Reserva" criada'])
  })

  it('removes the toast after 4 seconds', () => {
    setup()
    act(() => vi.advanceTimersByTime(3999))
    expect(toasts()).toHaveLength(1)
    act(() => vi.advanceTimersByTime(1))
    expect(toasts()).toEqual([])
  })

  it('removes the toast when its close button is clicked', () => {
    setup()
    fireEvent.click(screen.getByRole('button', { name: 'Fechar aviso' }))
    expect(toasts()).toEqual([])
  })

  it('stacks several toasts with the newest last', () => {
    setup(['primeiro', 'segundo'])
    expect(toasts()).toEqual(['primeiro', 'segundo'])
  })

  it('keeps other toasts when one is closed early and its timer would fire later', () => {
    render(
      <ToastProvider>
        <Trigger messages={['primeiro']} label="first" />
        <Trigger messages={['segundo']} label="second" />
      </ToastProvider>
    )
    fireEvent.click(screen.getByRole('button', { name: 'first' }))
    act(() => vi.advanceTimersByTime(2000))
    fireEvent.click(screen.getByRole('button', { name: 'second' }))
    fireEvent.click(screen.getAllByRole('button', { name: 'Fechar aviso' })[0])
    expect(toasts()).toEqual(['segundo'])
    act(() => vi.advanceTimersByTime(2000))
    expect(toasts()).toEqual(['segundo'])
    act(() => vi.advanceTimersByTime(2000))
    expect(toasts()).toEqual([])
  })

  it('ignores calls made without a provider', () => {
    const { result } = renderHook(() => useToast())
    expect(() => result.current.show('sem provider')).not.toThrow()
  })
})
