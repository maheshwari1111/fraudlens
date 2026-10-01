import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { getCustomer } from '../services/api';
import { formatCurrency, formatDateTime } from '../utils/format';
import { User, MapPin, Smartphone, Clock } from 'lucide-react';
import PageTransition from '../components/PageTransition';
import AnimatedCard from '../components/AnimatedCard';

export default function CustomerDetail() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    getCustomer(id)
      .then((res) => setData(res.data))
      .catch((err) => setError(err.message));
  }, [id]);

  if (error) return <div className="p-8 text-red-400">Error: {error}</div>;
  if (!data) return <div className="p-8 text-surface-400">Loading…</div>;

  const { customer, transactions } = data;

  return (
    <PageTransition>
      <div className="p-8">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3 mb-6"
        >
          <div className="w-12 h-12 rounded-full bg-accent-600/20 flex items-center justify-center">
            <User className="w-6 h-6 text-accent-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">{customer.name}</h1>
            <p className="text-surface-400 font-mono text-sm">{customer.customerId}</p>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <AnimatedCard delay={0} className="card">
            <p className="text-sm text-surface-400">Avg Transaction</p>
            <p className="text-xl font-bold text-white mt-1">{formatCurrency(customer.averageTransactionAmount)}</p>
          </AnimatedCard>
          <AnimatedCard delay={0.05} className="card">
            <p className="text-sm text-surface-400">Normal Range</p>
            <p className="text-xl font-bold text-white mt-1">
              {formatCurrency(customer.normalTransactionRange?.min)} – {formatCurrency(customer.normalTransactionRange?.max)}
            </p>
          </AnimatedCard>
          <AnimatedCard delay={0.1} className="card">
            <p className="text-sm text-surface-400">Account Age</p>
            <p className="text-xl font-bold text-white mt-1">{customer.accountAge} days</p>
          </AnimatedCard>
          <AnimatedCard delay={0.15} className="card">
            <p className="text-sm text-surface-400">Total Transactions</p>
            <p className="text-xl font-bold text-white mt-1">{transactions.length}</p>
          </AnimatedCard>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-8">
          <AnimatedCard delay={0.2} className="card">
            <h3 className="card-header flex items-center gap-2"><MapPin className="w-4 h-4" /> Usual Locations</h3>
            <div className="flex flex-wrap gap-2">
              {(customer.usualLocations || []).map((loc) => (
                <span key={loc} className="badge bg-surface-700 text-surface-300">{loc}</span>
              ))}
            </div>
          </AnimatedCard>
          <AnimatedCard delay={0.25} className="card">
            <h3 className="card-header flex items-center gap-2"><Smartphone className="w-4 h-4" /> Usual Devices</h3>
            <div className="flex flex-wrap gap-2">
              {(customer.usualDevices || []).map((dev) => (
                <span key={dev} className="badge bg-surface-700 text-surface-300 font-mono text-xs">{dev}</span>
              ))}
            </div>
          </AnimatedCard>
          <AnimatedCard delay={0.3} className="card">
            <h3 className="card-header flex items-center gap-2"><Clock className="w-4 h-4" /> Usual Hours</h3>
            <p className="text-sm text-surface-300">
              {(customer.usualTransactionHours || []).map((h) => `${String(h).padStart(2, '0')}:00`).join(', ')}
            </p>
          </AnimatedCard>
        </div>

        <AnimatedCard delay={0.35} className="card">
          <h3 className="card-header">Transaction History</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-surface-800">
                  <th className="table-header text-left px-4 py-3">Transaction</th>
                  <th className="table-header text-left px-4 py-3">Amount</th>
                  <th className="table-header text-left px-4 py-3">Type</th>
                  <th className="table-header text-left px-4 py-3">Location</th>
                  <th className="table-header text-left px-4 py-3">Device</th>
                  <th className="table-header text-left px-4 py-3">Status</th>
                  <th className="table-header text-left px-4 py-3">Date</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((t, i) => (
                  <motion.tr
                    key={t.transactionId}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.02 }}
                    className="border-b border-surface-800/50 hover:bg-surface-800/30"
                  >
                    <td className="table-cell font-mono text-xs text-accent-400">{t.transactionId}</td>
                    <td className="table-cell font-medium">{formatCurrency(t.amount)}</td>
                    <td className="table-cell text-xs">{t.transactionType}</td>
                    <td className="table-cell">{t.location}</td>
                    <td className="table-cell font-mono text-xs">{t.deviceId || '—'}</td>
                    <td className="table-cell">
                      <span className={`badge ${t.status === 'FLAGGED' ? 'bg-red-500/15 text-red-400' : 'bg-emerald-500/15 text-emerald-400'}`}>
                        {t.status}
                      </span>
                    </td>
                    <td className="table-cell text-xs">{formatDateTime(t.timestamp)}</td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </AnimatedCard>
      </div>
    </PageTransition>
  );
}
