// api/lib/n8n-client.js
import { generateHmacSignature } from './crypto.js';

export async function sendToN8N(webhookUrl, payload) {
  const secret = process.env.N8N_SECRET_KEY;

  if (!secret) throw new Error('N8N_SECRET_KEY missing');
  if (!webhookUrl) throw new Error('N8N_WORKFLOW_URL missing');

  // Lähetetään vain HMAC-allekirjoitus HTTP headereina (standard webhook)
  const payloadString = JSON.stringify(payload);
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const signature = generateHmacSignature(payloadString, secret, timestamp);
  
  const headers = {
    'Content-Type': 'application/json',
    'x-rascal-timestamp': timestamp,         // HMAC timestamp
    'x-rascal-signature': signature          // HMAC signature
  };
  
  console.log('Sending to N8N with HMAC:', {
    url: webhookUrl,
    timestamp,
    signaturePreview: signature.substring(0, 20) + '...',
    payloadSize: payloadString.length,
    headers: Object.keys(headers)
  });

  const fetchOptions = {
    method: 'POST',
    headers,
    body: payloadString
  };

  const response = await fetch(webhookUrl, fetchOptions);

  if (!response.ok) {
    const errorText = await response.text().catch(() => 'No error details');
    console.error('N8N webhook error:', {
      status: response.status,
      statusText: response.statusText,
      headers: Object.fromEntries(response.headers.entries()),
      errorText
    });
    throw new Error(`N8N webhook failed with status ${response.status}: ${errorText.substring(0, 200)}`);
  }

  return await response.json().catch(() => ({ success: true }));
}