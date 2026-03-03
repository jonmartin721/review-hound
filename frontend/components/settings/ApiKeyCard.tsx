'use client';

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/Button';
import type { ApiKeyInfo } from '@/lib/storage/types';

interface ApiKeyCardProps {
  provider: string;
  label: string;
  description: string;
  helpUrl: string;
  helpLinkText: string;
  keyInfo: ApiKeyInfo | null;
  onSave: (key: string) => Promise<void>;
  onDelete: () => Promise<void>;
  onToggle: () => Promise<void>;
}

export function ApiKeyCard({
  provider,
  label,
  description,
  helpUrl,
  helpLinkText,
  keyInfo,
  onSave,
  onDelete,
  onToggle,
}: ApiKeyCardProps) {
  const [editing, setEditing] = useState(false);
  const [newKey, setNewKey] = useState('');
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const editInputRef = useRef<HTMLInputElement>(null);
  const addInputRef = useRef<HTMLInputElement>(null);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    const key = editing ? newKey : (addInputRef.current?.value ?? '');
    if (!key.trim()) return;
    setSaving(true);
    try {
      await onSave(key.trim());
      setNewKey('');
      setEditing(false);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!confirm('Are you sure you want to delete this API key?')) return;
    setDeleting(true);
    try {
      await onDelete();
    } finally {
      setDeleting(false);
    }
  }

  function handleShowEdit() {
    setNewKey('');
    setEditing(true);
    // focus after state update
    setTimeout(() => editInputRef.current?.focus(), 0);
  }

  function handleCancelEdit() {
    setEditing(false);
    setNewKey('');
  }

  return (
    <div>
      {/* Header row */}
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="font-medium text-[var(--text-primary)]">{label}</h3>
          <p className="text-sm text-[var(--text-muted)]">{description}</p>
        </div>

        {keyInfo && (
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              className="sr-only peer"
              checked={keyInfo.enabled}
              onChange={onToggle}
            />
            <div className="w-11 h-6 bg-[var(--border-bright)] peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-[var(--accent)]/30 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-[var(--border)] after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[var(--accent)]" />
          </label>
        )}
      </div>

      {/* Key display / add form */}
      {!editing && (
        <>
          {keyInfo ? (
            <div className="flex items-center gap-3">
              <div className="flex-1 bg-[var(--bg-elevated)] rounded-none px-3 py-2 font-[family-name:var(--font-mono)] text-sm text-[var(--text-secondary)] truncate">
                {keyInfo.key_preview}
              </div>
              <button
                onClick={handleShowEdit}
                className="text-[var(--accent)] hover:brightness-110 text-sm shrink-0"
              >
                Edit
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="text-[var(--negative)] hover:brightness-110 text-sm shrink-0 disabled:opacity-50"
              >
                {deleting ? 'Deleting…' : 'Delete'}
              </button>
            </div>
          ) : (
            <form onSubmit={handleSave} className="flex gap-3">
              <input
                ref={addInputRef}
                type="text"
                placeholder={`Enter ${label} key`}
                className="flex-1 border border-[var(--border)] bg-[var(--bg-surface)] text-[var(--text-primary)] rounded-none px-3 py-2.5 placeholder-[var(--text-muted)]"
              />
              <Button type="submit" loading={saving}>
                Save
              </Button>
            </form>
          )}
        </>
      )}

      {/* Edit form */}
      {editing && (
        <form onSubmit={handleSave} className="flex gap-3">
          <input
            ref={editInputRef}
            type="text"
            value={newKey}
            onChange={(e) => setNewKey(e.target.value)}
            placeholder="Enter new API key"
            className="flex-1 border border-[var(--border)] bg-[var(--bg-surface)] text-[var(--text-primary)] rounded-none px-3 py-2.5 placeholder-[var(--text-muted)]"
          />
          <Button type="submit" loading={saving}>
            Save
          </Button>
          <Button type="button" variant="secondary" onClick={handleCancelEdit}>
            Cancel
          </Button>
        </form>
      )}

      {/* Help link */}
      <p className="text-xs text-[var(--text-muted)] mt-2">
        <a
          href={helpUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[var(--accent)] hover:underline"
        >
          {helpLinkText}
        </a>
      </p>
    </div>
  );
}
