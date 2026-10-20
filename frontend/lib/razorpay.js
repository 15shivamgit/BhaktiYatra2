const CHECKOUT_SRC = 'https://checkout.razorpay.com/v1/checkout.js';
let loading = null;

/**
 * Load Razorpay Checkout once, only on pages that take payments (docs/05-features/05-payments.md).
 * Resolves with the `Razorpay` constructor; a failed load can be retried.
 * @param {number} [timeoutMs]
 * @returns {Promise<any>}
 */
export function loadRazorpay(timeoutMs = 15_000) {
  if (typeof window === 'undefined') return Promise.reject(new Error('No window'));
  if (window.Razorpay) return Promise.resolve(window.Razorpay);
  if (loading) return loading;
  loading = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = CHECKOUT_SRC;
    script.async = true;
    const timer = setTimeout(
      () => fail(new Error('Razorpay Checkout took too long to load')),
      timeoutMs,
    );
    function fail(error) {
      clearTimeout(timer);
      script.remove();
      loading = null;
      reject(error);
    }
    script.onload = () => {
      clearTimeout(timer);
      if (window.Razorpay) resolve(window.Razorpay);
      else fail(new Error('Razorpay Checkout did not initialise'));
    };
    script.onerror = () => fail(new Error('Could not load Razorpay Checkout'));
    document.head.appendChild(script);
  });
  return loading;
}

/** BhaktiYatra primary colour for the Checkout theme. */
export const CHECKOUT_THEME = '#B4580F';
