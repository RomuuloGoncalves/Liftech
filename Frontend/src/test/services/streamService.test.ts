import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createSSEParser, streamService } from '../../services/streamService'

describe('createSSEParser', () => {
  it('parses a single complete event with JSON data', () => {
    const onEvento = vi.fn()
    const parser = createSSEParser(onEvento)

    parser.feed('event: maquina\ndata: {"id":"123","status":"alerta"}\n\n')

    expect(onEvento).toHaveBeenCalledTimes(1)
    expect(onEvento).toHaveBeenCalledWith({
      event: 'maquina',
      data: { id: '123', status: 'alerta' },
    })
  })

  it('delivers event and data even when block is split across multiple chunks', () => {
    const onEvento = vi.fn()
    const parser = createSSEParser(onEvento)

    parser.feed('event: in')
    expect(onEvento).not.toHaveBeenCalled()

    parser.feed('cidente\ndata: {"machineId":"m')
    expect(onEvento).not.toHaveBeenCalled()

    parser.feed('1","tipo":"colisao"}')
    expect(onEvento).not.toHaveBeenCalled()

    parser.feed('\n\n')
    expect(onEvento).toHaveBeenCalledTimes(1)
    expect(onEvento).toHaveBeenCalledWith({
      event: 'incidente',
      data: { machineId: 'm1', tipo: 'colisao' },
    })
  })

  it('parses multiple events delivered in a single chunk', () => {
    const onEvento = vi.fn()
    const parser = createSSEParser(onEvento)

    parser.feed(
      'event: maquina\ndata: {"id":"1"}\n\nevent: maquina\ndata: {"id":"2"}\n\n'
    )

    expect(onEvento).toHaveBeenCalledTimes(2)
    expect(onEvento).toHaveBeenNthCalledWith(1, {
      event: 'maquina',
      data: { id: '1' },
    })
    expect(onEvento).toHaveBeenNthCalledWith(2, {
      event: 'maquina',
      data: { id: '2' },
    })
  })

  it('ignores comments such as ": ping"', () => {
    const onEvento = vi.fn()
    const parser = createSSEParser(onEvento)

    parser.feed(': ping\n\n')
    parser.feed(': heartbeat\n\n')

    expect(onEvento).not.toHaveBeenCalled()
  })

  it('ignores blocks without an event field', () => {
    const onEvento = vi.fn()
    const parser = createSSEParser(onEvento)

    parser.feed('data: {"only":"data"}\n\n')

    expect(onEvento).not.toHaveBeenCalled()
  })

  it('handles CRLF line endings', () => {
    const onEvento = vi.fn()
    const parser = createSSEParser(onEvento)

    parser.feed('event: dispositivo_offline\r\ndata: {"machineId":"m1"}\r\n\r\n')

    expect(onEvento).toHaveBeenCalledTimes(1)
    expect(onEvento).toHaveBeenCalledWith({
      event: 'dispositivo_offline',
      data: { machineId: 'm1' },
    })
  })

  it('preserves non-JSON raw data when JSON.parse fails', () => {
    const onEvento = vi.fn()
    const parser = createSSEParser(onEvento)

    parser.feed('event: ping\ndata: pong\n\n')

    expect(onEvento).toHaveBeenCalledWith({
      event: 'ping',
      data: 'pong',
    })
  })
})

describe('streamService.abrir', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.restoreAllMocks()
  })

  afterEach(() => {
    localStorage.clear()
  })

  it('sends Authorization: Bearer when token is present and calls /stream', async () => {
    localStorage.setItem('token', 'test-jwt-token')

    const encoder = new TextEncoder()
    const stream = new ReadableStream({
      start(controller) {
        controller.enqueue(encoder.encode('event: maquina\ndata: {"id":"1"}\n\n'))
        controller.close()
      },
    })

    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      body: stream,
    })
    globalThis.fetch = fetchMock

    const onEvento = vi.fn()
    await streamService.abrir(onEvento)

    expect(fetchMock).toHaveBeenCalledTimes(1)
    const [url, init] = fetchMock.mock.calls[0]
    expect(url).toMatch(/\/stream$/)
    expect(init.headers['Authorization']).toBe('Bearer test-jwt-token')
    expect(init.headers['Accept']).toBe('text/event-stream')

    expect(onEvento).toHaveBeenCalledWith({
      event: 'maquina',
      data: { id: '1' },
    })
  })

  it('throws an error with status 401 when backend responds with 401', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
    })
    globalThis.fetch = fetchMock

    const onEvento = vi.fn()
    await expect(streamService.abrir(onEvento)).rejects.toMatchObject({
      status: 401,
    })
  })

  it('closes reading and returns when signal is aborted', async () => {
    const controller = new AbortController()

    let streamCancelled = false
    const encoder = new TextEncoder()
    const stream = new ReadableStream({
      start(ctrl) {
        ctrl.enqueue(encoder.encode(': heartbeat\n\n'))
      },
      cancel() {
        streamCancelled = true
      },
    })

    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      body: stream,
    })
    globalThis.fetch = fetchMock

    const onEvento = vi.fn()
    const promise = streamService.abrir(onEvento, controller.signal)

    // Aguarda um instante para que a leitura se inicie, então cancela
    await new Promise((r) => setTimeout(r, 10))
    controller.abort()
    await promise

    expect(streamCancelled).toBe(true)
  })

  it('returns immediately if signal was already aborted before calling abrir', async () => {
    const controller = new AbortController()
    controller.abort()

    const fetchMock = vi.fn()
    globalThis.fetch = fetchMock

    const onEvento = vi.fn()
    await streamService.abrir(onEvento, controller.signal)

    expect(fetchMock).not.toHaveBeenCalled()
  })
})
