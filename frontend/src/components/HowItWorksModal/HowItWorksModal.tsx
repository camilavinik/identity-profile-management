import { PlusIcon } from 'lucide-react';
import { Modal } from '../Modal/Modal';

export function HowItWorksModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  return (
    <Modal open={open} onClose={onClose} title="How it works">
      <div className="flex flex-col gap-4 text-sm mt-2">
        <div className="flex flex-col gap-2">
          <p>Store and manage the names you use in different situations.</p>
          <p>
            Other services and users can look them up by your ID or email and
            filter by context when they need the right name for you. They do not
            have to guess, store or maintain their own version of your name.
          </p>
        </div>

        <section className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <h3 className="text-lg font-bold">How we store names</h3>
            <p>
              Each name has a <b>context</b> for where it is used, a{' '}
              <b>charset</b> for the alphabet or characters it is written in, an
              optional <b>written value</b>, and optional{' '}
              <b>audio for pronunciation</b>.
            </p>
            <p>
              When you change a name, the previous version is kept in{' '}
              <b>History</b>.
            </p>
          </div>
        </section>

        <section className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <h3 className="text-lg font-bold">Get started</h3>
            <p>
              Add your first name with the{' '}
              <b>
                <PlusIcon className="size-4 inline-block mb-0.5" /> Add Name
              </b>{' '}
              button.
            </p>
          </div>
        </section>
      </div>

      <div className="modal-action">
        <button
          type="button"
          className="btn btn-neutral shadow-none"
          onClick={onClose}
        >
          Got it
        </button>
      </div>
    </Modal>
  );
}
