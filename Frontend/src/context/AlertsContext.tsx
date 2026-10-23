/* eslint-disable react-refresh/only-export-components */
import React, {
  createContext,
  lazy,
  Suspense,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import { useActiveBranch } from './ActiveBranchContext';
import { incidentService, type Incidente, type FiltroIncidentes } from '../services/incidentService';

const AlertModal = lazy(() => import('../components/alerts/AlertModal'));

export const POLL_INTERVAL_MS = 15_000;

export const SAMPLE_INCIDENT: Incidente = {
  _id: 'simulado',
  machineId: 'simulado-machine',
  maquina: {
    nome: 'Titan',
    identificacao: 'EMP-084(ID)',
    setor: 'Expedição - Bloco B',
  },
  operador: {
    nome: 'Alexandre Mattos',
  },
  dataIncidente: new Date().toISOString(),
  forcaImpacto: null,
  status: 'pendente',
  origem: 'funcionario',
  descricao: null,
};

export interface AlertsContextValue {
  recent: Incidente[];
  loading: boolean;
  error: boolean;
  hasUnseen: boolean;
  markSeen(): void;
  reload(): void;
  simulate(): void;
}

const defaultAlertsValue: AlertsContextValue = {
  recent: [],
  loading: false,
  error: false,
  hasUnseen: false,
  markSeen: () => {},
  reload: () => {},
  simulate: () => {},
};

const AlertsContext = createContext<AlertsContextValue>(defaultAlertsValue);

export const useAlerts = (): AlertsContextValue => useContext(AlertsContext);

function readSeen(userId: string): string[] {
  try {
    const raw = window.localStorage.getItem(`liftech.alerts.seen.${userId}`);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeSeen(userId: string, ids: string[]): void {
  try {
    window.localStorage.setItem(`liftech.alerts.seen.${userId}`, JSON.stringify(ids));
  } catch {
    // storage indisponível
  }
}

export const AlertsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, activeBranch } = useActiveBranch();
  const filialId = activeBranch === 'todas' ? undefined : activeBranch;
  const userId = user?._id;

  const [loadedUserId, setLoadedUserId] = useState(userId);
  const [loadedBranchKey, setLoadedBranchKey] = useState(`${userId}:${filialId}`);

  const [recent, setRecent] = useState<Incidente[]>([]);
  const [loading, setLoading] = useState(Boolean(userId));
  const [error, setError] = useState(false);
  const [seen, setSeen] = useState<string[]>(() => (userId ? readSeen(userId) : []));
  const [queue, setQueue] = useState<Incidente[]>([]);

  const known = useRef<Set<string> | null>(null);
  const pollRef = useRef<((force?: boolean) => Promise<void>) | null>(null);

  // Ajusta estado durante o render ao mudar de usuário ou filial
  if (loadedUserId !== userId) {
    setLoadedUserId(userId);
    setSeen(userId ? readSeen(userId) : []);
  }

  if (loadedBranchKey !== `${userId}:${filialId}`) {
    setLoadedBranchKey(`${userId}:${filialId}`);
    if (!userId) {
      setRecent([]);
      setLoading(false);
      setError(false);
      setQueue([]);
    } else {
      setLoading(true);
    }
  }

  // ponytail: Polling fetches up to 500 incidents per query because GET /api/incidents has no limit param yet (LIMITE_HISTORICO). Pauses when hidden; upgrade to query limit once history grows.
  useEffect(() => {
    if (!userId) {
      return;
    }

    let stale = false;
    known.current = null;

    const doPoll = async (force = false) => {
      if (!force && document.visibilityState !== 'visible') {
        return;
      }
      try {
        const params: FiltroIncidentes = filialId ? { filialId } : {};
        const list = await incidentService.listar(params);
        if (stale) return;

        setRecent(list.slice(0, 5));
        setError(false);
        setLoading(false);

        if (known.current === null) {
          known.current = new Set(list.map((i) => i._id));
        } else {
          const novos = list.filter((i) => !known.current!.has(i._id));
          for (const item of novos) {
            known.current.add(item._id);
          }
          if (novos.length > 0) {
            const ordenados = [...novos].sort(
              (a, b) => new Date(a.dataIncidente).getTime() - new Date(b.dataIncidente).getTime()
            );
            setQueue((q) => [...q, ...ordenados]);
          }
        }
      } catch {
        if (stale) return;
        setError(true);
        setLoading(false);
      }
    };

    pollRef.current = (force = false) => doPoll(force);

    void doPoll();

    const interval = setInterval(() => {
      if (document.visibilityState === 'visible') {
        void doPoll();
      }
    }, POLL_INTERVAL_MS);

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        void doPoll();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      stale = true;
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [userId, filialId]);

  const reload = useCallback(() => {
    if (pollRef.current) {
      void pollRef.current(true);
    }
  }, []);

  const markSeen = useCallback(() => {
    const ids = recent.map((i) => i._id);
    setSeen(ids);
    if (userId) {
      writeSeen(userId, ids);
    }
  }, [recent, userId]);

  const dismiss = useCallback(() => {
    setQueue((q) => q.slice(1));
  }, []);

  const simulate = useCallback(() => {
    setQueue((q) => [...q, SAMPLE_INCIDENT]);
  }, []);

  const hasUnseen = recent.some((i) => !seen.includes(i._id));

  const value: AlertsContextValue = {
    recent,
    loading,
    error,
    hasUnseen,
    markSeen,
    reload,
    simulate,
  };

  return (
    <AlertsContext.Provider value={value}>
      {children}
      {queue[0] && (
        <Suspense fallback={null}>
          <AlertModal incident={queue[0]} onClose={dismiss} />
        </Suspense>
      )}
    </AlertsContext.Provider>
  );
};
