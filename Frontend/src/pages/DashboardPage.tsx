import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Forklift, Users, Wrench, WrenchOff } from 'lucide-react';
import PageSkeleton, { SkeletonBlock } from '../components/common/PageSkeleton';
import { useToast } from '../components/common/Toast';
import MachineDetailModal from '../components/machines/MachineDetailModal';
import NewMachinePanel, { type NewMachineFormValues } from '../components/machines/NewMachinePanel';
import UsageHeatmap from '../components/dashboard/UsageHeatmap';
import MachineTable from '../components/dashboard/MachineTable';
import { useActiveBranch } from '../context/ActiveBranchContext';
import { machineService } from '../services/machineService';
import { operatorService } from '../services/operatorService';
import { sectorService, type Setor } from '../services/sectorService';
import { sessionService, type Sessao } from '../services/sessionService';
import type { Employee } from '../data/team';
import type { Machine } from '../data/machines';
import { countSessions, heatmapFrom } from '../utils/heatmap';
import styles from './DashboardPage.module.css';

type SourceState<T> = { state: 'loading' | 'ready' | 'error'; data: T[] };

let nextTempId = 0;

export const DashboardPage: React.FC = () => {
  const { t } = useTranslation();
  const { activeBranch } = useActiveBranch();
  const filialId = activeBranch === 'todas' ? undefined : activeBranch;
  const [loadedFilialId, setLoadedFilialId] = useState(filialId);

  const [machinesSource, setMachinesSource] = useState<SourceState<Machine>>({
    state: 'loading',
    data: [],
  });
  const [operatorsSource, setOperatorsSource] = useState<SourceState<Employee>>({
    state: 'loading',
    data: [],
  });
  const [sessionsSource, setSessionsSource] = useState<SourceState<Sessao>>({
    state: 'loading',
    data: [],
  });

  const [sectors, setSectors] = useState<Setor[]>([]);
  const [attempts, setAttempts] = useState({ machines: 0, operators: 0, sessions: 0 });
  const [detailId, setDetailId] = useState<string | null>(null);
  const [isNewMachineOpen, setIsNewMachineOpen] = useState(false);
  const { show, showError } = useToast();

  // Se a filial mudou, volta imediatamente aos skeletons antes de refetch
  if (loadedFilialId !== filialId) {
    setLoadedFilialId(filialId);
    setMachinesSource({ state: 'loading', data: [] });
    setOperatorsSource({ state: 'loading', data: [] });
    setSessionsSource({ state: 'loading', data: [] });
    setDetailId(null);
  }

  // Carga das máquinas
  useEffect(() => {
    let stale = false;
    machineService.listar(filialId).then(
      (data) => {
        if (!stale) setMachinesSource({ state: 'ready', data });
      },
      () => {
        if (!stale) setMachinesSource((prev) => ({ ...prev, state: 'error' }));
      }
    );
    return () => {
      stale = true;
    };
  }, [filialId, attempts.machines]);

  // Carga dos setores para o painel de nova máquina
  useEffect(() => {
    sectorService
      .listar(filialId)
      .catch(() => [])
      .then(setSectors);
  }, [filialId]);

  // Carga dos funcionários
  useEffect(() => {
    let stale = false;
    operatorService.listar(filialId).then(
      (data) => {
        if (!stale) setOperatorsSource({ state: 'ready', data });
      },
      () => {
        if (!stale) setOperatorsSource((prev) => ({ ...prev, state: 'error' }));
      }
    );
    return () => {
      stale = true;
    };
  }, [filialId, attempts.operators]);

  // Carga das sessões
  useEffect(() => {
    let stale = false;
    const from = heatmapFrom(new Date());
    sessionService.listar({ from, filialId }).then(
      (data) => {
        if (!stale) setSessionsSource({ state: 'ready', data });
      },
      () => {
        if (!stale) setSessionsSource((prev) => ({ ...prev, state: 'error' }));
      }
    );
    return () => {
      stale = true;
    };
  }, [filialId, attempts.sessions]);

  const retrySource = (source: 'machines' | 'operators' | 'sessions') => {
    if (source === 'machines') {
      setMachinesSource((prev) => ({ ...prev, state: 'loading' }));
      setAttempts((prev) => ({ ...prev, machines: prev.machines + 1 }));
    } else if (source === 'operators') {
      setOperatorsSource((prev) => ({ ...prev, state: 'loading' }));
      setAttempts((prev) => ({ ...prev, operators: prev.operators + 1 }));
    } else if (source === 'sessions') {
      setSessionsSource((prev) => ({ ...prev, state: 'loading' }));
      setAttempts((prev) => ({ ...prev, sessions: prev.sessions + 1 }));
    }
  };

  const handleCreateMachine = (values: NewMachineFormValues) => {
    const tempId = `temp-${nextTempId++}`;
    const sectorName = sectors.find((s) => s._id === values.setorId)?.nome ?? '';
    const tempMachine: Machine = {
      id: tempId,
      identificacao: values.identificacao,
      nome: values.nome,
      setor: sectorName,
      setorId: values.setorId || null,
      status: 'disponivel',
      categoriaId: null,
      categoriaTravada: false,
      alertaEm: null,
      dispositivoConectado: {
        enderecoMac: values.enderecoMac,
        nomeDispositivo: values.nomeDispositivo,
      },
      tempoSessaoMinutos: 0,
      tempoUsoTotalHoras: 0,
    };

    setMachinesSource((prev) => ({ ...prev, data: [tempMachine, ...prev.data] }));
    setIsNewMachineOpen(false);
    show(t('machines.toastCreated', { name: values.identificacao }));

    machineService.criar(values, values.filialId ?? filialId).then(
      (saved) => {
        setMachinesSource((prev) => ({
          ...prev,
          data: prev.data.map((m) => (m.id === tempId ? saved : m)),
        }));
      },
      () => {
        setMachinesSource((prev) => ({
          ...prev,
          data: prev.data.filter((m) => m.id !== tempId),
        }));
        showError(t('machines.saveError'));
      }
    );
  };

  const detailMachine = machinesSource.data.find((m) => m.id === detailId);

  const heatmapCounts = useMemo(
    () => countSessions(sessionsSource.data.map((s) => s.inicio)),
    [sessionsSource.data]
  );

  const isAnyLoading =
    machinesSource.state === 'loading' ||
    operatorsSource.state === 'loading' ||
    sessionsSource.state === 'loading';

  return (
    <div className={styles.page} aria-busy={isAnyLoading ? 'true' : undefined}>
      <h1 className={styles.title}>{t('dashboard.title')}</h1>

      {/* Seção Dados rápidos */}
      <section className={styles.section} aria-label={t('dashboard.quickData')}>
        <h2 className={styles.sectionTitle}>{t('dashboard.quickData')}</h2>
        <div className={styles.quickDataGrid}>
          {/* Cartão 1: Máquinas cadastradas */}
          {machinesSource.state === 'loading' ? (
            <PageSkeleton>
              <SkeletonBlock className={styles.cardSkeleton} />
            </PageSkeleton>
          ) : machinesSource.state === 'error' ? (
            <div className={`${styles.quickCard} ${styles.cardError}`} role="alert">
              <p className={styles.errorMessage}>{t('dashboard.loadError')}</p>
              <button
                type="button"
                className={styles.retryButton}
                onClick={() => retrySource('machines')}
              >
                {t('common.retry')}
              </button>
            </div>
          ) : (
            <div className={styles.quickCard}>
              <div className={styles.iconSquare}>
                <Forklift size={26} aria-hidden="true" />
              </div>
              <div className={styles.cardContent}>
                <span className={styles.cardNumber}>{machinesSource.data.length}</span>
                <span className={styles.cardLabel}>{t('dashboard.machinesRegistered')}</span>
              </div>
            </div>
          )}

          {/* Cartão 2: Funcionários cadastrados */}
          {operatorsSource.state === 'loading' ? (
            <PageSkeleton>
              <SkeletonBlock className={styles.cardSkeleton} />
            </PageSkeleton>
          ) : operatorsSource.state === 'error' ? (
            <div className={`${styles.quickCard} ${styles.cardError}`} role="alert">
              <p className={styles.errorMessage}>{t('dashboard.loadError')}</p>
              <button
                type="button"
                className={styles.retryButton}
                onClick={() => retrySource('operators')}
              >
                {t('common.retry')}
              </button>
            </div>
          ) : (
            <div className={styles.quickCard}>
              <div className={styles.iconSquare}>
                <Users size={26} aria-hidden="true" />
              </div>
              <div className={styles.cardContent}>
                <span className={styles.cardNumber}>{operatorsSource.data.length}</span>
                <span className={styles.cardLabel}>{t('dashboard.employeesRegistered')}</span>
              </div>
            </div>
          )}

          {/* Cartão 3: Máquinas em manutenção */}
          {machinesSource.state === 'loading' ? (
            <PageSkeleton>
              <SkeletonBlock className={styles.cardSkeleton} />
            </PageSkeleton>
          ) : machinesSource.state === 'error' ? (
            <div className={`${styles.quickCard} ${styles.cardError}`} role="alert">
              <p className={styles.errorMessage}>{t('dashboard.loadError')}</p>
              <button
                type="button"
                className={styles.retryButton}
                onClick={() => retrySource('machines')}
              >
                {t('common.retry')}
              </button>
            </div>
          ) : (
            <div className={styles.quickCard}>
              <div className={styles.iconSquare}>
                <Wrench size={26} aria-hidden="true" />
              </div>
              <div className={styles.cardContent}>
                <span className={styles.cardNumber}>
                  {machinesSource.data.filter((m) => m.status === 'manutencao').length}
                </span>
                <span className={styles.cardLabel}>{t('dashboard.machinesMaintenance')}</span>
              </div>
            </div>
          )}

          {/* Cartão 4: Máquinas Desativadas */}
          {machinesSource.state === 'loading' ? (
            <PageSkeleton>
              <SkeletonBlock className={styles.cardSkeleton} />
            </PageSkeleton>
          ) : machinesSource.state === 'error' ? (
            <div className={`${styles.quickCard} ${styles.cardError}`} role="alert">
              <p className={styles.errorMessage}>{t('dashboard.loadError')}</p>
              <button
                type="button"
                className={styles.retryButton}
                onClick={() => retrySource('machines')}
              >
                {t('common.retry')}
              </button>
            </div>
          ) : (
            <div className={styles.quickCard}>
              <div className={styles.iconSquare}>
                <WrenchOff size={26} aria-hidden="true" />
              </div>
              <div className={styles.cardContent}>
                <span className={styles.cardNumber}>
                  {machinesSource.data.filter((m) => m.status === 'offline').length}
                </span>
                <span className={styles.cardLabel}>{t('dashboard.machinesDisabled')}</span>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Seção Informações sobre as máquinas */}
      <section className={styles.section} aria-label={t('dashboard.machinesInfo')}>
        <h2 className={styles.sectionTitle}>{t('dashboard.machinesInfo')}</h2>
        <div className={styles.infoGrid}>
          {/* Painel Tabela de máquinas */}
          {machinesSource.state === 'loading' ? (
            <PageSkeleton>
              <SkeletonBlock className={styles.tableSkeleton} />
            </PageSkeleton>
          ) : machinesSource.state === 'error' ? (
            <div className={styles.errorContainer} role="alert">
              <p>{t('dashboard.loadError')}</p>
              <button
                type="button"
                className={styles.retryButton}
                onClick={() => retrySource('machines')}
              >
                {t('common.retry')}
              </button>
            </div>
          ) : (
            <MachineTable
              machines={machinesSource.data}
              onOpen={(machine) => setDetailId(machine.id)}
              onCreate={() => setIsNewMachineOpen(true)}
            />
          )}

          {/* Painel Heatmap de sessões */}
          {sessionsSource.state === 'loading' ? (
            <PageSkeleton>
              <SkeletonBlock className={styles.heatmapSkeleton} />
            </PageSkeleton>
          ) : sessionsSource.state === 'error' ? (
            <div className={styles.errorContainer} role="alert">
              <p>{t('dashboard.loadError')}</p>
              <button
                type="button"
                className={styles.retryButton}
                onClick={() => retrySource('sessions')}
              >
                {t('common.retry')}
              </button>
            </div>
          ) : (
            <UsageHeatmap counts={heatmapCounts} />
          )}
        </div>
      </section>

      {/* Modal de Detalhe (somente leitura: sem ações onEdit/onDelete/onChangeStatus/onToggleLock) */}
      {detailMachine && (
        <MachineDetailModal
          machine={detailMachine}
          events={[]}
          variant="overview"
          onClose={() => setDetailId(null)}
        />
      )}

      {/* Painel de Nova Máquina */}
      {isNewMachineOpen && (
        <NewMachinePanel
          sectors={sectors}
          defaultFilialId={filialId}
          onClose={() => setIsNewMachineOpen(false)}
          onCreate={handleCreateMachine}
        />
      )}
    </div>
  );
};

export default DashboardPage;
