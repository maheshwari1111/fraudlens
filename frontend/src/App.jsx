import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Alerts from './pages/Alerts';
import Cases from './pages/Cases';
import CaseDetail from './pages/CaseDetail';
import CustomerDetail from './pages/CustomerDetail';
import Reports from './pages/Reports';

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/alerts" element={<Alerts />} />
        <Route path="/cases" element={<Cases />} />
        <Route path="/cases/:id" element={<CaseDetail />} />
        <Route path="/customers/:id" element={<CustomerDetail />} />
        <Route path="/reports" element={<Reports />} />
      </Route>
    </Routes>
  );
}
