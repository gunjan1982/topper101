import Razorpay from 'razorpay';

export function getRazorpay(): Razorpay {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;

  if (!keyId || !keySecret) {
    throw new Error(
      `Razorpay env vars missing: RAZORPAY_KEY_ID=${!!keyId}, RAZORPAY_KEY_SECRET=${!!keySecret}`
    );
  }

  // Create a new instance per request (serverless) — no singleton to avoid
  // caching an instance built with stale/missing env vars.
  return new Razorpay({ key_id: keyId, key_secret: keySecret });
}
