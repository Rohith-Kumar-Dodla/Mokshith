import React, { useCallback, useEffect, useState } from 'react';
import { FiSearch, FiSend } from 'react-icons/fi';
import supportService from '../../services/supportService';
import Card from '../../components/admin/Card';
import StatusBadge from '../../components/admin/StatusBadge';
import useDebouncedValue from '../../hooks/useDebouncedValue';

const STATUS_OPTIONS = [
  { value: 'all', label: 'All Status' },
  { value: 'OPEN', label: 'Open' },
  { value: 'IN_PROGRESS', label: 'In Progress' },
  { value: 'WAITING_FOR_VENDOR', label: 'Waiting For Vendor' },
  { value: 'RESOLVED', label: 'Resolved' },
  { value: 'CLOSED', label: 'Closed' },
];

const PRIORITY_OPTIONS = [
  { value: 'all', label: 'All Priority' },
  { value: 'LOW', label: 'Low' },
  { value: 'MEDIUM', label: 'Medium' },
  { value: 'HIGH', label: 'High' },
  { value: 'URGENT', label: 'Urgent' },
];

const AdminSupport = () => {
  const [tickets, setTickets] = useState([]);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [searchInput, setSearchInput] = useState('');
  const debouncedSearch = useDebouncedValue(searchInput, 300);
  const [status, setStatus] = useState('all');
  const [priority, setPriority] = useState('all');
  const [reply, setReply] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');

  const loadTickets = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await supportService.getAllTickets({
        search: debouncedSearch || undefined,
        status,
        priority,
        limit: 50,
      });
      setTickets(data?.tickets || []);
    } catch (loadError) {
      setError(loadError?.response?.data?.message || loadError.message || 'Failed to load tickets');
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, status, priority]);

  useEffect(() => {
    loadTickets();
  }, [loadTickets]);

  const openTicket = async (ticketId) => {
    try {
      const ticket = await supportService.getTicketById(ticketId);
      setSelectedTicket(ticket);
      setReply('');
    } catch (openError) {
      setError(openError?.response?.data?.message || openError.message || 'Failed to open ticket');
    }
  };

  const handleReply = async (event) => {
    event.preventDefault();
    if (!selectedTicket?._id || !reply.trim()) return;
    setSending(true);
    setError('');
    try {
      const updated = await supportService.replyToTicket(selectedTicket._id, { message: reply.trim() });
      setSelectedTicket(updated);
      setReply('');
      await loadTickets();
    } catch (replyError) {
      setError(replyError?.response?.data?.message || replyError.message || 'Failed to send reply');
    } finally {
      setSending(false);
    }
  };

  const handleStatusChange = async (nextStatus) => {
    if (!selectedTicket?._id) return;
    try {
      const updated = await supportService.updateTicketStatus(selectedTicket._id, { status: nextStatus });
      setSelectedTicket(updated);
      await loadTickets();
    } catch (statusError) {
      setError(statusError?.response?.data?.message || statusError.message || 'Failed to update status');
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Support</h1>
        <p className="text-sm text-gray-500 mt-1">Manage vendor support tickets</p>
      </div>

      {error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      ) : null}

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        <Card className="lg:col-span-2 p-4 space-y-3">
          <div className="relative">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search vendor / ticket"
              className="w-full pl-9 pr-3 py-2.5 border border-gray-300 rounded-lg text-sm min-h-[44px]"
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="border border-gray-300 rounded-lg px-2 py-2 text-sm min-h-[44px]"
            >
              {STATUS_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
              className="border border-gray-300 rounded-lg px-2 py-2 text-sm min-h-[44px]"
            >
              {PRIORITY_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </div>

          {loading ? (
            <p className="text-sm text-gray-500">Loading tickets...</p>
          ) : tickets.length === 0 ? (
            <p className="text-sm text-gray-500">No tickets found.</p>
          ) : (
            <div className="space-y-2 max-h-[70vh] overflow-y-auto">
              {tickets.map((ticket) => (
                <button
                  key={ticket._id}
                  type="button"
                  onClick={() => openTicket(ticket._id)}
                  className={`w-full text-left rounded-lg border px-3 py-3 ${
                    selectedTicket?._id === ticket._id ? 'border-blue-400 bg-blue-50' : 'border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {ticket.userId?.businessName || ticket.userId?.name || 'Vendor'}
                      </p>
                      <p className="text-xs text-gray-500 truncate">{ticket.subject}</p>
                      <p className="text-[11px] text-gray-400 mt-1">
                        {ticket.createdAt ? new Date(ticket.createdAt).toLocaleString('en-IN') : ''}
                      </p>
                    </div>
                    <StatusBadge status={String(ticket.status || '').toLowerCase()} />
                  </div>
                </button>
              ))}
            </div>
          )}
        </Card>

        <Card className="lg:col-span-3 p-4 sm:p-6">
          {!selectedTicket ? (
            <p className="text-sm text-gray-500">Select a ticket to view the conversation.</p>
          ) : (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">{selectedTicket.subject}</h2>
                  <p className="text-xs text-gray-500 mt-1">
                    {selectedTicket.ticketId} · {selectedTicket.userId?.name} · {selectedTicket.userId?.email}
                  </p>
                </div>
                <select
                  value={selectedTicket.status}
                  onChange={(e) => handleStatusChange(e.target.value)}
                  className="border border-gray-300 rounded-lg px-3 py-2 text-sm min-h-[44px]"
                >
                  {STATUS_OPTIONS.filter((option) => option.value !== 'all').map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-3 max-h-96 overflow-y-auto border border-gray-100 rounded-lg p-3 bg-gray-50">
                {(selectedTicket.messages?.length
                  ? selectedTicket.messages
                  : [{ message: selectedTicket.message, senderRole: 'VENDOR', createdAt: selectedTicket.createdAt }]
                ).map((entry, index) => {
                  const isStaff = ['ADMIN', 'SUPER_ADMIN'].includes(entry.senderRole);
                  return (
                    <div
                      key={entry._id || index}
                      className={`rounded-lg px-3 py-2 text-sm max-w-[85%] ${
                        isStaff ? 'ml-auto bg-blue-600 text-white' : 'mr-auto bg-white border border-gray-200'
                      }`}
                    >
                      <p className="text-[10px] mb-1 opacity-80">{entry.senderRole}</p>
                      <p className="whitespace-pre-wrap">{entry.message}</p>
                      <p className="text-[10px] mt-1 opacity-70">
                        {entry.createdAt ? new Date(entry.createdAt).toLocaleString('en-IN') : ''}
                      </p>
                    </div>
                  );
                })}
              </div>

              <form onSubmit={handleReply} className="space-y-3">
                <textarea
                  value={reply}
                  onChange={(e) => setReply(e.target.value)}
                  rows={3}
                  required
                  className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm"
                  placeholder="Type your reply..."
                />
                <button
                  type="submit"
                  disabled={sending || !reply.trim()}
                  className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60 min-h-[44px]"
                >
                  <FiSend /> {sending ? 'Sending...' : 'Reply'}
                </button>
              </form>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};

export default AdminSupport;
