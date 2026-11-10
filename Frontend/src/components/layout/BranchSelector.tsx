import React, { useCallback, useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useTranslation } from "react-i18next";
import {
  Bolt,
  Check,
  ChevronDown,
  Pencil,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import ConfirmDialog from "../common/ConfirmDialog";
import Spinner from "../common/Spinner";
import { useToast } from "../common/Toast";
import { useActiveBranch } from "../../context/ActiveBranchContext";
import type { Filial } from "../../services/authService";
import styles from "./BranchSelector.module.css";

interface NameFormProps {
  initial: string;
  onConfirm: (nome: string) => void;
  onCancel: () => void;
  busy?: boolean;
}

const NameForm: React.FC<NameFormProps> = ({
  initial,
  onConfirm,
  onCancel,
  busy = false,
}) => {
  const { t } = useTranslation();
  const [value, setValue] = useState(initial);
  const nome = value.trim();

  return (
    <form
      className={styles.nameForm}
      onSubmit={(event) => {
        event.preventDefault();
        if (nome && !busy) onConfirm(nome);
      }}
    >
      <input
        className={styles.nameInput}
        type="text"
        aria-label={t("branches.nameLabel")}
        value={value}
        onChange={(event) => setValue(event.target.value)}
        disabled={busy}
        autoFocus
      />
      <button
        type="submit"
        className={`${styles.iconButton} ${styles.confirm}`}
        aria-label={t("branches.confirm")}
        disabled={!nome || busy}
        aria-busy={busy}
      >
        {busy ? <Spinner size={14} /> : <Check size={14} aria-hidden="true" />}
      </button>
      <button
        type="button"
        className={styles.iconButton}
        aria-label={t("common.cancel")}
        onClick={onCancel}
        disabled={busy}
      >
        <X size={14} aria-hidden="true" />
      </button>
    </form>
  );
};

const hasStatus = (error: unknown, status: number) =>
  (error as { response?: { status?: number } } | null)?.response?.status ===
  status;

const BranchSelector: React.FC<{ collapsed?: boolean }> = ({
  collapsed = false,
}) => {
  const { t } = useTranslation();
  const {
    user,
    branches,
    activeBranch,
    setActiveBranch,
    showAll,
    canManage,
    createBranch,
    renameBranch,
    removeBranch,
  } = useActiveBranch();
  const { show, showError } = useToast();
  const [open, setOpen] = useState(false);
  const [managing, setManaging] = useState(false);
  const [creating, setCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<Filial | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const labelId = useId();
  const triggerId = useId();

  const close = useCallback(() => {
    if (saving || deleting) return;
    setOpen(false);
    setManaging(false);
    setCreating(false);
    setEditingId(null);
    setError(null);
    triggerRef.current?.focus();
  }, [saving, deleting]);

  useEffect(() => {
    // O modal de exclusão é renderizado fora do seletor, então um clique nele não deve contar como "fora".
    if (!open || pendingDelete) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
    };
    const closeOnOutside = (event: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(event.target as Node))
        close();
    };
    window.addEventListener("keydown", closeOnEscape);
    document.addEventListener("mousedown", closeOnOutside);
    return () => {
      window.removeEventListener("keydown", closeOnEscape);
      document.removeEventListener("mousedown", closeOnOutside);
    };
  }, [open, pendingDelete, close]);

  if (!user) return null;

  const activeName =
    activeBranch === "todas"
      ? t("branches.all")
      : (branches.find((branch) => branch._id === activeBranch)?.nome ??
        t("branches.all"));

  const save = async (
    action: () => Promise<void>,
    done: () => void,
    successToast?: string,
  ) => {
    if (saving) return;
    setSaving(true);
    setError(null);
    try {
      await action();
      done();
      if (successToast) show(successToast);
    } catch {
      const msg = t("branches.saveError");
      setError(msg);
      showError(msg);
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (deleting) return;
    const branch = pendingDelete;
    if (!branch) return;
    setDeleting(true);
    setError(null);
    try {
      await removeBranch(branch._id);
      show(t("branches.toastDeleted", { name: branch.nome }));
      setPendingDelete(null);
    } catch (e) {
      const msg = hasStatus(e, 409)
        ? t("branches.deleteBlocked")
        : t("branches.deleteError");
      setError(msg);
      showError(msg);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div
      className={`${styles.root} ${collapsed ? styles.collapsed : ""}`}
      ref={rootRef}
    >
      {!collapsed && (
        <span className={styles.label} id={labelId}>
          {t("branches.label")}
        </span>
      )}
      <button
        type="button"
        id={triggerId}
        ref={triggerRef}
        className={styles.trigger}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={collapsed ? activeName : undefined}
        aria-labelledby={collapsed ? undefined : `${labelId} ${triggerId}`}
        title={collapsed ? activeName : undefined}
        onClick={() => (open ? close() : setOpen(true))}
      >
        {collapsed ? (
          <span className={styles.initial} aria-hidden="true">
            {activeName.charAt(0).toUpperCase()}
          </span>
        ) : (
          <>
            <span className={styles.triggerName}>{activeName}</span>
            <ChevronDown size={16} aria-hidden="true" />
          </>
        )}
      </button>

      {open && (
        <div className={styles.popup}>
          {managing ? (
            <div
              role="group"
              aria-label={t("branches.label")}
              className={styles.list}
            >
              {branches.map((branch) =>
                editingId === branch._id ? (
                  <NameForm
                    key={branch._id}
                    initial={branch.nome}
                    busy={saving}
                    onConfirm={(nome) =>
                      save(
                        () => renameBranch(branch._id, nome),
                        () => setEditingId(null),
                        t("branches.toastRenamed", { name: nome }),
                      )
                    }
                    onCancel={() => setEditingId(null)}
                  />
                ) : (
                  <div key={branch._id} className={styles.row}>
                    <span className={styles.rowName}>{branch.nome}</span>
                    <button
                      type="button"
                      className={`${styles.iconButton} ${styles.edit}`}
                      aria-label={t("branches.rename", { name: branch.nome })}
                      onClick={() => setEditingId(branch._id)}
                      disabled={saving || deleting}
                    >
                      <Pencil size={14} aria-hidden="true" />
                    </button>
                    <button
                      type="button"
                      className={`${styles.iconButton} ${styles.danger}`}
                      aria-label={t("branches.remove", { name: branch.nome })}
                      onClick={() => setPendingDelete(branch)}
                      disabled={saving || deleting}
                    >
                      <Trash2 size={14} aria-hidden="true" />
                    </button>
                  </div>
                ),
              )}
            </div>
          ) : (
            <div
              role="listbox"
              aria-label={t("branches.label")}
              className={styles.list}
            >
              {[
                ...(showAll ? [{ _id: "todas", nome: t("branches.all") }] : []),
                ...branches,
              ].map((branch) => (
                <button
                  key={branch._id}
                  type="button"
                  role="option"
                  aria-selected={activeBranch === branch._id}
                  className={`${styles.option} ${activeBranch === branch._id ? styles.optionActive : ""}`}
                  onClick={() => {
                    setActiveBranch(branch._id);
                    close();
                  }}
                >
                  {branch.nome}
                </button>
              ))}
            </div>
          )}

          {creating && (
            <NameForm
              initial=""
              busy={saving}
              onConfirm={(nome) =>
                save(
                  () => createBranch(nome),
                  () => setCreating(false),
                  t("branches.toastCreated", { name: nome }),
                )
              }
              onCancel={() => setCreating(false)}
            />
          )}

          {error && (
            <p role="alert" className={styles.alert}>
              {error}
            </p>
          )}

          {canManage && (
            <div className={styles.actions}>
              <button
                type="button"
                className={`${styles.actionBranch} ${styles.action} ${managing ? styles.actionManageActive : ""}`}
                disabled={saving || deleting}
                onClick={() => {
                  setManaging((value) => !value);
                  setEditingId(null);
                  setError(null);
                }}
              >
                {managing ? (
                  <Check size={14} aria-hidden="true" />
                ) : (
                  <Bolt size={14} aria-hidden="true" />
                )}
                {managing ? t("branches.doneManaging") : t("branches.manage")}
              </button>
              <button
                type="button"
                className={`${styles.actionBranchCreate} ${styles.action}`}
                disabled={saving || deleting}
                onClick={() => {
                  setCreating(true);
                  setError(null);
                }}
              >
                <Plus size={14} aria-hidden="true" />
                {t("branches.create")}
              </button>
            </div>
          )}
        </div>
      )}

      {pendingDelete &&
        createPortal(
          <ConfirmDialog
            title={t("branches.deleteTitle")}
            message={t("branches.deleteMessage", { name: pendingDelete.nome })}
            onConfirm={confirmDelete}
            onCancel={() => {
              if (!deleting) setPendingDelete(null);
            }}
            busy={deleting}
          />,
          document.body,
        )}
    </div>
  );
};

export default BranchSelector;
