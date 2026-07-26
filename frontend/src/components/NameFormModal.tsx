import { Languages, Signature, Tag } from 'lucide-react';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { useNames, type Context } from '../hooks';
import { ErrorAlert } from './ErrorAlert';
import { Modal } from './Modal';

export type NameFormData = {
  context: string;
  charset: string;
  value: string;
  audioFile: File | null;
  removeAudio: boolean;
};

const EMPTY_FORM: NameFormData = {
  context: '',
  charset: '',
  value: '',
  audioFile: null,
  removeAudio: false,
};

type Props = {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: NameFormData) => Promise<void>;
  initialValues?: Partial<NameFormData>;
  currentAudioUrl?: string | null;
  title?: string;
  submitLabel?: string;
};

export function NameFormModal({
  open,
  onClose,
  onSubmit,
  initialValues,
  currentAudioUrl,
  title = 'Add name',
  submitLabel = 'Add',
}: Props) {
  const hasAudio = !!currentAudioUrl;
  const { fetchContexts } = useNames();
  const [contexts, setContexts] = useState<Context[]>([]);
  const initialForm: NameFormData = { ...EMPTY_FORM, ...initialValues };
  const [form, setForm] = useState<NameFormData>(initialForm);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchContexts()
      .then(setContexts)
      .catch(() => {
        // If fetching contexts fails, submission will fail with a validation error
      });
  }, [fetchContexts]);

  // Shows placeholder audio file if it exists and the user have not selected a new one
  useEffect(() => {
    const input = fileInputRef.current;
    if (!input || form.audioFile) return;

    if (currentAudioUrl && !form.removeAudio) {
      const dt = new DataTransfer();
      dt.items.add(new File([], currentAudioUrl, { type: 'audio/mpeg' }));
      input.files = dt.files;
    } else {
      input.value = '';
    }
  }, [currentAudioUrl, form.audioFile, form.removeAudio]);

  const updateForm = <K extends keyof NameFormData>(
    key: K,
    value: NameFormData[K],
  ) => setForm((f) => ({ ...f, [key]: value }));

  const handleClose = () => {
    setForm(initialForm);
    setError(null);
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setError(null);
    setSubmitting(true);

    try {
      await onSubmit(form);
      handleClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setSubmitting(false);
    }
  };

  const trimmedCharset = form.charset.trim();
  const isValid =
    form.context !== '' &&
    trimmedCharset.length >= 1 &&
    trimmedCharset.length <= 25;

  const hasChanges =
    form.context !== initialForm.context ||
    form.charset !== initialForm.charset ||
    form.value !== initialForm.value ||
    form.audioFile !== initialForm.audioFile ||
    form.removeAudio !== initialForm.removeAudio;

  return (
    <Modal open={open} onClose={handleClose} title={title}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-3 mt-4">
        <Field label="Context">
          <label className="select w-full">
            <Tag className="size-4 opacity-50 mr-0.5" />
            <select
              value={form.context}
              onChange={(e) => updateForm('context', e.target.value)}
              required
            >
              <option value="" disabled>
                Pick a context
              </option>
              {contexts.map((ctx) => (
                <option key={ctx.key} value={ctx.key}>
                  {ctx.name}
                </option>
              ))}
            </select>
          </label>
        </Field>

        <Field label="Charset">
          <label className="input w-full">
            <Languages className="size-4 opacity-50" />
            <input
              type="text"
              placeholder="latin, hebrew, arabic…"
              value={form.charset}
              onChange={(e) => updateForm('charset', e.target.value)}
              required
              minLength={1}
              maxLength={25}
            />
          </label>
        </Field>

        <Field label="Value" optional>
          <label className="input w-full">
            <Signature className="size-4 opacity-50" />
            <input
              type="text"
              value={form.value}
              onChange={(e) => updateForm('value', e.target.value)}
            />
          </label>
        </Field>

        <Field label="Audio" optional>
          <input
            ref={fileInputRef}
            type="file"
            accept="audio/*"
            className="file-input w-full"
            disabled={form.removeAudio}
            onChange={(e) =>
              updateForm('audioFile', e.target.files?.[0] ?? null)
            }
          />
          {hasAudio && (
            <label className="label cursor-pointer justify-start gap-2 mt-1">
              <input
                type="checkbox"
                className="checkbox checkbox-sm"
                checked={form.removeAudio}
                onChange={(e) => {
                  const checked = e.target.checked;

                  // Clear file input
                  if (checked && fileInputRef.current) {
                    fileInputRef.current.value = '';
                  }

                  setForm((f) => ({
                    ...f,
                    removeAudio: checked,
                    audioFile: checked ? null : f.audioFile,
                  }));
                }}
              />
              <span className="label-text">Remove existing audio</span>
            </label>
          )}
        </Field>

        {error && <ErrorAlert content={error} />}

        <div className="modal-action">
          <button
            type="button"
            className="btn btn-ghost shadow-none"
            onClick={handleClose}
            disabled={submitting}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="btn btn-neutral shadow-none"
            disabled={submitting || !isValid || !hasChanges}
          >
            {submitting && <span className="loading loading-spinner" />}
            {submitLabel}
          </button>
        </div>
      </form>
    </Modal>
  );
}

function Field({
  label,
  optional,
  children,
}: {
  label: string;
  optional?: boolean;
  children: ReactNode;
}) {
  return (
    <fieldset className="fieldset">
      <legend className="fieldset-legend">{label}</legend>
      {children}
      {optional && <p className="label">Optional</p>}
    </fieldset>
  );
}
