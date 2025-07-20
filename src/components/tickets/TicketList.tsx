// src/components/tickets/TicketList.tsx

import { Ticket } from '../../types';
import TicketListItem from './TicketListItem';

interface TicketListProps {
  tickets: Ticket[];
  onSelectTicket: (ticketId: string) => void;
}

const TicketList = ({ tickets, onSelectTicket }: TicketListProps) => {
  if (tickets.length === 0) {
    return (
      <div className="text-center py-10">
        <p className="text-gray-500">Aucun ticket trouvé.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {tickets.map((ticket) => (
        <TicketListItem
          key={ticket.id}
          ticket={ticket}
          onSelectTicket={onSelectTicket}
        />
      ))}
    </div>
  );
};

export default TicketList;