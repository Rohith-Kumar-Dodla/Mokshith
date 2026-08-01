import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { FiMessageCircle, FiPhone, FiSend, FiArrowLeft } from 'react-icons/fi';
import supportService from '../../services/supportService';

const STATUS_LABELS = {
  OPEN: 'Open',
  IN_PROGRESS: 'In Progress',
  WAITING_FOR_VENDOR: 'Waiting For Vendor',
  RESOLVED: 'Resolved',
  CLOSED: 'Closed',
};

function formatPhoneDisplay(phone) {
  const digits = String(phone || '').replace(/\D/g, '');
  if (digits.length === 10) {
    return `+91 ${digits.slice(0, 5)} ${digits.slice(5)}`;
  }
  if (digits.length === 12 && digits.startsWith('91')) {
    return `+91 ${digits.slice(2, 7)} ${digits.slice(7)}`;
  }
  return phone || 'Not configured';
}

const VendorSupport = () => {
  const [mode, setMode] = useState(null);
  const [contact, setContact] = useState({ supportPhone: '', supportEmail: '' });
  const [tickets, setTickets] = useState([]);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [message, setMessage] = useState('');
  const [subject, setSubject] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const loadData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [contactInfo, myTickets] = await Promise.all([
        supportService.getContactInfo(),
        supportService.getMyTickets(),
      ]);
      setContact(contactInfo || {});
      setTickets(Array.isArray(myTickets) ? myTickets : []);
    } catch (loadError) {
      setError(loadError?.response?.data?.message || loadError.message || 'Failed to load support');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const openTicket = async (ticketId) => {
    setError('');
    try {
      const ticket = await supportService.getTicketById(ticketId);
      setSelectedTicket(ticket);
      setMode('chat');
    } catch (openError) {
      setError(openError?.response?.data?.message || openError.message || 'Failed to open ticket');
    }
  };

  const handleCreateOrReply = async (event) => {
    event.preventDefault();
    if (!message.trim()) return;

    setSending(true);
    setError('');
    setSuccess('');
    try {
      if (selectedTicket?._id) {
        const updated = await supportService.replyToTicket(selectedTicket._id, {
          message: message.trim(),
        });
        setSelectedTicket(updated);
        setMessage('');
        setSuccess('Message sent');
      } else {
        const created = await supportService.createTicket({
          subject: subject.trim() || 'Support Request',
          message: message.trim(),
        });
        setSelectedTicket(created);
        setSubject('');
        setMessage('');
        setSuccess('Support request submitted');
      }
      await loadData();
    } catch (sendError) {
      setError(sendError?.response?.data?.message || sendError.message || 'Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const phoneHref = useMemo(() => {
    const digits = String(contact.supportPhone || '').replace(/\D/g, '');
    return digits ? `tel:+${digits.startsWith('91') ? digits : `91${digits}`}` : null;
  }, [contact.supportPhone]);

  if (loading) {
    return <p className="text-sm text-gray-500">Loading support center...</p>;
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Support</h1>
        <p className="text-sm text-gray-500 mt-1">Contact platform support without leaving the app</p>
      </div>

      {error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      ) : null}
      {success ? (
        <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">{success}</div>
      ) : null}

      {!mode ? (
        <>
          <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-6">
            <h2 className="text-base font-semibold text-gray-900 mb-4">Contact Support</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => {
                  setSelectedTicket(null);
                  setMode('chat');
                }}
                className="flex items-center gap-3 rounded-xl border border-gray-200 p-4 text-left hover:border-blue-300 hover:bg-blue-50 transition-colors min-h-[72px]"
              >
                <span className="p-2 rounded-lg bg-blue-100 text-blue-700">
                  <FiMessageCircle size={20} />
                </span>
                <span>
                  <span className="block font-medium text-gray-900">Chat Support</span>
                  <span className="text-xs text-gray-500">Message the support team</span>
                </span>
              </button>
              <button
                type="button"
                onClick={() => setMode('call')}
                className="flex items-center gap-3 rounded-xl border border-gray-200 p-4 text-left hover:border-green-300 hover:bg-green-50 transition-colors min-h-[72px]"
              >
                <span className="p-2 rounded-lg bg-green-100 text-green-700">
                  <FiPhone size={20} />
                </span>
                <span>
                  <span className="block font-medium text-gray-900">Call Support</span>
                  <span className="text-xs text-gray-500">Speak with an agent</span>
                </span>
              </button>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-6">
            <h2 className="text-base font-semibold text-gray-900 mb-3">Your Tickets</h2>
            {tickets.length === 0 ? (
              <p className="text-sm text-gray-500">No support tickets yet.</p>
            ) : (
              <div className="space-y-2">
                {tickets.map((ticket) => (
                  <button
                    key={ticket._id}
                    type="button"
                    onClick={() => openTicket(ticket._id)}
                    className="w-full text-left rounded-lg border border-gray-200 px-3 py-3 hover:bg-gray-50"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {ticket.subject || 'Support Request'}
                        </p>
                        <p className="text-xs text-gray-500 mt-1 truncate">{ticket.lastMessage || ticket.message}</p>
                      </div>
                      <span className="text-[11px] px-2 py-1 rounded-full bg-gray-100 text-gray-700 shrink-0">
                        {STATUS_LABELS[ticket.status] || ticket.status}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </>
      ) : null}

      {mode === 'call' ? (
        <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-6 space-y-4">
          <button type="button" onClick={() => setMode(null)} className="inline-flex items-center gap-2 text-sm text-gray-600">
            <FiArrowLeft /> Back
          </button>
          <h2 className="text-base font-semibold text-gray-900">Call Support</h2>
          <p className="text-sm text-gray-600">Support Phone Number</p>
          <p className="text-2xl font-bold text-gray-900">{formatPhoneDisplay(contact.supportPhone)}</p>
          {phoneHref ? (
            <a
              href={phoneHref}
              className="inline-flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-green-700 min-h-[44px]"
            >
              <FiPhone /> Call Now
            </a>
          ) : (
            <p className="text-sm text-amber-700">Support phone number is not configured yet.</p>
          )}
        </div>
      ) : null}

      {mode === 'chat' ? (
        <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-6 space-y-4">
          <button
            type="button"
            onClick={() => {
              setMode(null);
              setSelectedTicket(null);
              setMessage('');
              setSubject('');
            }}
            className="inline-flex items-center gap-2 text-sm text-gray-600"
          >
            <FiArrowLeft /> Back
          </button>

          <h2 className="text-base font-semibold text-gray-900">
            {selectedTicket ? `Ticket ${selectedTicket.ticketId || ''}` : 'New Chat Support'}
          </h2>

          {selectedTicket ? (
            <div className="space-y-3 max-h-80 overflow-y-auto border border-gray-100 rounded-lg p-3 bg-gray-50">
              {(selectedTicket.messages?.length
                ? selectedTicket.messages
                : [{ message: selectedTicket.message, senderRole: 'VENDOR', createdAt: selectedTicket.createdAt }]
              ).map((entry, index) => {
                const isVendor = String(entry.senderRole || '').includes('VENDOR') || String(entry.senderRole || '').includes('B2B');
                return (
                  <div
                    key={entry._id || index}
                    className={`rounded-lg px-3 py-2 text-sm max-w-[85%] ${
                      isVendor ? 'ml-auto bg-blue-600 text-white' : 'mr-auto bg-white border border-gray-200 text-gray-800'
                    }`}
                  >
                    <p className="whitespace-pre-wrap">{entry.message}</p>
                    <p className={`text-[10px] mt-1 ${isVendor ? 'text-blue-100' : 'text-gray-400'}`}>
                      {entry.createdAt ? new Date(entry.createdAt).toLocaleString('en-IN') : ''}
                    </p>
                  </div>
                );
              })}
            </div>
          ) : (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Subject (optional)</label>
              <input
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm min-h-[44px]"
                placeholder="Brief subject"
              />
            </div>
          )}

          <form onSubmit={handleCreateOrReply} className="space-y-3">
            <label className="block text-sm font-medium text-gray-700">Message</label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={4}
              required
              className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm"
              placeholder="Describe your issue..."
            />
            <button
              type="submit"
              disabled={sending || !message.trim()}
              className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60 min-h-[44px]"
            >
              <FiSend /> {sending ? 'Sending...' : selectedTicket ? 'Send Reply' : 'Send'}
            </button>
          </form>
        </div>
      ) : null}
    </div>
  );
};

export default VendorSupport;
