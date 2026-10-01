import { motion } from 'framer-motion';
import { Inbox } from 'lucide-react';

export default function EmptyState({ title, description, icon: Icon = Inbox }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center py-12 text-center"
    >
      <div className="w-16 h-16 rounded-full bg-surface-800 flex items-center justify-center mb-4">
        <Icon className="w-8 h-8 text-surface-500" />
      </div>
      <h3 className="text-lg font-semibold text-surface-300 mb-1">{title}</h3>
      <p className="text-sm text-surface-500 max-w-sm">{description}</p>
    </motion.div>
  );
}
