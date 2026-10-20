/*
 * Test double for https://checkout.razorpay.com/v1/checkout.js (served by Playwright routes).
 * window.__rzpScenario: 'success' (default) | 'fail' | 'dismiss'. On success it signs
 * "order_id|payment_id" with window.__rzpSecret exactly like Razorpay, so the API's real
 * verify path runs. window.__rzpOpened counts how often Checkout was opened.
 */
(function installRazorpayStub() {
  async function hmacHex(secret, message) {
    const enc = new TextEncoder();
    const key = await crypto.subtle.importKey(
      'raw',
      enc.encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign'],
    );
    const signature = await crypto.subtle.sign('HMAC', key, enc.encode(message));
    return [...new Uint8Array(signature)].map((b) => b.toString(16).padStart(2, '0')).join('');
  }

  window.Razorpay = function Razorpay(options) {
    const handlers = {};
    return {
      on(event, fn) {
        handlers[event] = fn;
      },
      async open() {
        window.__rzpOpened = (window.__rzpOpened ?? 0) + 1;
        window.__rzpLastOptions = {
          key: options.key,
          order_id: options.order_id,
          amount: options.amount,
        };
        const scenario = window.__rzpScenario ?? 'success';
        await new Promise((resolve) => setTimeout(resolve, 50));
        if (scenario === 'dismiss') {
          options.modal?.ondismiss?.();
          return;
        }
        if (scenario === 'fail') {
          handlers['payment.failed']?.({
            error: { code: 'BAD_REQUEST_ERROR', description: 'Card declined by bank' },
          });
          return;
        }
        const paymentId = `pay_${options.order_id.replace(/^order_/, '')}`;
        const signature = await hmacHex(window.__rzpSecret, `${options.order_id}|${paymentId}`);
        options.handler({
          razorpay_order_id: options.order_id,
          razorpay_payment_id: paymentId,
          razorpay_signature: signature,
        });
      },
      close() {},
    };
  };
})();
