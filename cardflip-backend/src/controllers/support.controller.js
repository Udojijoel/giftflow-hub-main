import multer from 'multer';
import { prisma } from '../services/prisma.js';
import { uploadImage } from '../services/cloudinary.js';
import { AppError } from '../utils/AppError.js';

// GET /support/tickets
export const getTickets = async (req, res, next) => {
  try {
    const tickets = await prisma.supportTicket.findMany({
      where: { user_id: req.user.id },
      orderBy: { updated_at: 'desc' },
    });
    res.json(tickets.map((t) => ({
      id: t.id,
      trade_id: t.trade_id || null,
      subject: t.subject,
      status: t.status,
      created_at: t.created_at,
    })));
  } catch (err) { next(err); }
};

// GET /support/tickets/:id
export const getTicketById = async (req, res, next) => {
  try {
    const ticket = await prisma.supportTicket.findFirst({
      where: { id: req.params.id, user_id: req.user.id },
    });
    if (!ticket) throw new AppError('Ticket not found', 404);

    const messages = await prisma.supportMessage.findMany({
      where: { ticket_id: ticket.id },
      orderBy: { created_at: 'asc' },
      include: { sender: { select: { id: true, full_name: true, role: true } } },
    });

    res.json({ ticket, messages });
  } catch (err) { next(err); }
};

// POST /support/tickets
export const createTicket = async (req, res, next) => {
  try {
    const { subject, message, trade_id } = req.body;
    if (!subject || !message) throw new AppError('Subject and message are required', 400);

    const ticket = await prisma.$transaction(async (tx) => {
      const t = await tx.supportTicket.create({
        data: { user_id: req.user.id, trade_id: trade_id || null, subject },
      });
      await tx.supportMessage.create({
        data: { ticket_id: t.id, sender_id: req.user.id, message },
      });
      return t;
    });

    const io = req.app.get('io');
    io?.to('admin').emit('support:new_ticket', { ticket_id: ticket.id });

    res.status(201).json({
      id: ticket.id,
      trade_id: ticket.trade_id || null,
      subject: ticket.subject,
      status: ticket.status,
      created_at: ticket.created_at,
    });
  } catch (err) { next(err); }
};

// POST /support/tickets/:ticketId/messages
export const sendMessage = async (req, res, next) => {
  try {
    const { message } = req.body;
    if (!message) throw new AppError('Message is required', 400);

    const ticket = await prisma.supportTicket.findFirst({
      where: { id: req.params.ticketId, user_id: req.user.id },
    });
    if (!ticket) throw new AppError('Ticket not found', 404);

    let attachment_url = null;
    if (req.file) {
      const result = await uploadImage(req.file.buffer, { folder: 'cardflip/support' });
      attachment_url = result.secure_url;
    }

    const msg = await prisma.supportMessage.create({
      data: { ticket_id: ticket.id, sender_id: req.user.id, message, attachment_url },
    });

    await prisma.supportTicket.update({
      where: { id: ticket.id },
      data: { updated_at: new Date() },
    });

    const io = req.app.get('io');
    io?.to(`ticket:${ticket.id}`).emit('support:message', msg);
    io?.to('admin').emit('support:new_message', { ticket_id: ticket.id });

    res.status(201).json(msg);
  } catch (err) { next(err); }
};
