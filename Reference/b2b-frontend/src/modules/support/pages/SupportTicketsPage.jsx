import { useState, useEffect } from 'react';
import { supportService } from '../services/supportService.js';
import TicketDetailPanel from '../components/TicketDetailPanel.jsx';
import EmptyState from '../../../components/ui/EmptyState.jsx';
import Button from '../../../components/ui/Button.jsx';
import Modal from '../../../components/ui/Modal.jsx';
import { LifeBuoy, Search, Plus, AlertCircle } from 'lucide-react';
import '../../admin/pages/AdminShared.css';

const STATUS_OPTIONS = ['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'];

const SupportTicketsPage = () => {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [panelOpen, setPanelOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState({ subject: '', message: '' });
  const [formError, setFormError] = useState('');

  const fetchTickets = async () => {
    setLoading(true);
    try {
      const data = await supportService.getAllTickets({ status: statusFilter || undefined, search });
      setTickets(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchTickets(); }, [statusFilter]);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchTickets();
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setFormError('');
    if (!form.subject.trim() || !form.message.trim()) {
      setFormError('Subject and message are required');
      return;
    }
    try {
      await supportService.createTicket(form);
      setCreateOpen(false);
      setForm({ subject: '', message: '' });
      fetchTickets();
    } catch (err) {
      setFormError(err.message);
    }
  };

  const handleStatusUpdate = async (id, status) => {
    await supportService.updateTicketStatus(id, status);
    fetchTickets();
    setPanelOpen(false);
  };

  return (
    <div className="admin-page-content">
      <div className="admin-page-header">
        <div className="page-title-section">
          <h1 className="page-title">Support Tickets</h1>
          <p className="page-subtitle">Manage customer support requests and track resolution</p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus size={16} className="mr-2" />
          New Ticket
        </Button>
      </div>

      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <form onSubmit={handleSearch} className="flex-1 relative">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search tickets..."
            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500/20"
          />
        </form>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2.5 border border-gray-200 rounded-xl text-sm bg-white"
        >
          <option value="">All Statuses</option>
          {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      {loading && <div className="py-12 text-center text-gray-500">Loading tickets...</div>}
      {error && (
        <div className="flex items-center gap-3 text-red-600 py-8 justify-center">
          <AlertCircle size={20} /><span>{error}</span>
        </div>
      )}

      {!loading && !error && tickets.length === 0 && (
        <EmptyState icon={LifeBuoy} title="No tickets found" description="Support tickets will appear here." />
      )}

      <div className="space-y-3">
        {tickets.map((ticket) => (
          <div
            key={ticket._id}
            className="admin-card p-5 cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => { setSelectedTicket(ticket); setPanelOpen(true); }}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="font-bold text-gray-900">{ticket.subject}</p>
                <p className="text-sm text-gray-500 mt-1">{ticket.userId?.name || 'User'}</p>
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                ticket.status === 'OPEN' ? 'bg-sky-100 text-sky-700' :
                ticket.status === 'IN_PROGRESS' ? 'bg-amber-100 text-amber-700' :
                'bg-emerald-100 text-emerald-700'
              }`}>{ticket.status}</span>
            </div>
          </div>
        ))}
      </div>

      <TicketDetailPanel
        ticket={selectedTicket}
        isOpen={panelOpen}
        onClose={() => { setPanelOpen(false); setSelectedTicket(null); }}
        onStatusUpdate={handleStatusUpdate}
      />

      <Modal isOpen={createOpen} onClose={() => setCreateOpen(false)} title="Create Support Ticket">
        <form onSubmit={handleCreate} className="p-6 space-y-4">
          {formError && <p className="text-red-600 text-sm">{formError}</p>}
          <input
            type="text"
            placeholder="Subject"
            value={form.subject}
            onChange={(e) => setForm({ ...form, subject: e.target.value })}
            className="w-full px-4 py-3 border border-gray-200 rounded-xl"
            required
          />
          <textarea
            placeholder="Describe your issue..."
            value={form.message}
            onChange={(e) => setForm({ ...form, message: e.target.value })}
            className="w-full px-4 py-3 border border-gray-200 rounded-xl h-32 resize-none"
            required
          />
          <Button type="submit" className="w-full">Submit Ticket</Button>
        </form>
      </Modal>
    </div>
  );
};

export default SupportTicketsPage;
