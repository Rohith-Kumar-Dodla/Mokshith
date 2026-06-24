const RAZORPAY_SCRIPT_URL = 'https://checkout.razorpay.com/v1/checkout.js';

let scriptPromise = null;

function safeLog(tag, payload) {
  try {
    // Console for local debugging; in production a monitoring tool will capture these
    console.info(`[RAZORPAY_SCRIPT] ${tag}`, payload ?? null);
    // Expose a global hook for test automation / analytics if needed
    if (typeof window !== 'undefined') {
      window.__RAZORPAY_SCRIPT_LOGS = window.__RAZORPAY_SCRIPT_LOGS || [];
      window.__RAZORPAY_SCRIPT_LOGS.push({ tag, payload, ts: Date.now() });
    }
  } catch (e) {
    // swallow
  }
}

export function loadRazorpayScript() {
  if (typeof window === 'undefined') {
    return Promise.reject(new Error('Razorpay is only available in the browser'));
  }

  if (window.Razorpay) {
    safeLog('SCRIPT_LOAD_SUCCESS', { reason: 'already_present' });
    return Promise.resolve(window.Razorpay);
  }

  if (!scriptPromise) {
    safeLog('SCRIPT_LOAD_STARTED', { url: RAZORPAY_SCRIPT_URL });
    scriptPromise = new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = RAZORPAY_SCRIPT_URL;
      script.async = true;
      script.onload = () => {
        safeLog('SCRIPT_LOAD_SUCCESS', { url: RAZORPAY_SCRIPT_URL, present: !!window.Razorpay });
        resolve(window.Razorpay);
      };
      script.onerror = (errEvent) => {
        // Capture underlying browser error object/event for debug
        const errPayload = {
          message: 'Failed to load Razorpay checkout script',
          url: RAZORPAY_SCRIPT_URL,
          event: errEvent && (errEvent.message || errEvent.type) ? errEvent : String(errEvent)
        };
        safeLog('SCRIPT_LOAD_FAILED', errPayload);
        // Reject with the raw event to preserve browser error details
        reject(new Error(`${errPayload.message}: ${String(errEvent)}`));
      };
      // Also set a timeout in case the script hangs (network issues / CSP blocked)
      const timeout = setTimeout(() => {
        const err = new Error('Razorpay script load timed out (10s)');
        safeLog('SCRIPT_LOAD_FAILED', { message: err.message, url: RAZORPAY_SCRIPT_URL });
        reject(err);
      }, 10000);

      script.addEventListener('load', () => clearTimeout(timeout));
      script.addEventListener('error', () => clearTimeout(timeout));

      document.body.appendChild(script);
    });
  }

  return scriptPromise;
}

export async function openRazorpayCheckout({
  amount,
  currency = 'INR',
  orderId,
  razorpayOrderId,
  customerName,
  customerEmail,
  customerPhone,
  description,
}) {
  const key = import.meta.env.VITE_RAZORPAY_KEY_ID;
  if (!key) {
    throw new Error('Razorpay key is not configured. Set VITE_RAZORPAY_KEY_ID.');
  }

  const Razorpay = await loadRazorpayScript();

  return new Promise((resolve, reject) => {
    const options = {
      key,
      amount: Math.round(Number(amount) * 100),
      currency,
      name: 'Mokshith Enterprises',
      description: description || 'Order payment',
      order_id: razorpayOrderId,
      prefill: {
        name: customerName || '',
        email: customerEmail || '',
        contact: customerPhone || '',
      },
      theme: { color: '#2563EB' },
      handler: (response) => {
        resolve({
          orderId,
          razorpay_order_id: response.razorpay_order_id,
          razorpay_payment_id: response.razorpay_payment_id,
          razorpay_signature: response.razorpay_signature,
        });
      },
      modal: {
        ondismiss: () => reject(new Error('Payment cancelled')),
      },
    };

    const checkout = new Razorpay(options);
    checkout.on('payment.failed', (response) => {
      reject(new Error(response?.error?.description || 'Payment failed'));
    });
    checkout.open();
  });
}
