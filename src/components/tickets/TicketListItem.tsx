// src/components/tickets/TicketListItem.tsx

import { Ticket, TicketStatus } from '../../types';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import Badge from '../ui/Badge';

interface TicketListItemProps {
  ticket: Ticket;
  onSelectTicket: (ticketId: string) => void;
}

const getStatusBadgeVariant = (status: TicketStatus): 'default' | 'secondary' | 'success' | 'danger' => {
  switch (status) {
    case TicketStatus.OPEN:
      return 'success';
    case TicketStatus.IN_PROGRESS:
      return 'default';
    case TicketStatus.CLOSED:
      return 'secondary';
    default:
      return 'secondary';
  }
};

const TicketListItem = ({ ticket, onSelectTicket }: TicketListItemProps) => {
  return (
    <div 
      className="p-4 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
      onClick={() => onSelectTicket(ticket.id)}
    >
      <div className="flex justify-between items-start">
        <h3 className="font-semibold text-lg">{ticket.title}</h3>
        <Badge variant={getStatusBadgeVariant(ticket.status)}>{ticket.status}</Badge>
      </div>
      <p className="text-sm text-gray-600 mt-1 truncate">{ticket.description}</p>
      <div className="text-xs text-gray-500 mt-2">
        <span>ID: {ticket.id.substring(0, 6)}...</span>
        <span className="mx-2">|</span>
        <span>
          Créé le: {format(ticket.createdAt.toDate(), 'd MMM yyyy', { locale: fr })}
        </span>
      </div>
    </div>
  );
};

export default TicketListItem;