import { asyncHandler } from '../../utils/asyncHandler.js';
import * as service from './support.service.js';
import { successResponse } from '../../utils/responseHandler.js';
import { getPlatformSettings } from '../platformSettings/platformSettings.service.js';

export const getContactInfo = asyncHandler(async (req, res) => {
  const settings = await getPlatformSettings();
  successResponse(res, {
    supportPhone: settings.supportPhone || '',
    supportEmail: settings.supportEmail || '',
  });
});

export const createTicket = asyncHandler(async (req, res) => {
  const ticket = await service.createTicket(req.user, req.body);
  successResponse(res, ticket, 'Support ticket created successfully', 201);
});

export const getMyTickets = asyncHandler(async (req, res) => {
  const tickets = await service.getMyTickets(req.user._id);
  successResponse(res, tickets);
});

export const getTicketById = asyncHandler(async (req, res) => {
  const ticket = await service.getTicketById(req.params.id, req.user);
  successResponse(res, ticket);
});

export const getAllTickets = asyncHandler(async (req, res) => {
  const data = await service.getAllTickets(req.query);
  successResponse(res, data);
});

export const replyToTicket = asyncHandler(async (req, res) => {
  const ticket = await service.replyToTicket(req.params.id, req.user, req.body);
  successResponse(res, ticket, 'Reply sent');
});

export const updateTicketStatus = asyncHandler(async (req, res) => {
  const ticket = await service.updateTicketStatus(
    req.params.id,
    req.body.status,
    req.user,
    req.body.priority
  );
  successResponse(res, ticket, 'Ticket status updated');
});
