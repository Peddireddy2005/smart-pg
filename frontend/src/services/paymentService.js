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

/**
 * Opens the Razorpay checkout for a given pending payment record and
 * resolves with the verified, updated payment document on success.
 */
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

export const recordOfflinePayment = (paymentId, method, note) =>
  api.put(`/payments/${paymentId}/record-offline`, { method, note }).then((r) => r.data);

export const generateMonthlyRents = (pgId, month, year) =>
  api.post(`/payments/generate/${pgId}`, { month, year }).then((r) => r.data);

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
