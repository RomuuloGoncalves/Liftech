export interface EventoSSE<T = unknown> {
  event: string;
  data: T;
}

export type StreamEventHandler = (evento: EventoSSE) => void;

export interface StreamServiceOptions {
  signal?: AbortSignal;
  baseUrl?: string;
  onOpen?: () => void;
}

export function createSSEParser(onEvento: StreamEventHandler) {
  let buffer = '';

  return {
    feed(chunk: string) {
      buffer += chunk;
      while (true) {
        const match = buffer.match(/\r?\n\r?\n/);
        if (!match || match.index === undefined) break;

        const block = buffer.slice(0, match.index);
        buffer = buffer.slice(match.index + match[0].length);

        parseBlock(block, onEvento);
      }
    },
    reset() {
      buffer = '';
    },
  };
}

function parseBlock(block: string, onEvento: StreamEventHandler) {
  const lines = block.split(/\r?\n/);
  let event = '';
  const dataLines: string[] = [];

  for (const line of lines) {
    if (!line || line.startsWith(':')) {
      // Linha vazia ou comentário (ex.: : ping)
      continue;
    }
    if (line.startsWith('event:')) {
      event = line.slice(6).trimStart();
    } else if (line.startsWith('data:')) {
      dataLines.push(line.slice(5).trimStart());
    }
  }

  // Ignora blocos sem evento
  if (!event) return;

  const rawData = dataLines.join('\n');
  let parsedData: unknown = rawData;
  try {
    parsedData = JSON.parse(rawData);
  } catch {
    // Mantém dados brutos se não for JSON
  }

  onEvento({ event, data: parsedData });
}

export const streamService = {
  async abrir(
    onEvento: StreamEventHandler,
    signalOrOptions?: AbortSignal | StreamServiceOptions
  ): Promise<void> {
    let signal: AbortSignal | undefined;
    let customBaseUrl: string | undefined;
    let onOpen: (() => void) | undefined;

    if (signalOrOptions) {
      if ('aborted' in signalOrOptions) {
        signal = signalOrOptions as AbortSignal;
      } else {
        signal = signalOrOptions.signal;
        customBaseUrl = signalOrOptions.baseUrl;
        onOpen = signalOrOptions.onOpen;
      }
    }

    if (signal?.aborted) return;

    const baseUrl = customBaseUrl ?? import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api';
    const url = `${baseUrl.replace(/\/+$/, '')}/stream`;

    const token = localStorage.getItem('token');
    const headers: Record<string, string> = {
      Accept: 'text/event-stream',
      'Cache-Control': 'no-cache',
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(url, { headers, signal });

    if (response.status === 401) {
      const error = new Error('Unauthorized');
      Object.assign(error, { status: 401 });
      throw error;
    }

    if (!response.ok) {
      const error = new Error(`HTTP error ${response.status}`);
      Object.assign(error, { status: response.status });
      throw error;
    }

    if (!response.body) {
      return;
    }

    onOpen?.();

    const parser = createSSEParser(onEvento);
    const reader = response.body.getReader();
    const decoder = new TextDecoder('utf-8');

    const onAbort = () => {
      try {
        void reader.cancel();
      } catch {
        // ignora
      }
    };

    if (signal?.aborted) {
      try {
        void reader.cancel();
      } catch {
        // ignora
      }
      return;
    }

    if (signal) {
      signal.addEventListener('abort', onAbort, { once: true });
    }

    try {
      while (true) {
        if (signal?.aborted) break;

        const { value, done } = await reader.read();
        if (done) break;

        if (value) {
          const text = decoder.decode(value, { stream: true });
          parser.feed(text);
        }
      }
    } catch (err: unknown) {
      const isAbort =
        signal?.aborted || (err instanceof Error && err.name === 'AbortError');
      if (isAbort) {
        return;
      }
      throw err;
    } finally {
      if (signal) {
        signal.removeEventListener('abort', onAbort);
      }
      try {
        reader.releaseLock();
      } catch {
        // ignora
      }
    }
  },
};
