// src/components/tickets/TicketList.tsx

import { Ticket } from '../../types';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import Badge from '../ui/Badge';

interface TicketListProps {
  tickets: Ticket[];
  onSelectTicket: (ticketId: string) => void;
}

const TicketList = ({ tickets, onSelectTicket }: TicketListProps) => {
  const getStatusBadgeVariant = (status: Ticket['status']): 'default' | 'secondary' | 'success' | 'danger' => {
    switch (status) {
      case 'ouvert':
        return 'success';
      case 'répondu':
        return 'default';
      case 'clos':
        return 'secondary';
      default:
        return 'secondary';
    }
  };

  return (
    <div className="bg-white shadow rounded-lg">
      <ul className="divide-y divide-gray-200">
        {tickets.length > 0 ? tickets.map(ticket => (
          <li key={ticket.id} onClick={() => onSelectTicket(ticket.id)} className="p-4 hover:bg-gray-50 cursor-pointer">
            <div className="flex justify-between items-center">
              <div>
                <p className="font-semibold text-lg">{ticket.subject}</p>
                <p className="text-sm text-gray-600">
                  {ticket.userName} ({ticket.userEmail})
                </p>
                <p className="text-sm text-gray-500">
                  Entreprise: {ticket.companyName || 'Non spécifiée'}
                </p>
              </div>
              <div className="text-right">
                <Badge variant={getStatusBadgeVariant(ticket.status)}>{ticket.status}</Badge>
                <p className="text-xs text-gray-500 mt-1">
                  {ticket.createdAt && format(ticket.createdAt.toDate(), 'd MMM yyyy', { locale: fr })}
                </p>
              </div>
            </div>
          </li>
        )) : (
          <p className="p-4 text-center text-gray-500">Aucun ticket à afficher.</p>
        )}
      </ul>
    </div>
  );
};

export default TicketList;