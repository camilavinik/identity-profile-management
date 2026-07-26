import { useEffect, useState, type ReactNode } from 'react';
import { useNames, type Context } from '../hooks';
import { ErrorAlert } from './ErrorAlert';
import { Modal } from './Modal';

export type NameFormData = {
  context: string;
  charset: string;
  value: string;
  audioFile: File | null;
};

const EMPTY_FORM: NameFormData = {
  context: '',
  charset: '',
  value: '',
  audioFile: null,
};

type Props = {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: NameFormData) => Promise<void>;
  initialValues?: Partial<NameFormData>;
  title?: string;
  submitLabel?: string;
};

export function NameFormModal({
  open,
  onClose,
  onSubmit,
  initialValues,
  title = 'Add name',
  submitLabel = 'Add',
}: Props) {
  const { fetchContexts } = useNames();
  const [contexts, setContexts] = useState<Context[]>([]);
  const [form, setForm] = useState<NameFormData>({
    ...EMPTY_FORM,
    ...initialValues,
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchContexts()
      .then(setContexts)
      .catch(() => {
        // If fetching contexts fails, submission will fail with a validation error
      });
  }, [fetchContexts]);

  const updateForm = <K extends keyof NameFormData>(
    key: K,
    value: NameFormData[K],
  ) => setForm((f) => ({ ...f, [key]: value }));

  const handleClose = () => {
    setForm({ ...EMPTY_FORM, ...initialValues });
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

  return (
    <Modal open={open} onClose={handleClose} title={title}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-3 mt-4">
        <Field label="Context">
          <select
            className="select w-full"
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
        </Field>

        <Field label="Charset">
          <input
            type="text"
            className="input w-full"
            placeholder="latin, hebrew, arabic…"
            value={form.charset}
            onChange={(e) => updateForm('charset', e.target.value)}
            required
            minLength={1}
            maxLength={25}
          />
        </Field>

        <Field label="Value" optional>
          <input
            type="text"
            className="input w-full"
            value={form.value}
            onChange={(e) => updateForm('value', e.target.value)}
          />
        </Field>

        <Field label="Audio" optional>
          <input
            type="file"
            accept="audio/*"
            className="file-input w-full"
            onChange={(e) =>
              updateForm('audioFile', e.target.files?.[0] ?? null)
            }
          />
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
            disabled={submitting}
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
