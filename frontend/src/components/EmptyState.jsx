import { motion } from 'framer-motion';
import { Inbox } from 'lucide-react';

export default function EmptyState({ title, description, icon: Icon = Inbox, action, compact = false }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex flex-col items-center justify-center text-center ${compact ? 'py-8' : 'py-12'} px-6`}
    >
      <div className="w-12 h-12 rounded-2xl bg-surface-800/80 border border-surface-800 flex items-center justify-center mb-3">
        <Icon className="w-5 h-5 text-surface-500" />
      </div>
      <p className="text-sm font-semibold text-surface-300">{title}</p>
      {description && <p className="text-xs text-surface-500 mt-1 max-w-sm leading-relaxed">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </motion.div>
  );
}
