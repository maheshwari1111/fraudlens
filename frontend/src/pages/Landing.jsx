import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Shield, ArrowRight, Brain, Network, AlertTriangle,
  CheckCircle, Users, FileText, Lock,
} from 'lucide-react';
import { useEffect, useState } from 'react';

const features = [
  {
    icon: Brain,
    title: 'Multi-Agent Investigation',
    description: '9 specialized agents analyze transactions, behaviour, devices, locations, and relationships simultaneously.',
  },
  {
    icon: Network,
    title: '3D Relationship Graph',
    description: 'Interactive Three.js visualization of entity connections — customers, devices, locations, alerts.',
  },
  {
    icon: AlertTriangle,
    title: 'Evidence-First Approach',
    description: 'Every finding has a traceable evidence ID. The LLM explains — it never invents facts.',
  },
  {
    icon: CheckCircle,
    title: 'Deterministic Risk Engine',
    description: 'Configurable risk weights produce reproducible scores. No black-box ML decisions.',
  },
  {
    icon: Users,
    title: 'Human-in-the-Loop',
    description: 'HIGH/CRITICAL cases require explicit human decisions. Every action is audit-logged.',
  },
  {
    icon: FileText,
    title: 'Investigation Reports',
    description: 'Generate comprehensive reports with executive summary, findings, evidence, and recommendations.',
  },
];

const stats = [
  { label: 'Agents', value: '9' },
  { label: 'Evidence Types', value: '15+' },
  { label: 'Risk Factors', value: '6' },
  { label: 'Data Points', value: '60+' },
];

export default function Landing() {
  const [demoMode, setDemoMode] = useState(true);

  useEffect(() => {
    fetch('/api/health')
      .then((r) => r.json())
      .then((d) => setDemoMode(d.demoMode))
      .catch(() => {});
  }, []);

  return (
    <div className="min-h-screen bg-surface-950">
      {/* Hero */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-accent-600/5 via-transparent to-purple-600/5" />
        <div className="relative max-w-6xl mx-auto px-8 py-20">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            <div className="flex items-center justify-center gap-3 mb-6">
              <div className="w-14 h-14 rounded-2xl bg-accent-600 flex items-center justify-center">
                <Shield className="w-8 h-8 text-white" />
              </div>
            </div>
            <h1 className="text-5xl font-extrabold text-white mb-4 tracking-tight">
              FraudLens
            </h1>
            <p className="text-xl text-surface-400 mb-2">
              AI Fraud Investigation Agent
            </p>
            <p className="text-surface-500 max-w-2xl mx-auto mb-8">
              A multi-agent investigation platform that correlates transactions, customer behaviour,
              device intelligence, and previous alerts — producing evidence-backed investigation reports
              with deterministic risk scoring.
            </p>
            <div className="flex items-center justify-center gap-4">
              <Link to="/dashboard" className="btn-primary text-base px-6 py-3">
                Open Dashboard
                <ArrowRight className="w-5 h-5" />
              </Link>
              <Link to="/cases/CASE-1042" className="btn-secondary text-base px-6 py-3">
                View Demo Case
              </Link>
            </div>
            <div className="flex items-center justify-center gap-2 mt-4">
              <Lock className="w-3.5 h-3.5 text-surface-500" />
              <span className="text-xs text-surface-500">
                {demoMode ? 'DEMO_MODE — synthetic data, no API key required' : 'LLM-powered investigation'}
              </span>
            </div>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.6 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-16"
          >
            {stats.map((s) => (
              <div key={s.label} className="card text-center">
                <p className="text-3xl font-bold text-white">{s.value}</p>
                <p className="text-sm text-surface-400">{s.label}</p>
              </div>
            ))}
          </motion.div>
        </div>
      </div>

      {/* Features */}
      <div className="max-w-6xl mx-auto px-8 py-16">
        <motion.h2
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-3xl font-bold text-white text-center mb-12"
        >
          Investigation Pipeline
        </motion.h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="card hover:border-surface-700 transition-colors"
            >
              <div className="w-10 h-10 rounded-lg bg-accent-600/10 flex items-center justify-center mb-4">
                <f.icon className="w-5 h-5 text-accent-400" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">{f.title}</h3>
              <p className="text-sm text-surface-400">{f.description}</p>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Architecture */}
      <div className="max-w-6xl mx-auto px-8 py-16">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="card"
        >
          <h2 className="text-2xl font-bold text-white mb-6 text-center">How It Works</h2>
          <div className="flex flex-wrap items-center justify-center gap-2 text-sm">
            {['Transaction', 'Alert', 'Supervisor', 'Analysis Agents', 'Evidence', 'Risk Engine', 'Human Review', 'Report'].map((step, i) => (
              <div key={step} className="flex items-center gap-2">
                <span className="px-3 py-1.5 rounded-lg bg-surface-800 text-surface-200 border border-surface-700">
                  {step}
                </span>
                {i < 7 && <ArrowRight className="w-4 h-4 text-surface-600" />}
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Footer */}
      <div className="border-t border-surface-800 py-8">
        <div className="max-w-6xl mx-auto px-8 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-accent-400" />
            <span className="text-sm text-surface-400">FraudLens — AI Fraud Investigation Agent</span>
          </div>
          <p className="text-xs text-surface-600">Synthetic demo data • No real banking information</p>
        </div>
      </div>
    </div>
  );
}
