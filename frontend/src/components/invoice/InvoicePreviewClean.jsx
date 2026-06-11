import React, { useState } from "react";
import {
  Download,
  Printer,
  Share2,
  Copy,
  FileText,
  Package,
  CalendarDays,
  Truck,
  BadgeCheck,
  CreditCard,
  MapPin,
  ShoppingBag,
  CheckCircle2,
  Wallet
} from "lucide-react";

const formatCurrency = (value) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
  }).format(value || 0);

const formatDate = (date) => {
  if (!date) return "—";
  return new Date(date).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
};

const StatusBadge = ({ status }) => {
  const normalized = status?.toLowerCase();
  const colors =
    normalized === "delivered" || normalized === "paid"
      ? "bg-green-100 text-green-700"
      : normalized === "pending"
      ? "bg-yellow-100 text-yellow-700"
      : "bg-gray-100 text-gray-700";

  return (
    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide ${colors}`}>
      {status}
    </span>
  );
};

const defaultProductSvgSmall = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40"><rect fill="%23f8fafc" width="100%" height="100%"/><g fill="%239ca3af"><rect x="7" y="11" width="26" height="18" rx="3"/><circle cx="20" cy="20" r="5"/></g></svg>'

import { getImageUrl } from '../../utils/formatters'

const getImageSrcFor = (item) => {
  if (!item) return null
  const candidates = [item.image, item.imageUrl, item.thumbnail, item.product?.images?.[0]?.url, item.product?.image]
  for (const c of candidates) {
    if (!c) continue
    const s = getImageUrl(c)
    if (s) return s
  }
  return null
}

const InvoicePreview = ({ invoice = {}, isVendor = false, showAboutShopzy = true }) => {
  const [copied, setCopied] = useState(false);

  const data = {
    invoiceNumber: "B15F9DB1E9",
    orderNumber: "69f9bf72159d74b15f9db1e9",
    orderDate: "2026-05-05T15:29:00",
    deliveryDate: "2026-05-07",
    orderStatus: "Delivered",
    paymentStatus: "Paid",
    paymentMethod: "COD (Cash on Delivery)",
    placeOfSupply: "Chhattisgarh (22)",
    billingAddress: {
      name: "Manish Kaushik",
      phone: "9589843580",
      street: "160, ramnagar, ward no 12, ajad chauk, shivaji marg",
      city: "Durg",
      state: "Chhattisgarh",
      zip: "490023",
      country: "India",
    },
    items: [
      {
        id: 1,
        name: "Sari (S)",
        variant: { color: "Purple", size: "S" },
        sku: "SARI-S-PUR-S",
        vendor: "Nandini Sinha",
        quantity: 1,
        unitPrice: 998,
        gst: 0,
        discount: 0,
        total: 998,
        image: "https://via.placeholder.com/50",
      },
    ],
    subOrders: [
        { vendor: "Nandini Sinha", id: "SO-9DB1E9-674A-01", status: "Delivered", amount: 998, commission: 0, earnings: 998 }
    ],
    pricing: {
        subtotal: 998,
        gstTotal: 0,
        couponDiscount: 0,
        platformDiscount: 0,
        shipping: 0,
        handling: 0,
        total: 998
    },
    transactionId: "TXN-5F9DB1E9",
    gateway: "Cash on Delivery",
    refundStatus: "Not Applicable",
    ...invoice,
  };

  const copyId = () => {
    navigator.clipboard.writeText(data.invoiceNumber);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-slate-50 min-h-screen p-4 md:p-8 font-sans text-slate-800">
      <div className="max-w-5xl mx-auto bg-white shadow-sm border border-slate-200 rounded-xl overflow-hidden print:shadow-none print:border-none">
        
        {/* Top Buttons */}
        <div className="flex flex-wrap justify-end gap-2 p-4 border-b border-slate-100 bg-white sticky top-0 z-10 print:hidden">
          <button className="flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 rounded text-xs font-medium hover:bg-slate-50 transition"><Download size={14} /> Download PDF</button>
          <button onClick={() => window.print()} className="flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 rounded text-xs font-medium hover:bg-slate-50 transition"><Printer size={14} /> Print Invoice</button>
          <button className="flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 rounded text-xs font-medium hover:bg-slate-50 transition"><Share2 size={14} /> Share Invoice</button>
          <button onClick={copyId} className="flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 rounded text-xs font-medium hover:bg-slate-50 transition">
            <Copy size={14} /> {copied ? "Copied!" : "Copy Invoice ID"}
          </button>
        </div>

        <div className="p-6 md:p-10 space-y-8">
          {/* Header Section */}
          <div className="flex flex-col md:flex-row justify-between items-start gap-6">
            <div className="flex items-center gap-3">
              <div className="bg-slate-900 p-2 rounded-lg text-white">
                <ShoppingBag size={28} />
              </div>
              <div>
                <h1 className="text-3xl font-bold tracking-tight">Shopzy</h1>
                <p className="text-xs text-slate-500 font-medium">Happy Shopping</p>
              </div>
            </div>

            <div className="text-center flex-1">
              <h2 className="text-xl font-extrabold uppercase tracking-widest text-slate-900">Tax Invoice</h2>
              <p className="text-xs text-slate-500 mt-1">Thank you for shopping with Shopzy!</p>
            </div>

            <div className="text-right space-y-1">
              <h3 className="text-sm font-bold">Shopzy Private Limited</h3>
              <p className="text-[11px] text-slate-500">GSTIN: 22ABCDE1234F1Z5</p>
              <p className="text-[11px] text-slate-500 leading-tight">160, Ramnagar, Ward No 12,<br/>Ajad Chauk, Shivaji Marg,<br/>Durg, Chhattisgarh, 490023, India</p>
            </div>
          </div>

          {/* Info Bar Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-y-6 gap-x-4 p-5 bg-slate-50 rounded-xl border border-slate-100">
            {[
              { icon: FileText, label: "Invoice Number", value: data.invoiceNumber, mono: true },
              { icon: Package, label: "Order ID", value: data.orderNumber, mono: true },
              { icon: CalendarDays, label: "Order Date", value: formatDate(data.orderDate) },
              { icon: Truck, label: "Delivery Date", value: formatDate(data.deliveryDate) },
              { icon: BadgeCheck, label: "Order Status", value: <StatusBadge status={data.orderStatus} /> },
              { icon: CheckCircle2, label: "Payment Status", value: (String(data.paymentStatus || '').toLowerCase() === 'pending') ? '—' : <StatusBadge status={data.paymentStatus} /> },
              { icon: CreditCard, label: "Payment Method", value: data.paymentMethod },
              { icon: MapPin, label: "Place of Supply", value: data.placeOfSupply },
            ].map((item, i) => (
              <div key={i} className="space-y-1">
                <div className="flex items-center gap-1.5 text-slate-400">
                  <item.icon size={13} />
                  <span className="text-[10px] font-bold uppercase tracking-wider">{item.label}</span>
                </div>
                <div className={`text-xs font-semibold ${item.mono ? 'font-mono text-slate-900' : 'text-slate-700'}`}>{item.value}</div>
              </div>
            ))}
          </div>

          {/* Addresses */}
          <div className="grid md:grid-cols-2 gap-6">
            {["Billing Address", "Shipping Address"].map((title, i) => (
              <div key={i} className="p-5 border border-slate-200 rounded-xl relative">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 flex items-center gap-2">
                    <MapPin size={14} /> {title}
                  </h3>
                  {title === "Shipping Address" && (
                    <span className="bg-green-50 text-green-600 text-[10px] font-bold px-2 py-0.5 rounded-full border border-green-100 flex items-center gap-1">
                      <CheckCircle2 size={10} /> Billing & Shipping Same
                    </span>
                  )}
                </div>
                <div className="text-[13px] leading-relaxed space-y-1">
                  <p className="font-bold text-slate-900">{data.billingAddress.name}</p>
                  <p className="text-slate-600 font-medium">{data.billingAddress.phone}</p>
                  <p className="text-slate-500">{data.billingAddress.street}</p>
                  <p className="text-slate-500">{data.billingAddress.city}, {data.billingAddress.state} - {data.billingAddress.zip}</p>
                  <p className="text-slate-500">{data.billingAddress.country}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Items Table */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 flex items-center gap-2 px-1">
              <Package size={14} /> Order Items
            </h3>
            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <table className="w-full text-left text-[12px] border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold">
                    <th className="px-4 py-3">Product</th>
                    <th className="px-4 py-3">SKU</th>
                    <th className="px-4 py-3">Vendor</th>
                    <th className="px-4 py-3 text-center">Qty</th>
                    <th className="px-4 py-3 text-right">Unit Price</th>
                    <th className="px-4 py-3 text-right">GST</th>
                    <th className="px-4 py-3 text-right">Discount</th>
                    <th className="px-4 py-3 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {data.items.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50/50 transition">
                      <td className="px-4 py-4 flex gap-3 items-center">
                        {(() => {
                          const src = getImageSrcFor(item)
                          if (!src) return <div className="w-10 h-10 rounded-md border border-slate-100 bg-slate-50 flex items-center justify-center"><Package className="h-5 w-5 text-slate-400" /></div>
                          return (
                            <img
                              src={src}
                              alt={item.name || ''}
                              loading="lazy"
                              onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = defaultProductSvgSmall }}
                              className="w-10 h-10 rounded-md border border-slate-100 object-contain"
                            />
                          )
                        })()}
                        <div>
                          <p className="font-bold text-slate-900">{item.name}</p>
                          <p className="text-[10px] text-slate-400 font-medium tracking-tight">Color: {item.variant?.color || item.color || '—'} | Size: {item.variant?.size || item.size || '—'}</p>
                        </div>
                      </td>
                      <td className="px-4 py-4 font-mono text-slate-500">{item.sku}</td>
                      <td className="px-4 py-4">
                        <span className="text-slate-700 font-medium">{item.vendor}</span>
                        <div className="bg-indigo-50 text-indigo-600 text-[9px] font-bold px-1 py-0.5 rounded w-fit mt-1">VENDOR</div>
                      </td>
                      <td className="px-4 py-4 text-center font-bold">{item.quantity}</td>
                      <td className="px-4 py-4 text-right">{formatCurrency(item.unitPrice)}</td>
                      <td className="px-4 py-4 text-right">{item.gst}%</td>
                      <td className="px-4 py-4 text-right text-green-600 font-medium">-{formatCurrency(item.discount)}</td>
                      <td className="px-4 py-4 text-right font-bold text-slate-900">{formatCurrency(item.total)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Summary and Vendor Sub-orders Grid */}
          <div className="flex flex-col md:flex-row justify-end gap-10">
            <div className="w-full md:max-w-md space-y-4">
               <div className="space-y-2 text-[13px]">
                  {[
                    { label: "Subtotal", val: data.pricing.subtotal },
                    { label: "GST Total", val: data.pricing.gstTotal },
                    { label: "Coupon Discount", val: data.pricing.couponDiscount, neg: true },
                    { label: "Platform Discount", val: data.pricing.platformDiscount, neg: true },
                    { label: "Shipping Charges", val: data.pricing.shipping },
                    { label: "Handling Charges", val: data.pricing.handling },
                  ].map((p, i) => (
                    <div key={i} className="flex justify-between items-center px-2">
                      <span className="text-slate-500 font-medium">{p.label}</span>
                      <span className={`font-bold ${p.neg ? 'text-green-600' : 'text-slate-900'}`}>
                        {p.neg ? '-' : ''}{formatCurrency(p.val)}
                      </span>
                    </div>
                  ))}
                  <div className="mt-4 p-4 bg-indigo-50/50 border border-indigo-100 rounded-xl flex justify-between items-center">
                    <div className="text-slate-600 font-bold">Total Amount <span className="text-[10px] font-medium block text-slate-400 italic">(Inclusive of all taxes)</span></div>
                    <div className="text-2xl font-black text-indigo-600 tracking-tight">{formatCurrency(data.pricing.total)}</div>
                  </div>
               </div>
            </div>
          </div>

           {isVendor ? (
            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 flex items-center gap-2 px-1">
                <BadgeCheck size={14} /> Vendor Sub-Orders
              </h3>
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-left text-[11px] border-collapse">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold">
                    <tr>
                      <th className="px-4 py-2.5">Vendor</th>
                      <th className="px-4 py-2.5">Suborder ID</th>
                      <th className="px-4 py-2.5">Status</th>
                      <th className="px-4 py-2.5 text-right">Order Amount</th>
                      <th className="px-4 py-2.5 text-right">Commission (Deducted)</th>
                      <th className="px-4 py-2.5 text-right">Vendor Earnings</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.subOrders.map((so, idx) => (
                      <tr key={idx} className="border-b border-slate-100 last:border-none">
                        <td className="px-4 py-3 font-bold text-slate-800 flex items-center gap-2">
                          {so.vendor} <span className="bg-indigo-50 text-indigo-500 text-[8px] px-1 rounded uppercase">Vendor</span>
                        </td>
                        <td className="px-4 py-3 font-mono text-slate-500">{so.id}</td>
                        <td className="px-4 py-3"><StatusBadge status={so.status} /></td>
                        <td className="px-4 py-3 text-right font-bold">₹{so.amount}</td>
                        <td className="px-4 py-3 text-right text-slate-400">₹{so.commission}</td>
                        <td className="px-4 py-3 text-right font-bold text-slate-900">₹{so.earnings}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
           ) : null}

          {/* Payment Summary Bar */}
          <div className="space-y-3">
             <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 flex items-center gap-2 px-1">
                <Wallet size={14} /> Payment Summary
             </h3>
             <div className="grid grid-cols-2 md:grid-cols-5 gap-4 p-4 border border-slate-200 rounded-xl bg-white shadow-sm">
                {[
                  { icon: FileText, label: "Transaction ID", val: data.transactionId },
                  { icon: CheckCircle2, label: "Payment Gateway", val: data.gateway },
                  { icon: CreditCard, label: "Payment Type", val: "COD" },
                  { icon: CalendarDays, label: "Paid At", val: formatDate(data.orderDate) },
                  { icon: Wallet, label: "Refund Status", val: <StatusBadge status={data.refundStatus} /> },
                ].map((p, i) => (
                  <div key={i} className="space-y-1">
                    <p className="text-[10px] text-slate-400 font-bold flex items-center gap-1"><p.icon size={10}/> {p.label}</p>
                    <p className="text-[11px] font-bold text-slate-700">{p.val}</p>
                  </div>
                ))}
             </div>
          </div>

          {/* Footer Info */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 pt-6 border-t border-slate-100 text-slate-500">
            <div className="space-y-2">
              <h4 className="text-[11px] font-bold uppercase text-slate-900 tracking-wider">Return Policy</h4>
              <p className="text-[11px] leading-relaxed">You can return the product within 7 days of delivery. Visit our <span className="text-indigo-600 font-bold underline">Return Policy</span> page for more details.</p>
            </div>
            <div className="space-y-2">
              <h4 className="text-[11px] font-bold uppercase text-slate-900 tracking-wider">Need Help?</h4>
              <p className="text-[11px]">Email: <span className="text-indigo-600 font-medium underline">support@shopzy.com</span></p>
              <p className="text-[11px]">Phone: <span className="text-slate-900 font-bold">+91 1234567890</span></p>
            </div>
            {showAboutShopzy ? (
              <div className="space-y-2">
                <h4 className="text-[11px] font-bold uppercase text-slate-900 tracking-wider">About Shopzy</h4>
                <p className="text-[11px]">Shopzy Private Limited<br/>160, Ramnagar, Ward No 12,<br/>Durg, Chhattisgarh, 490023, India</p>
              </div>
            ) : null}
            <div className="space-y-3">
              <h4 className="text-[11px] font-bold uppercase text-slate-900 tracking-wider">Follow Us</h4>
              <div className="flex gap-4 text-slate-400">
                <svg className="h-4.5 w-4.5 cursor-pointer hover:text-blue-600" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M13.5 8.25H15V6h-1.5c-1.93 0-3.25 1.28-3.25 3.38V11H8.5v2.5h1.75V18H13v-4.5h1.95l.3-2.5H13V9.6c0-.86.28-1.35 1.5-1.35Z" />
                </svg>
                <svg className="h-4.5 w-4.5 cursor-pointer hover:text-pink-600" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M7.75 2h8.5A5.75 5.75 0 0 1 22 7.75v8.5A5.75 5.75 0 0 1 16.25 22h-8.5A5.75 5.75 0 0 1 2 16.25v-8.5A5.75 5.75 0 0 1 7.75 2Zm0 1.75A4 4 0 0 0 3.75 7.75v8.5a4 4 0 0 0 4 4h8.5a4 4 0 0 0 4-4v-8.5a4 4 0 0 0-4-4h-8.5ZM12 7.25A4.75 4.75 0 1 1 12 16.75 4.75 4.75 0 0 1 12 7.25Zm0 1.75a3 3 0 1 0 0 6 3 3 0 0 0 0-6Zm5.4-2.1a1.15 1.15 0 1 1 0 2.3 1.15 1.15 0 0 1 0-2.3Z" />
                </svg>
                <svg className="h-4.5 w-4.5 cursor-pointer hover:text-blue-400" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M19.6 7.2c.01.16.01.32.01.48 0 4.9-3.73 10.54-10.55 10.54-2.1 0-4.06-.62-5.71-1.68.29.04.58.06.88.06 1.75 0 3.36-.6 4.64-1.6a3.71 3.71 0 0 1-3.46-2.57c.23.03.46.05.71.05.33 0 .66-.05.97-.13a3.7 3.7 0 0 1-2.98-3.63v-.05c.49.27 1.05.43 1.64.45a3.69 3.69 0 0 1-1.62-3.07c0-.67.18-1.31.5-1.86a10.5 10.5 0 0 0 7.62 3.87 3.7 3.7 0 0 1 6.3-3.37 7.4 7.4 0 0 0 2.35-.9 3.72 3.72 0 0 1-1.62 2.05 7.3 7.3 0 0 0 2.12-.58 7.9 7.9 0 0 1-1.86 1.93Z" />
                </svg>
                <svg className="h-4.5 w-4.5 cursor-pointer hover:text-red-600" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M21.8 8.2a3 3 0 0 0-2.1-2.1C17.8 5.5 12 5.5 12 5.5s-5.8 0-7.7.6A3 3 0 0 0 2.2 8.2 31.7 31.7 0 0 0 1.7 12c0 1.3.2 2.6.5 3.8a3 3 0 0 0 2.1 2.1c1.9.5 7.7.5 7.7.5s5.8 0 7.7-.5a3 3 0 0 0 2.1-2.1c.3-1.2.5-2.5.5-3.8 0-1.3-.2-2.6-.5-3.8ZM10.2 15.3V8.7L15.8 12l-5.6 3.3Z" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-slate-50 py-4 text-center border-t border-slate-100">
          <p className="text-sm font-bold text-slate-700">Thank you for shopping with Shopzy! 😊</p>
        </div>
      </div>
    </div>
  );
};

export default InvoicePreview;