const baseStyles = `
  body { margin: 0; padding: 0; background: #f6f7fb; font-family: Arial, Helvetica, sans-serif; color: #1f2937; }
  .wrapper { max-width: 680px; margin: 0 auto; padding: 24px; }
  .card { background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 30px rgba(15, 23, 42, 0.08); }
  .header { background: linear-gradient(135deg, #111827, #374151); color: #fff; padding: 28px 32px; }
  .header h1 { margin: 0; font-size: 24px; }
  .content { padding: 32px; }
  .muted { color: #6b7280; }
  .section { margin-top: 24px; padding-top: 24px; border-top: 1px solid #e5e7eb; }
  .pill { display: inline-block; padding: 6px 12px; border-radius: 999px; background: #eef2ff; color: #4338ca; font-size: 12px; font-weight: 700; letter-spacing: 0.02em; }
  .table { width: 100%; border-collapse: collapse; margin-top: 12px; }
  .table td { padding: 10px 0; border-bottom: 1px solid #e5e7eb; vertical-align: top; }
  .footer { padding: 20px 32px 32px; font-size: 12px; color: #6b7280; }
  .button { display: inline-block; margin-top: 16px; padding: 12px 18px; border-radius: 10px; background: #111827; color: #fff !important; text-decoration: none; font-weight: 700; }
`;

const wrap = ({ title, subtitle = '', body = '' }) => `
  <!doctype html>
  <html>
    <head>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <title>${title}</title>
      <style>${baseStyles}</style>
    </head>
    <body>
      <div class="wrapper">
        <div class="card">
          <div class="header">
            <h1>${title}</h1>
            ${subtitle ? `<p style="margin: 8px 0 0; color: rgba(255,255,255,0.85);">${subtitle}</p>` : ''}
          </div>
          <div class="content">${body}</div>
          <div class="footer">This is an automated message from Shopzy.</div>
        </div>
      </div>
    </body>
  </html>
`;

const buildItemRows = (items = []) =>
  items
    .map(
      (item) => `
        <tr>
          <td>
            <div style="font-weight:700;">${item.name}</div>
            <div class="muted">${item.size ? `Size: ${item.size}` : ''}</div>
          </td>
          <td style="text-align:right;">${item.quantity} × INR ${Number(item.price || 0).toFixed(2)}</td>
        </tr>
      `,
    )
    .join('');

export const buildOrderConfirmationTemplate = ({ order, user }) =>
  wrap({
    title: 'Order Confirmed',
    subtitle: `Order #${order._id.toString().slice(-6).toUpperCase()}`,
    body: `
      <p>Hi ${user.name},</p>
      <p>Your order has been placed successfully. We’ve reserved your stock and will share updates as soon as it moves forward.</p>
      <span class="pill">${String(order.orderStatus || '').toUpperCase()}</span>
      <div class="section">
        <table class="table">
          <tbody>
            ${buildItemRows(order.items || [])}
          </tbody>
        </table>
      </div>
      <div class="section">
        <table class="table">
          <tbody>
            <tr><td>Subtotal</td><td style="text-align:right;">INR ${Number(order.subtotalAmount || 0).toFixed(2)}</td></tr>
            <tr><td>Discount</td><td style="text-align:right;">INR ${Number(order.discountAmount || 0).toFixed(2)}</td></tr>
            <tr><td>Shipping</td><td style="text-align:right;">INR ${Number(order.shippingAmount || 0).toFixed(2)}</td></tr>
            <tr><td><strong>Total</strong></td><td style="text-align:right;"><strong>INR ${Number(order.totalAmount || 0).toFixed(2)}</strong></td></tr>
          </tbody>
        </table>
      </div>
    `,
  });

export const buildShippingUpdateTemplate = ({ order, user, trackingUrl }) =>
  wrap({
    title: 'Your Order Is On The Way',
    subtitle: `Tracking #${order.trackingId || order._id.toString().slice(-6).toUpperCase()}`,
    body: `
      <p>Hi ${user.name},</p>
      <p>Your order has been shipped. You can track the latest delivery status using the button below.</p>
      <span class="pill">SHIPPED</span>
      <div class="section">
        <p><strong>Tracking ID:</strong> ${order.trackingId || 'N/A'}</p>
        <p><strong>Estimated Delivery:</strong> ${order.deliveredAt ? new Date(order.deliveredAt).toLocaleDateString() : 'Soon'}</p>
        ${trackingUrl ? `<a class="button" href="${trackingUrl}">Track Order</a>` : ''}
      </div>
    `,
  });

export const buildRefundProcessedTemplate = ({ order, user, refundAmount, refundStatus = 'processed' }) =>
  wrap({
    title: 'Refund Processed',
    subtitle: `Order #${order._id.toString().slice(-6).toUpperCase()}`,
    body: `
      <p>Hi ${user.name},</p>
      <p>Your refund has been ${refundStatus}. The amount will reflect according to your bank/card provider timelines.</p>
      <span class="pill">REFUND ${String(refundStatus).toUpperCase()}</span>
      <div class="section">
        <p><strong>Refund Amount:</strong> INR ${Number(refundAmount || 0).toFixed(2)}</p>
        <p><strong>Order Status:</strong> ${order.orderStatus}</p>
        <p><strong>Payment Status:</strong> ${order.paymentStatus}</p>
      </div>
    `,
  });
