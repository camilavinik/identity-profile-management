import { Check, Copy } from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '../../auth';

export function CopyUserId() {
  const { userId } = useAuth();
  const [copied, setCopied] = useState(false);

  if (!userId) return null;

  const handleCopy = async () => {
    await navigator.clipboard.writeText(userId);

    // Show the copied state for 1.2 seconds
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  };

  return (
    <button
      type="button"
      disabled={copied}
      onClick={handleCopy}
      className={`text-xs flex items-center gap-1 ${
        copied
          ? 'cursor-default'
          : 'text-gray-500 hover:text-base-content hover:link'
      }`}
    >
      {copied ? <Check className="size-3" /> : <Copy className="size-3" />}
      {copied ? 'Copied to clipboard' : 'Copy my ID for sharing'}
    </button>
  );
}
