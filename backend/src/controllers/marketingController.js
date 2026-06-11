import ContactMessage from '../models/ContactMessage.js';
import NewsletterSubscriber from '../models/NewsletterSubscriber.js';
import { sendContactNotificationEmail } from '../utils/email.js';
import asyncHandler from '../utils/asyncHandler.js';

export const subscribeNewsletter = asyncHandler(async (req, res) => {
  const subscriber = await NewsletterSubscriber.findOneAndUpdate(
    { email: req.body.email },
    {
      email: req.body.email,
      source: req.body.source || 'website',
    },
    {
      upsert: true,
      new: true,
      setDefaultsOnInsert: true,
    },
  );

  res.status(201).json({
    success: true,
    message: 'Subscribed successfully',
    subscriber,
  });
});

export const sendContactMessage = asyncHandler(async (req, res) => {
  const contactMessage = await ContactMessage.create(req.body);

  sendContactNotificationEmail(req.body).catch(() => undefined);

  res.status(201).json({
    success: true,
    message: 'Message sent successfully',
    contactMessage,
  });
});
