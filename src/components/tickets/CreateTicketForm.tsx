// src/components/tickets/CreateTicketForm.tsx

import { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { createTicket } from '../../services/ticketService';
import Button from '../ui/Button';
import { useToast } from '../../hooks/useToast';

interface CreateTicketFormProps {
  onTicketCreated: () => void;
}

const CreateTicketForm = ({ onTicketCreated }: CreateTicketFormProps) => {
  const { user } = useAuth();
  const { success, error: showError } = useToast();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      showError('Vous devez être connecté pour créer un ticket.');
      return;
    }
    if (!title.trim() || !description.trim()) {
      showError('Le titre et la description sont requis.');
      return;
    }

    setIsSubmitting(true);
    try {
      await createTicket(
        title,
        description,
        user.id,
        user.role,
        user.companyId
      );
      success('Ticket créé avec succès !');
      setTitle('');
      setDescription('');
      onTicketCreated();
    } catch (err) {
      showError((err as Error).message || 'Une erreur est survenue.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="title" className="block text-sm font-medium text-gray-700">
          Titre
        </label>
        <input
          type="text"
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          required
        />
      </div>
      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-700">
          Description
        </label>
        <textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={4}
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          required
        />
      </div>
      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? 'Envoi en cours...' : 'Créer le ticket'}
      </Button>
    </form>
  );
};

export default CreateTicketForm;