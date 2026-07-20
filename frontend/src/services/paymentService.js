import api from "./api";

const RAZORPAY_SCRIPT_SRC = "https://checkout.razorpay.com/v1/checkout.js";

let scriptPromise = null;
const loadRazorpayScript = () => {
  if (window.Razorpay) return Promise.resolve(true);
  if (scriptPromise) return scriptPromise;

  scriptPromise = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = RAZORPAY_SCRIPT_SRC;
    script.onload = () => resolve(true);
    script.onerror = () => reject(new Error("Failed to load Razorpay checkout script"));
    document.body.appendChild(script);
  });
  return scriptPromise;
};

// Fetch which of the three methods (Smart PG / Direct UPI / Cash) this
// owner accepts, the convenience fee, and (if UPI is enabled) the owner's
// UPI ID + auto-generated QR code.
export const getPaymentOptions = (paymentId) =>
  api.get(`/payments/${paymentId}/options`).then((r) => r.data);

// Method 1 — Smart PG (Razorpay), auto-verified.
export const payWithRazorpay = async (paymentId, resident) => {
  await loadRazorpayScript();

  const { data: order } = await api.post(`/payments/${paymentId}/create-order`);

  return new Promise((resolve, reject) => {
    const rzp = new window.Razorpay({
      key: order.keyId,
      amount: order.amount,
      currency: order.currency,
      order_id: order.orderId,
      name: "Smart PG",
      description: "Rent Payment",
      prefill: { name: resident?.name, email: resident?.email },
      theme: { color: "#ff7a09" },
      handler: async (response) => {
        try {
          const { data } = await api.post(`/payments/${paymentId}/verify`, response);
          resolve(data);
        } catch (err) {
          reject(err);
        }
      },
      modal: {
        ondismiss: () => reject(new Error("Payment cancelled")),
      },
    });
    rzp.open();
  });
};

// Method 2 — Direct UPI: resident uploads a screenshot (+ optional
// transaction ID / notes); owner approves afterwards.
export const submitUpiPayment = (paymentId, { screenshot, transactionId, notes }) => {
  const formData = new FormData();
  formData.append("screenshot", screenshot);
  if (transactionId) formData.append("transactionId", transactionId);
  if (notes) formData.append("notes", notes);
  return api.post(`/payments/${paymentId}/submit-upi`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  }).then((r) => r.data);
};

// Method 3 — Cash: resident claims they paid the owner directly; owner approves.
export const submitCashPayment = (paymentId, { amount, date, notes }) =>
  api.post(`/payments/${paymentId}/submit-cash`, { amount, date, notes }).then((r) => r.data);

// Owner: approval queue + actions.
export const getOwnerPaymentRequests = () => api.get("/payments/owner/requests").then((r) => r.data);
export const approvePaymentRequest = (paymentId) => api.put(`/payments/${paymentId}/approve`).then((r) => r.data);
export const rejectPaymentRequest = (paymentId, reason) => api.put(`/payments/${paymentId}/reject`, { reason }).then((r) => r.data);

export const recordOfflinePayment = (paymentId, method, note) =>
  api.put(`/payments/${paymentId}/record-offline`, { method, note }).then((r) => r.data);

export const generateMonthlyRents = (pgId, month, year) =>
  api.post(`/payments/generate/${pgId}`, { month, year }).then((r) => r.data);

// Owner: which methods are accepted + UPI ID/QR.
export const getPaymentSettings = () => api.get("/payments/settings").then((r) => r.data);
export const updatePaymentSettings = (payload) => api.put("/payments/settings", payload).then((r) => r.data);

export const downloadInvoice = async (paymentId) => {
  const response = await api.get(`/payments/${paymentId}/invoice`, { responseType: "blob" });
  const url = window.URL.createObjectURL(new Blob([response.data]));
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", `receipt_${paymentId}.pdf`);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
};
