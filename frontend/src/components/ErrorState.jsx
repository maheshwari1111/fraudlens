import { AlertTriangle, RefreshCw, WifiOff } from 'lucide-react';

/** Consistent failure state for any panel, with an optional retry. */
export default function ErrorState({ error, onRetry, title = 'Unable to load data', compact = false }) {
  const offline = typeof error === 'string' && /cannot reach|network|fetch/i.test(error);
  const Icon = offline ? WifiOff : AlertTriangle;
  return (
    <div className={`flex flex-col items-center justify-center text-center ${compact ? 'py-6' : 'py-10'} px-6`}>
      <div className="w-11 h-11 rounded-xl bg-red-500/10 border border-red-500/30 flex items-center justify-center mb-3">
        <Icon className="w-5 h-5 text-red-400" />
      </div>
      <p className="text-sm font-semibold text-white">{title}</p>
      <p className="text-xs text-surface-400 mt-1 max-w-sm leading-relaxed">
        {typeof error === 'string' ? error : error?.message || 'Unexpected error.'}
      </p>
      {onRetry && (
        <button onClick={onRetry} className="btn-secondary mt-4 py-1.5 px-3 text-xs">
          <RefreshCw className="w-3.5 h-3.5" />
          Retry
        </button>
      )}
    </div>
  );
}
