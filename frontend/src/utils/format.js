export const formatCurrency = (amount) => {
  if (amount == null) return '—';
  return `₹${Number(amount).toLocaleString('en-IN')}`;
};

export const formatDate = (date) => {
  if (!date) return '—';
  return new Date(date).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

export const formatDateTime = (date) => {
  if (!date) return '—';
  return new Date(date).toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const formatTime = (date) => {
  if (!date) return '—';
  return new Date(date).toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const riskColor = (level) => {
  switch (level) {
    case 'CRITICAL': return 'text-red-400';
    case 'HIGH': return 'text-orange-400';
    case 'MEDIUM': return 'text-amber-400';
    case 'LOW': return 'text-emerald-400';
    default: return 'text-surface-400';
  }
};

export const riskBg = (level) => {
  switch (level) {
    case 'CRITICAL': return 'bg-red-500/15 text-red-400 border-red-500/30';
    case 'HIGH': return 'bg-orange-500/15 text-orange-400 border-orange-500/30';
    case 'MEDIUM': return 'bg-amber-500/15 text-amber-400 border-amber-500/30';
    case 'LOW': return 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30';
    default: return 'bg-surface-700 text-surface-300 border-surface-600';
  }
};

export const severityColor = (severity) => {
  switch (severity) {
    case 'CRITICAL': return 'text-red-400';
    case 'HIGH': return 'text-orange-400';
    case 'MEDIUM': return 'text-amber-400';
    case 'LOW': return 'text-sky-400';
    case 'INFO': return 'text-surface-400';
    default: return 'text-surface-400';
  }
};

export const statusColor = (status) => {
  switch (status) {
    case 'AWAITING_HUMAN_REVIEW': return 'bg-amber-500/15 text-amber-400 border-amber-500/30';
    case 'IN_PROGRESS': return 'bg-sky-500/15 text-sky-400 border-sky-500/30';
    case 'CLOSED': return 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30';
    case 'ESCALATED': return 'bg-red-500/15 text-red-400 border-red-500/30';
    case 'FALSE_POSITIVE': return 'bg-surface-700 text-surface-300 border-surface-600';
    case 'PARTIAL': return 'bg-amber-500/15 text-amber-400 border-amber-500/30';
    default: return 'bg-surface-700 text-surface-300 border-surface-600';
  }
};
