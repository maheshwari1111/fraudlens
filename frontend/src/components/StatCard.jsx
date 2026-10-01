export default function StatCard({ title, value, subtitle, icon: Icon, accent = 'text-accent-400' }) {
  return (
    <div className="card flex items-start justify-between">
      <div>
        <p className="text-sm text-surface-400">{title}</p>
        <p className="text-2xl font-bold text-white mt-1">{value}</p>
        {subtitle && <p className="text-xs text-surface-500 mt-1">{subtitle}</p>}
      </div>
      {Icon && (
        <div className={`w-10 h-10 rounded-lg bg-surface-800 flex items-center justify-center ${accent}`}>
          <Icon className="w-5 h-5" />
        </div>
      )}
    </div>
  );
}
