import { useState, useEffect } from 'react';
import { supportService } from '../../support/services/supportService.js';
import Card from '../../../components/ui/Card.jsx';
import Button from '../../../components/ui/Button.jsx';
import { HelpCircle, Send, MessageSquare, Clock, CheckCircle2, AlertCircle, Search, ChevronRight, LifeBuoy } from 'lucide-react';

const Help = () => {
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [tickets, setTickets] = useState([]);
  const [message, setMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchTickets();
  }, []);

  const fetchTickets = async () => {
    try {
      const data = await supportService.getMyTickets();
      setTickets(data.data || data);
    } catch (err) {
      console.error('Error fetching tickets:', err);
    } finally {
      setFetching(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!message.trim()) return;

    setLoading(true);
    try {
      await supportService.createTicket({ 
        subject: 'General Inquiry',
        message 
      });
      alert('Support ticket created successfully!');
      setMessage('');
      fetchTickets();
    } catch (err) {
      alert(err.message || 'Failed to create ticket');
    } finally {
      setLoading(false);
    }
  };

  const filteredTickets = tickets.filter(t => 
    t.message.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.status.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStatusIcon = (status) => {
    switch (status) {
      case 'open': return <Clock size={12} />;
      case 'in-progress': return <AlertCircle size={12} />;
      case 'resolved': return <CheckCircle2 size={12} />;
      default: return <Clock size={12} />;
    }
  };

  const getStatusStyles = (status) => {
    switch (status) {
      case 'open': return 'bg-sky-50 text-sky-600 border-sky-100';
      case 'in-progress': return 'bg-amber-50 text-amber-600 border-amber-100';
      case 'resolved': return 'bg-emerald-50 text-emerald-600 border-emerald-100';
      default: return 'bg-slate-50 text-slate-600 border-slate-100';
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Hero Section */}
      <div className="text-center mb-16 py-12 bg-white rounded-[3rem] border border-slate-100 shadow-sm relative overflow-hidden group">
        <div className="absolute -right-20 -top-20 w-64 h-64 bg-sky-50 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-700 opacity-50"></div>
        <div className="relative z-10 max-w-2xl mx-auto px-6">
          <div className="inline-flex items-center space-x-2 px-4 py-1.5 bg-sky-100 text-sky-600 rounded-full text-[10px] font-black uppercase tracking-[0.2em] mb-6">
            <LifeBuoy size={14} className="animate-spin-slow" />
            <span>Support Center</span>
          </div>
          <h1 className="text-5xl font-black text-slate-900 tracking-tight mb-6">How can we help you?</h1>
          <p className="text-slate-500 text-lg font-medium leading-relaxed">
            Get 24/7 expert assistance for your business. Our support team is dedicated to simplifying your B2B commerce experience.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
        {/* New Ticket Form */}
        <div className="lg:col-span-4 sticky top-10">
          <Card className="p-0 overflow-hidden shadow-2xl shadow-slate-200/50 border-slate-100 rounded-[2.5rem] bg-white">
            <div className="p-8 bg-sky-500 text-white">
              <div className="flex items-center space-x-3 mb-2">
                <HelpCircle size={22} className="stroke-[2.5px]" />
                <h2 className="text-xl font-black tracking-tight">Open a Ticket</h2>
              </div>
              <p className="text-sky-100 text-xs font-bold uppercase tracking-widest leading-relaxed">Submit your request below</p>
            </div>
            
            <form onSubmit={handleSubmit} className="p-8 space-y-6">
              <div className="space-y-3">
                <label className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1 flex items-center space-x-2">
                  <MessageSquare size={14} className="text-sky-500" />
                  <span>Your Message</span>
                </label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows="8"
                  placeholder="Describe your issue or question in detail..."
                  className="w-full p-5 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-sky-500/10 focus:border-sky-500 outline-none transition-all resize-none bg-slate-50/50 font-bold text-slate-700 text-sm leading-relaxed"
                  required
                />
              </div>
              
              <Button 
                type="submit" 
                loading={loading} 
                className="w-full h-16 rounded-2xl flex items-center justify-center space-x-3 shadow-xl shadow-sky-500/30 hover:shadow-sky-500/50 transition-all bg-sky-500 hover:bg-sky-600 text-white font-black text-xs uppercase tracking-[0.2em] hover:-translate-y-1 active:scale-95"
              >
                <Send size={18} />
                <span>Submit Request</span>
              </Button>
            </form>
          </Card>
        </div>

        {/* Ticket History */}
        <div className="lg:col-span-8 space-y-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 px-2">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-white rounded-2xl shadow-sm border border-slate-100 text-slate-400">
                <Clock size={24} />
              </div>
              <div>
                <h2 className="text-2xl font-black text-slate-900 tracking-tight">Support History</h2>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-0.5">Track your active inquiries</p>
              </div>
            </div>
            
            <div className="relative group">
              <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-sky-500 transition-colors" size={16} />
              <input 
                type="text"
                placeholder="Search tickets..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-14 pr-6 h-14 border border-slate-100 rounded-2xl text-xs font-bold focus:ring-4 focus:ring-sky-500/10 focus:border-sky-500 outline-none w-full sm:w-72 transition-all bg-white shadow-sm"
              />
            </div>
          </div>

          <Card className="p-0 overflow-hidden border-slate-100 shadow-2xl shadow-slate-200/40 rounded-[2.5rem] bg-white">
            {fetching ? (
              <div className="p-24 text-center space-y-6">
                <div className="animate-spin w-12 h-12 border-4 border-sky-500 border-t-transparent rounded-full mx-auto shadow-lg shadow-sky-500/20"></div>
                <p className="text-slate-400 font-black text-[10px] uppercase tracking-[0.2em] animate-pulse">Loading Support History</p>
              </div>
            ) : filteredTickets.length === 0 ? (
              <div className="p-24 text-center">
                <div className="w-28 h-28 bg-slate-50 rounded-[2.5rem] flex items-center justify-center mx-auto mb-8 text-slate-200 shadow-inner">
                  <MessageSquare size={54} />
                </div>
                <h3 className="text-xl font-black text-slate-900 mb-2 tracking-tight">No tickets found</h3>
                <p className="text-slate-400 font-bold text-xs uppercase tracking-widest leading-relaxed">
                  {searchQuery ? "Try refining your search terms" : "You haven't submitted any support requests yet."}
                </p>
              </div>
            ) : (
              <div className="divide-y divide-slate-50 max-h-[800px] overflow-y-auto custom-scrollbar">
                {filteredTickets.map(ticket => (
                  <div key={ticket._id} className="p-10 hover:bg-slate-50/50 transition-all group cursor-default">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-8">
                      <div className="flex flex-wrap items-center gap-4">
                        <span className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-[10px] font-black tracking-[0.15em] border shadow-sm ${getStatusStyles(ticket.status)}`}>
                          {getStatusIcon(ticket.status)}
                          <span>{ticket.status.toUpperCase()}</span>
                        </span>
                        <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest bg-slate-50 px-3 py-1.5 rounded-lg">
                          #{ticket._id.slice(-6).toUpperCase()}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2 text-slate-400">
                        <Clock size={14} />
                        <span className="text-[10px] font-black uppercase tracking-widest">
                          {new Date(ticket.createdAt).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric'
                          })}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-start space-x-6">
                      <div className="p-4 bg-white rounded-2xl shadow-sm border border-slate-50 text-sky-500 group-hover:scale-110 transition-transform duration-500">
                        <MessageSquare size={20} />
                      </div>
                      <p className="text-slate-600 font-bold text-base leading-relaxed group-hover:text-slate-900 transition-colors pt-1">
                        {ticket.message}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Help;
