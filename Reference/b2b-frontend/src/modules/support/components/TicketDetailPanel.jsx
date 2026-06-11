import Drawer from '../../../components/ui/Drawer.jsx';
import Button from '../../../components/ui/Button.jsx';

const STATUS_OPTIONS = ['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'];

const TicketDetailPanel = ({ ticket, isOpen, onClose, onStatusUpdate }) => {
  if (!ticket) return null;

  return (
    <Drawer isOpen={isOpen} onClose={onClose} title="Ticket Details">
      <div className="space-y-6">
        <div>
          <span className={`px-3 py-1 rounded-full text-xs font-bold ${
            ticket.status === 'OPEN' ? 'bg-sky-100 text-sky-700' :
            ticket.status === 'IN_PROGRESS' ? 'bg-amber-100 text-amber-700' :
            'bg-emerald-100 text-emerald-700'
          }`}>{ticket.status}</span>
        </div>

        <div>
          <h3 className="text-xl font-bold text-gray-900">{ticket.subject}</h3>
          <p className="text-sm text-gray-500 mt-1">
            {ticket.userId?.name} · {ticket.userId?.email}
          </p>
        </div>

        <div>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Message</p>
          <p className="text-gray-700 leading-relaxed">{ticket.message}</p>
        </div>

        <div>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Created</p>
          <p className="text-sm text-gray-600">{new Date(ticket.createdAt).toLocaleString()}</p>
        </div>

        {onStatusUpdate && (
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Update Status</p>
            <div className="flex flex-wrap gap-2">
              {STATUS_OPTIONS.map((status) => (
                <Button
                  key={status}
                  variant={ticket.status === status ? 'primary' : 'secondary'}
                  size="small"
                  onClick={() => onStatusUpdate(ticket._id, status)}
                >
                  {status}
                </Button>
              ))}
            </div>
          </div>
        )}
      </div>
    </Drawer>
  );
};

export default TicketDetailPanel;
