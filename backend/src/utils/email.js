import nodemailer from 'nodemailer';
import sgMail from '@sendgrid/mail';
import logger from './logger.js';
import {
  buildOrderConfirmationTemplate,
  buildRefundProcessedTemplate,
  buildShippingUpdateTemplate,
} from './htmlTemplates.js';

let transport;

const isSendGridConfigured = () => Boolean(process.env.SENDGRID_API_KEY);
const isSmtpConfigured = () => Boolean(
  process.env.SMTP_HOST
  && process.env.SMTP_PORT
  && process.env.SMTP_USER
  && process.env.SMTP_PASS,
);

const sendViaSendGrid = async (options) => {
  const fromAddress = process.env.EMAIL_FROM || 'Shopzy <no-reply@shopzy.local>';

  sgMail.setApiKey(process.env.SENDGRID_API_KEY);

  const [response] = await sgMail.send({
    from: fromAddress,
    to: options.to,
    subject: options.subject,
    text: options.text,
    html: options.html,
    replyTo: options.replyTo,
  });

  logger.info(`Email processed for ${options.to}`, {
    provider: 'sendgrid',
    statusCode: response?.statusCode,
  });

  return response;
};

const getTransport = async () => {
  if (transport) {
    return transport;
  }

  const {
    SMTP_HOST,
    SMTP_PORT,
    SMTP_USER,
    SMTP_PASS,
    SMTP_SECURE,
    EMAIL_FROM = 'Shopzy <no-reply@shopzy.local>',
  } = process.env;

  if (SMTP_HOST && SMTP_PORT && SMTP_USER && SMTP_PASS) {
    transport = nodemailer.createTransport({
      host: SMTP_HOST,
      port: Number(SMTP_PORT),
      secure: SMTP_SECURE === 'true',
      auth: {
        user: SMTP_USER,
        pass: SMTP_PASS,
      },
    });
  } else {
    transport = nodemailer.createTransport({
      jsonTransport: true,
    });
  }

  transport.defaults = {
    from: EMAIL_FROM,
  };

  return transport;
};

const sendMail = async (options) => {
  if (isSendGridConfigured()) {
    try {
      return await sendViaSendGrid(options);
    } catch (sendGridError) {
      logger.warn(`SendGrid send failed for ${options.to}`, {
        provider: 'sendgrid',
        message: sendGridError?.message,
      });

      if (isSmtpConfigured()) {
        logger.warn(`Falling back to SMTP for ${options.to}`);
      } else {
        throw sendGridError;
      }
    }
  }

  const transporter = await getTransport();
  const info = await transporter.sendMail({
    from: process.env.EMAIL_FROM || 'Shopzy <no-reply@shopzy.local>',
    ...options,
  });

  logger.info(`Email processed for ${options.to}`, {
    messageId: info.messageId,
  });

  return info;
};

export const sendOrderConfirmationEmail = async ({ order, user }) =>
  sendMail({
    to: user.email,
    subject: `Order confirmed: ${order._id.toString().slice(-6).toUpperCase()}`,
    text: [
      `Hi ${user.name},`,
      '',
      'Your Shopzy order has been placed successfully.',
      `Order total: INR ${order.totalAmount}`,
      `Payment method: ${order.paymentMethod.toUpperCase()}`,
      `Status: ${order.orderStatus}`,
      '',
      'We will share shipping updates soon.',
    ].join('\n'),
    html: buildOrderConfirmationTemplate({ order, user }),
  });

export const sendOrderShippingEmail = async ({ order, user, trackingUrl = '' }) =>
  sendMail({
    to: user.email,
    subject: `Your order is on the way: ${order._id.toString().slice(-6).toUpperCase()}`,
    text: [
      `Hi ${user.name},`,
      '',
      'Your order has been shipped.',
      `Tracking ID: ${order.trackingId || 'N/A'}`,
      trackingUrl ? `Track here: ${trackingUrl}` : '',
    ].filter(Boolean).join('\n'),
    html: buildShippingUpdateTemplate({ order, user, trackingUrl }),
  });

export const sendRefundProcessedEmail = async ({ order, user, refundAmount, refundStatus = 'processed' }) =>
  sendMail({
    to: user.email,
    subject: `Refund ${refundStatus}: ${order._id.toString().slice(-6).toUpperCase()}`,
    text: [
      `Hi ${user.name},`,
      '',
      `Your refund has been ${refundStatus}.`,
      `Refund amount: INR ${Number(refundAmount || 0).toFixed(2)}`,
    ].join('\n'),
    html: buildRefundProcessedTemplate({ order, user, refundAmount, refundStatus }),
  });

export const sendContactNotificationEmail = async ({ name, email, message }) =>
  sendMail({
        to: process.env.CONTACT_RECEIVER_EMAIL || 'info@shopzy.in',
    replyTo: email,
    subject: `New contact enquiry from ${name}`,
    text: [`From: ${name} <${email}>`, '', message].join('\n'),
  });

export const sendPasswordResetOtpEmail = async ({ email, otp, name = 'User' }) =>
  sendMail({
    to: email,
    subject: 'Shopzy password reset OTP',
    text: [
      `Hi ${name},`,
      '',
      'Use the OTP below to reset your Shopzy account password:',
      '',
      `${otp}`,
      '',
      'This OTP is valid for 10 minutes.',
      'If you did not request this, please ignore this email.',
    ].join('\n'),
  });

export const sendVendorPhoneVerificationOtpEmail = async ({ email, otp, name = 'Vendor', businessPhone = '' }) =>
  sendMail({
    to: email,
    subject: 'Shopzy vendor phone verification OTP',
    text: [
      `Hi ${name},`,
      '',
      'Use the OTP below to verify your business phone number for your Shopzy vendor profile:',
      '',
      `${otp}`,
      '',
      businessPhone ? `Phone number: ${businessPhone}` : '',
      'This OTP is valid for 10 minutes.',
      'If you did not request this, please ignore this email.',
    ]
      .filter(Boolean)
      .join('\n'),
  });
