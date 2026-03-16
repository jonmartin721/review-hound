'use client';

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from '@/components/ui/alert-dialog';
import type { ApiKeyInfo } from '@/lib/storage/types';

interface ApiKeyCardProps {
  label: string;
  description: string;
  helpUrl: string;
  helpLinkText: string;
  keyInfo: ApiKeyInfo | null;
  onSave: (key: string) => Promise<void>;
  onDelete: () => Promise<void>;
  onToggle: () => Promise<void>;
  inputType?: 'text' | 'email' | 'password';
  placeholder?: string;
}

export function ApiKeyCard({
  label,
  description,
  helpUrl,
  helpLinkText,
  keyInfo,
  onSave,
  onDelete,
  onToggle,
  inputType = 'text',
  placeholder,
}: ApiKeyCardProps) {
  const [editing, setEditing] = useState(false);
  const [newKey, setNewKey] = useState('');
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const editInputRef = useRef<HTMLInputElement>(null);
  const addInputRef = useRef<HTMLInputElement>(null);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    const key = editing ? newKey : (addInputRef.current?.value ?? '');
    if (!key.trim()) return;
    setSaving(true);
    setError(null);
    try {
      await onSave(key.trim());
      setNewKey('');
      setEditing(false);
    } catch (err) {
      console.error('Failed to save API key:', err);
      setError('Failed to save API key.');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    setConfirmDelete(false);
    setDeleting(true);
    setError(null);
    try {
      await onDelete();
    } catch (err) {
      console.error('Failed to delete API key:', err);
      setError('Failed to delete API key.');
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
          <h3 className="font-medium text-foreground">{label}</h3>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>

        {keyInfo && (
          <Switch
            checked={keyInfo.enabled}
            onCheckedChange={async () => {
              setError(null);
              try {
                await onToggle();
              } catch (err) {
                console.error('Failed to toggle API key:', err);
                setError('Failed to toggle API key.');
              }
            }}
          />
        )}
      </div>

      {/* Key display / add form */}
      {!editing && (
        <>
          {keyInfo ? (
            <div className="flex items-center gap-3">
              <div className="flex-1 bg-muted rounded-lg px-3 py-2 font-mono text-sm text-muted-foreground truncate">
                {keyInfo.key_preview}
              </div>
              <button
                onClick={handleShowEdit}
                className="text-primary hover:text-primary/80 transition text-sm shrink-0 cursor-pointer"
              >
                Edit
              </button>
              <button
                onClick={() => setConfirmDelete(true)}
                disabled={deleting}
                className="text-negative hover:opacity-80 transition-opacity text-sm shrink-0 disabled:opacity-50 cursor-pointer"
              >
                {deleting ? 'Deleting…' : 'Delete'}
              </button>
            </div>
          ) : (
            <form onSubmit={handleSave} className="flex gap-3">
              <Input
                ref={addInputRef}
                type={inputType}
                placeholder={placeholder ?? `Enter ${label}`}
                className="flex-1"
              />
              <Button type="submit" disabled={saving}>
                {saving ? 'Saving…' : 'Save'}
              </Button>
            </form>
          )}
        </>
      )}

      {/* Edit form */}
      {editing && (
        <form onSubmit={handleSave} className="flex gap-3">
          <Input
            ref={editInputRef}
            type={inputType}
            value={newKey}
            onChange={(e) => setNewKey(e.target.value)}
            placeholder={placeholder ?? `Enter ${label}`}
            className="flex-1"
          />
          <Button type="submit" disabled={saving}>
            {saving ? 'Saving…' : 'Save'}
          </Button>
          <Button type="button" variant="secondary" onClick={handleCancelEdit}>
            Cancel
          </Button>
        </form>
      )}

      {error && <p className="text-xs text-negative mt-2">{error}</p>}

      {/* Help link */}
      <p className="text-xs text-muted-foreground mt-2">
        <a
          href={helpUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary hover:text-primary/80 transition"
        >
          {helpLinkText}
        </a>
      </p>

      <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {label}?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove this key. You can always add a new one later.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} variant="destructive">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
