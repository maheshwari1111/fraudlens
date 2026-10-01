import { riskBg } from '../utils/format';

export default function RiskBadge({ level, size = 'md' }) {
  const sizeClass = size === 'lg' ? 'px-3 py-1 text-sm' : 'px-2.5 py-0.5 text-xs';
  return (
    <span className={`badge border ${riskBg(level)} ${sizeClass}`}>
      {level}
    </span>
  );
}
