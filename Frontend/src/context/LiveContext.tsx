/* eslint-disable react-refresh/only-export-components */
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
} from 'react';
import { useActiveBranch } from './ActiveBranchContext';
import { streamService, type EventoSSE } from '../services/streamService';
import { authService } from '../services/authService';

export type LiveHandler<T = unknown> = (data: T) => void;
export type ReconnectHandler = () => void;

export interface LiveContextValue {
  subscribe: <T = unknown>(tipo: string, handler: LiveHandler<T>) => () => void;
  onReconnect: (handler: ReconnectHandler) => () => void;
}

const LiveContext = createContext<LiveContextValue | null>(null);

export const INITIAL_RECONNECT_DELAY_MS = 1000;
export const MAX_RECONNECT_DELAY_MS = 30000;

export const LiveProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useActiveBranch();
  const userId = user?._id;

  const listenersRef = useRef<Map<string, Set<LiveHandler<unknown>>>>(new Map());
  const reconnectListenersRef = useRef<Set<ReconnectHandler>>(new Set());

  const subscribe = useCallback(<T = unknown>(tipo: string, handler: LiveHandler<T>) => {
    if (!listenersRef.current.has(tipo)) {
      listenersRef.current.set(tipo, new Set());
    }
    listenersRef.current.get(tipo)!.add(handler as LiveHandler<unknown>);
    return () => {
      listenersRef.current.get(tipo)?.delete(handler as LiveHandler<unknown>);
    };
  }, []);

  const onReconnect = useCallback((handler: ReconnectHandler) => {
    reconnectListenersRef.current.add(handler);
    return () => {
      reconnectListenersRef.current.delete(handler);
    };
  }, []);

  useEffect(() => {
    if (!userId) {
      return;
    }

    let isSubscribed = true;
    let abortController: AbortController | null = null;
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
    let resetDelayTimer: ReturnType<typeof setTimeout> | null = null;
    let delay = INITIAL_RECONNECT_DELAY_MS;
    let hasDisconnected = false;

    const connect = async () => {
      if (!isSubscribed) return;

      abortController = new AbortController();

      let is401 = false;
      try {
        await streamService.abrir(
          (evento: EventoSSE) => {
            if (!isSubscribed) return;
            const handlers = listenersRef.current.get(evento.event);
            if (handlers) {
              handlers.forEach((handler) => {
                try {
                  handler(evento.data);
                } catch (e) {
                  console.error('Error in SSE handler:', e);
                }
              });
            }
          },
          {
            signal: abortController.signal,
            onOpen: () => {
              if (hasDisconnected) {
                reconnectListenersRef.current.forEach((cb) => {
                  try {
                    cb();
                  } catch (e) {
                    console.error('Error in onReconnect callback:', e);
                  }
                });
                hasDisconnected = false;
              }
              if (resetDelayTimer) {
                clearTimeout(resetDelayTimer);
              }
              resetDelayTimer = setTimeout(() => {
                delay = INITIAL_RECONNECT_DELAY_MS;
              }, 5000);
            },
          }
        );
      } catch (err: unknown) {
        if ((err as { status?: number })?.status === 401) {
          is401 = true;
          authService.logout();
        }
      }

      if (resetDelayTimer) {
        clearTimeout(resetDelayTimer);
        resetDelayTimer = null;
      }

      if (is401 || !isSubscribed || abortController.signal.aborted) {
        return;
      }

      // Conexão perdida, agenda reconexão
      hasDisconnected = true;
      const waitTime = delay;
      delay = Math.min(delay * 2, MAX_RECONNECT_DELAY_MS);

      reconnectTimer = setTimeout(() => {
        if (isSubscribed) {
          void connect();
        }
      }, waitTime);
    };

    void connect();

    return () => {
      isSubscribed = false;
      if (resetDelayTimer) {
        clearTimeout(resetDelayTimer);
      }
      if (reconnectTimer) {
        clearTimeout(reconnectTimer);
      }
      if (abortController) {
        abortController.abort();
      }
    };
  }, [userId]);

  return (
    <LiveContext.Provider value={{ subscribe, onReconnect }}>
      {children}
    </LiveContext.Provider>
  );
};

export function useLive<T = unknown>(
  tipo: string,
  handler: LiveHandler<T>,
  onReconnectCb?: ReconnectHandler
): { onReconnect: (handler: ReconnectHandler) => () => void } {
  const context = useContext(LiveContext);

  const handlerRef = useRef(handler);
  useEffect(() => {
    handlerRef.current = handler;
  }, [handler]);

  const onReconnectRef = useRef(onReconnectCb);
  useEffect(() => {
    onReconnectRef.current = onReconnectCb;
  }, [onReconnectCb]);

  useEffect(() => {
    if (!context) return;
    return context.subscribe<T>(tipo, (data: T) => {
      handlerRef.current(data);
    });
  }, [context, tipo]);

  useEffect(() => {
    if (!context || !onReconnectCb) return;
    return context.onReconnect(() => {
      onReconnectRef.current?.();
    });
  }, [context, onReconnectCb]);

  return { onReconnect: context?.onReconnect ?? (() => () => {}) };
}

export function useOnReconnect(handler: ReconnectHandler): void {
  const context = useContext(LiveContext);

  const handlerRef = useRef(handler);
  useEffect(() => {
    handlerRef.current = handler;
  }, [handler]);

  useEffect(() => {
    if (!context) return;
    return context.onReconnect(() => {
      handlerRef.current();
    });
  }, [context]);
}
