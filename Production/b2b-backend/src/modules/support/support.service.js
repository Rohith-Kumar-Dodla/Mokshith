import Support, { SUPPORT_STATUS } from './support.model.js';
import AppError from '../../errors/AppError.js';
import User from '../user/user.model.js';
import { ROLES } from '../../constants/roles.js';
import { USER_STATUS } from '../../constants/userStatus.js';
import { sendNotification } from '../notification/notification.service.js';
import { logger } from '../../config/logger.js';

function emitSupportUpdate(ticket, event = 'support:updated') {
  if (!global.io) return;
  const payload = {
    ticketId: ticket._id,
    publicTicketId: ticket.ticketId,
    status: ticket.status,
    lastMessage: ticket.lastMessage,
    lastMessageAt: ticket.lastMessageAt,
    updatedAt: ticket.updatedAt,
  };
  global.io.emit(event, payload);
  if (ticket.userId) {
    global.io.to(String(ticket.userId._id || ticket.userId)).emit(event, payload);
  }
}

async function notifyAdmins(title, message) {
  const admins = await User.find({
    role: { $in: [ROLES.ADMIN, ROLES.SUPER_ADMIN] },
    status: USER_STATUS.ACTIVE,
    isDeleted: { $ne: true },
  })
    .select('_id')
    .lean();

  await Promise.all(
    admins.map((admin) =>
      sendNotification({
        userId: admin._id,
        title,
        message,
        type: 'SYSTEM',
      }).catch((err) => {
        logger.warn('Support admin notification failed', { error: err.message });
      })
    )
  );
}

export const createTicket = async (user, data) => {
  const subject = data.subject?.trim() || 'Support Request';
  const message = data.message?.trim();
  if (!message) {
    throw new AppError('Message is required', 400);
  }

  const firstMessage = {
    sender: user._id || user.id,
    senderRole: user.role,
    message,
    attachments: data.attachments || [],
    createdAt: new Date(),
  };

  const ticket = await Support.create({
    userId: user._id || user.id,
    subject,
    message,
    messages: [firstMessage],
    lastMessage: message,
    lastMessageAt: new Date(),
    priority: data.priority || 'MEDIUM',
    status: SUPPORT_STATUS.OPEN,
  });

  await notifyAdmins(
    'New support request received',
    `Vendor ${user.name || user.email || 'Unknown'} submitted: ${subject}`
  );

  emitSupportUpdate(ticket, 'support:created');
  return ticket;
};

export const getMyTickets = async (userId) => {
  return Support.find({ userId }).sort({ updatedAt: -1 });
};

export const getTicketById = async (ticketId, user) => {
  const ticket = await Support.findById(ticketId)
    .populate('userId', 'name email mobile businessName')
    .populate('assignedAdmin', 'name email')
    .populate('messages.sender', 'name email role');

  if (!ticket) throw new AppError('Ticket not found', 404);

  const isStaff = [ROLES.ADMIN, ROLES.SUPER_ADMIN].includes(user.role);
  if (!isStaff && String(ticket.userId._id || ticket.userId) !== String(user._id || user.id)) {
    throw new AppError('You do not have access to this ticket', 403);
  }

  return ticket;
};

export const getAllTickets = async (filters = {}) => {
  const {
    status = 'all',
    priority = 'all',
    search = '',
    page = 1,
    limit = 20,
  } = filters;

  const query = {};
  if (status !== 'all') query.status = status;
  if (priority !== 'all') query.priority = priority;

  if (search?.trim()) {
    const regex = new RegExp(search.trim(), 'i');
    query.$or = [{ subject: regex }, { ticketId: regex }, { lastMessage: regex }];
  }

  const skip = (Number(page) - 1) * Number(limit);
  const [tickets, total] = await Promise.all([
    Support.find(query)
      .populate('userId', 'name email mobile businessName')
      .populate('assignedAdmin', 'name email')
      .sort({ updatedAt: -1 })
      .skip(skip)
      .limit(Number(limit)),
    Support.countDocuments(query),
  ]);

  return {
    tickets,
    pagination: {
      page: Number(page),
      limit: Number(limit),
      total,
      pages: Math.ceil(total / Number(limit)) || 1,
    },
  };
};

export const replyToTicket = async (ticketId, user, data) => {
  const ticket = await Support.findById(ticketId);
  if (!ticket) throw new AppError('Ticket not found', 404);

  const isStaff = [ROLES.ADMIN, ROLES.SUPER_ADMIN].includes(user.role);
  const isOwner = String(ticket.userId) === String(user._id || user.id);

  if (!isStaff && !isOwner) {
    throw new AppError('You do not have access to this ticket', 403);
  }

  if ([SUPPORT_STATUS.CLOSED, SUPPORT_STATUS.RESOLVED].includes(ticket.status) && !isStaff) {
    throw new AppError('This ticket is closed. Please create a new request.', 400);
  }

  const message = data.message?.trim();
  if (!message) throw new AppError('Message is required', 400);

  ticket.messages.push({
    sender: user._id || user.id,
    senderRole: user.role,
    message,
    attachments: data.attachments || [],
    createdAt: new Date(),
  });
  ticket.lastMessage = message;
  ticket.lastMessageAt = new Date();
  ticket.message = message;

  if (isStaff) {
    ticket.assignedAdmin = ticket.assignedAdmin || user._id || user.id;
    if (ticket.status === SUPPORT_STATUS.OPEN || ticket.status === SUPPORT_STATUS.IN_PROGRESS) {
      ticket.status = SUPPORT_STATUS.WAITING_FOR_VENDOR;
    }

    await sendNotification({
      userId: ticket.userId,
      title: 'Admin replied to your support request',
      message: message.slice(0, 200),
      type: 'SYSTEM',
    }).catch((err) => logger.warn('Support vendor notification failed', { error: err.message }));
  } else {
    if (
      ticket.status === SUPPORT_STATUS.WAITING_FOR_VENDOR ||
      ticket.status === SUPPORT_STATUS.OPEN
    ) {
      ticket.status = SUPPORT_STATUS.IN_PROGRESS;
    }
    await notifyAdmins(
      'Vendor replied to support ticket',
      `Ticket ${ticket.ticketId}: ${message.slice(0, 120)}`
    );
  }

  await ticket.save();
  const populated = await getTicketById(ticket._id, user);
  emitSupportUpdate(populated, 'support:message');
  return populated;
};

export const updateTicketStatus = async (ticketId, status, adminUser, priority) => {
  const ticket = await Support.findById(ticketId);
  if (!ticket) throw new AppError('Ticket not found', 404);

  ticket.status = status;
  if (priority) ticket.priority = priority;
  ticket.assignedAdmin = ticket.assignedAdmin || adminUser._id || adminUser.id;

  if ([SUPPORT_STATUS.CLOSED, SUPPORT_STATUS.RESOLVED].includes(status)) {
    ticket.closedAt = new Date();
  } else {
    ticket.closedAt = null;
  }

  await ticket.save();

  await sendNotification({
    userId: ticket.userId,
    title: 'Support ticket status updated',
    message: `Your support ticket ${ticket.ticketId} is now ${status.replace(/_/g, ' ')}.`,
    type: 'SYSTEM',
  }).catch((err) => logger.warn('Support status notification failed', { error: err.message }));

  const populated = await getTicketById(ticket._id, adminUser);
  emitSupportUpdate(populated);
  return populated;
};
