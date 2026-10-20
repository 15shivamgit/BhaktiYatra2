'use client';

import { ArrowDown, ArrowUp, Star, Trash2, Upload } from 'lucide-react';
import Image from 'next/image';
import { useRef, useState } from 'react';
import { toast } from 'sonner';
import Alert from '@/components/ui/Alert';
import Button from '@/components/ui/Button';
import { inputClasses } from '@/components/ui/FormField';
import { apiFetch, apiUpload } from '@/lib/api/client';
import { errorMessage } from '@/lib/api/messages';
import { t } from '@/lib/i18n';

/**
 * Upload, describe, order and remove a temple's photos (FR-ADMINCONTENT-02). Uploads go
 * straight to the API; alt/order/primary edits are saved together with "Save photo details".
 * @param {{ templeId: string, images: any[], maxImages: number, onChange: (images: any[]) => void }} props
 */
export default function ImageManager({ templeId, images, maxImages, onChange }) {
  const [draft, setDraft] = useState(images);
  const [lastSynced, setLastSynced] = useState(images);
  const [pending, setPending] = useState([]); // [{ file, alt, preview }]
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const fileInput = useRef(null);

  // Adopt new server data (after upload/delete) while keeping unsaved edits otherwise.
  if (images !== lastSynced) {
    setLastSynced(images);
    setDraft(images);
  }

  const dirty = JSON.stringify(draft) !== JSON.stringify(images);
  const remaining = maxImages - images.length;

  const choose = (event) => {
    const files = [...(event.target.files ?? [])].slice(0, Math.max(0, remaining));
    setPending(files.map((file) => ({ file, alt: '', preview: URL.createObjectURL(file) })));
    event.target.value = '';
  };

  const upload = async () => {
    setBusy(true);
    setError(null);
    const form = new FormData();
    for (const item of pending) form.append('files', item.file);
    form.append('alts', JSON.stringify(pending.map((item) => item.alt)));
    try {
      const body = await apiUpload(`/admin/temples/${templeId}/images`, form);
      const failed = body.meta?.failed ?? [];
      toast.success(t('adminContent.uploaded', { count: pending.length - failed.length }));
      if (failed.length)
        setError(t('adminContent.uploadFailed', { names: failed.map((f) => f.name).join(', ') }));
      pending.forEach((item) => URL.revokeObjectURL(item.preview));
      setPending([]);
      onChange(body.data);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const update = (index, patch) =>
    setDraft((list) => list.map((img, i) => (i === index ? { ...img, ...patch } : img)));
  const move = (index, delta) =>
    setDraft((list) => {
      const next = [...list];
      const [item] = next.splice(index, 1);
      next.splice(index + delta, 0, item);
      return next.map((img, i) => ({ ...img, order: i }));
    });
  const makePrimary = (index) =>
    setDraft((list) => list.map((img, i) => ({ ...img, isPrimary: i === index })));

  const saveDetails = async () => {
    setBusy(true);
    setError(null);
    try {
      const body = await apiFetch(`/admin/temples/${templeId}/images`, {
        method: 'PATCH',
        body: {
          images: draft.map((img, i) => ({
            publicId: img.publicId,
            alt: img.alt,
            order: i,
            isPrimary: img.isPrimary,
          })),
        },
      });
      toast.success(t('adminContent.saved'));
      onChange(body.data);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const remove = async (image) => {
    if (!window.confirm(t('adminContent.confirmDelete'))) return;
    setBusy(true);
    setError(null);
    try {
      await apiFetch(
        `/admin/temples/${templeId}/images?publicId=${encodeURIComponent(image.publicId)}`,
        { method: 'DELETE' },
      );
      onChange(images.filter((img) => img.publicId !== image.publicId));
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-6">
      {error && <Alert tone="danger">{error}</Alert>}

      {draft.length > 0 && (
        <ul className="grid gap-4 sm:grid-cols-2">
          {draft.map((image, index) => (
            <li key={image.publicId} className="rounded-md border border-border bg-surface p-3">
              <div className="relative aspect-[3/2] overflow-hidden rounded-sm bg-surface-muted">
                <Image
                  src={image.url}
                  alt={image.alt || ''}
                  fill
                  sizes="320px"
                  className="object-cover"
                />
                {image.isPrimary && (
                  <span className="absolute left-2 top-2 rounded-sm bg-accent px-2 py-0.5 text-xs font-medium text-white">
                    {t('adminContent.primary')}
                  </span>
                )}
              </div>
              <label htmlFor={`alt-${index}`} className="mt-3 block text-sm font-medium text-text">
                {t('adminContent.altText')}
              </label>
              <input
                id={`alt-${index}`}
                value={image.alt ?? ''}
                maxLength={200}
                onChange={(event) => update(index, { alt: event.target.value })}
                className={`${inputClasses(!image.alt?.trim())} mt-1`}
              />
              <div className="mt-3 flex flex-wrap gap-2">
                {!image.isPrimary && (
                  <Button size="sm" variant="ghost" onClick={() => makePrimary(index)}>
                    <Star aria-hidden="true" className="size-4" />
                    {t('adminContent.makePrimary')}
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="ghost"
                  disabled={index === 0}
                  onClick={() => move(index, -1)}
                  aria-label={t('adminContent.moveUp')}
                >
                  <ArrowUp aria-hidden="true" className="size-4" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  disabled={index === draft.length - 1}
                  onClick={() => move(index, 1)}
                  aria-label={t('adminContent.moveDown')}
                >
                  <ArrowDown aria-hidden="true" className="size-4" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="ml-auto text-danger"
                  onClick={() => remove(image)}
                  aria-label={`${t('adminContent.remove')} ${index + 1}`}
                >
                  <Trash2 aria-hidden="true" className="size-4" />
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
      {dirty && (
        <Button onClick={saveDetails} loading={busy} loadingText={t('adminContent.saving')}>
          {t('adminContent.saveImages')}
        </Button>
      )}

      {remaining > 0 && (
        <div className="rounded-md border border-dashed border-border bg-surface p-4">
          <p className="font-medium text-text">{t('adminContent.uploadImages')}</p>
          <p className="mt-1 text-sm text-text-muted">{t('adminContent.uploadHint')}</p>
          <input
            ref={fileInput}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            multiple
            onChange={choose}
            className="sr-only"
            id="temple-image-input"
          />
          <label
            htmlFor="temple-image-input"
            className="mt-3 inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-md border border-accent px-4 text-sm font-medium text-accent hover:bg-accent-soft"
          >
            <Upload aria-hidden="true" className="size-4" />
            {t('adminContent.chooseFiles')}
          </label>
          {pending.length > 0 && (
            <div className="mt-4 space-y-3">
              {pending.map((item, index) => (
                <div key={item.preview} className="flex items-center gap-3">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={item.preview} alt="" className="size-14 rounded-sm object-cover" />
                  <div className="flex-1">
                    <label htmlFor={`pending-alt-${index}`} className="sr-only">
                      {t('adminContent.altText')} {item.file.name}
                    </label>
                    <input
                      id={`pending-alt-${index}`}
                      placeholder={`${t('adminContent.altText')}: ${item.file.name}`}
                      value={item.alt}
                      onChange={(event) =>
                        setPending((list) =>
                          list.map((p, i) => (i === index ? { ...p, alt: event.target.value } : p)),
                        )
                      }
                      className={inputClasses(false)}
                    />
                  </div>
                </div>
              ))}
              <Button onClick={upload} loading={busy} loadingText={t('adminContent.saving')}>
                {t('adminContent.uploadImages')}
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
