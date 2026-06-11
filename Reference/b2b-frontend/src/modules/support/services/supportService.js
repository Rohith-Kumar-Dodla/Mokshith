import { simulateApi, generateId, filterByQuery } from '../../../mocks/mockApi.js';
import { mockSupportTickets } from '../../../mocks/data/index.js';

let ticketStore = [...mockSupportTickets];

export const supportService = {
  async createTicket(ticketData) {
    return simulateApi(() => {
      if (!ticketData.subject?.trim() || !ticketData.message?.trim()) {
        throw new Error('Subject and message are required');
      }
      const ticket = {
        _id: generateId('ticket'),
        userId: { _id: 'current-user', name: 'Current User', email: 'user@mokshith.com' },
        subject: ticketData.subject,
        message: ticketData.message,
        status: 'OPEN',
        createdAt: new Date().toISOString(),
      };
      ticketStore.unshift(ticket);
      return ticket;
    });
  },

  async getMyTickets() {
    return simulateApi(() => [...ticketStore]);
  },

  async getAllTickets(filters = {}) {
    return simulateApi(() => {
      let tickets = [...ticketStore];
      if (filters.status) tickets = tickets.filter((t) => t.status === filters.status);
      if (filters.search) {
        tickets = filterByQuery(tickets, filters.search, ['subject', 'message', 'userId.name']);
      }
      return tickets;
    });
  },

  async getTicketById(id) {
    return simulateApi(() => {
      const ticket = ticketStore.find((t) => t._id === id);
      if (!ticket) throw new Error('Ticket not found');
      return ticket;
    });
  },

  async updateTicketStatus(id, status) {
    return simulateApi(() => {
      const index = ticketStore.findIndex((t) => t._id === id);
      if (index === -1) throw new Error('Ticket not found');
      ticketStore[index] = { ...ticketStore[index], status, updatedAt: new Date().toISOString() };
      return ticketStore[index];
    });
  },
};
