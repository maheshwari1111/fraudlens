import { statusColor } from '../utils/format';

export default function StatusBadge({ status }) {
  return (
    <span className={`badge border ${statusColor(status)}`}>
      {status?.replace(/_/g, ' ')}
    </span>
  );
}
