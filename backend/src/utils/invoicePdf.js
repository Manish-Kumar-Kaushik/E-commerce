import PDFDocument from 'pdfkit';

const money = (value) => `INR ${Number(value || 0).toFixed(2)}`;

const formatLineItems = (order) =>
  (Array.isArray(order.items) ? order.items : []).map((item) => ({
    name: item.name,
    size: item.size,
    quantity: Number(item.quantity || 0),
    price: Number(item.price || 0),
    total: Number(item.price || 0) * Number(item.quantity || 0),
    vendorName: item.vendorName || 'Shopzy Seller',
  }));

export const createOrderInvoicePdfBuffer = async (order) =>
  new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: 40 });
    const chunks = [];

    doc.on('data', (chunk) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    doc.fontSize(20).text('Shopzy Invoice', { align: 'center' });
    doc.moveDown(0.5);
    doc.fontSize(10).text(`Invoice Number: ${order.invoiceNumber || order._id.toString().slice(-10).toUpperCase()}`);
    doc.text(`Order ID: ${order._id.toString()}`);
    doc.text(`Order Status: ${order.orderStatus}`);
    doc.text(`Payment Status: ${order.paymentStatus}`);
    doc.text(`Payment Method: ${String(order.paymentMethod || '').toUpperCase()}`);
    doc.text(`Created At: ${new Date(order.createdAt).toLocaleString()}`);
    doc.moveDown();

    doc.fontSize(14).text('Billing / Shipping Address');
    doc.fontSize(10);
    const address = order.shippingAddress || {};
    doc.text([address.fullName, address.phone, address.line1, address.line2, `${address.city}, ${address.state} ${address.postalCode}`, address.country]
      .filter(Boolean)
      .join('\n'));
    doc.moveDown();

    const lineItems = formatLineItems(order);
    doc.fontSize(14).text('Items');
    doc.moveDown(0.25);

    lineItems.forEach((item, index) => {
      doc.fontSize(10).text(`${index + 1}. ${item.name} (${item.size || 'ONE_SIZE'})`);
      doc.text(`   Vendor: ${item.vendorName}`);
      doc.text(`   Qty: ${item.quantity}  Unit: ${money(item.price)}  Total: ${money(item.total)}`);
      doc.moveDown(0.25);
    });

    doc.moveDown();
    doc.fontSize(12).text('Totals', { underline: true });
    doc.fontSize(10);
    doc.text(`Subtotal: ${money(order.subtotalAmount)}`);
    doc.text(`Discount: ${money(order.discountAmount)}`);
    doc.text(`Shipping: ${money(order.shippingAmount)}`);
    doc.text(`Total: ${money(order.totalAmount)}`);

    if (Array.isArray(order.subOrders) && order.subOrders.length) {
      doc.moveDown();
      doc.fontSize(12).text('Vendor Sub-Orders', { underline: true });
      doc.fontSize(10);
      order.subOrders.forEach((subOrder, index) => {
        doc.text(`${index + 1}. ${subOrder.subOrderNumber || 'N/A'} — ${subOrder.vendorName || 'Shopzy Seller'}`);
        doc.text(`   Status: ${subOrder.status}`);
        doc.text(`   Amount: ${money(subOrder.totalAmount)}`);
      });
    }

    doc.end();
  });
