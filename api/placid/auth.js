import crypto from 'crypto';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // 1. Private API Secret (Signing key)
  const apiSecret = process.env.PLACID_API_TOKEN;
  
  // 2. Public SDK Token (Required in payload)
  const sdkToken = process.env.PLACID_SDK_TOKEN;

  // Tarkistetaan konfiguraatio
  if (!apiSecret) {
    console.error('PLACID_API_TOKEN missing');
    return res.status(503).json({ 
      error: 'CONFIGURATION_ERROR',
      message: 'Server configuration error: PLACID_API_TOKEN missing from environment.' 
    });
  }

  if (!sdkToken) {
    console.error('PLACID_SDK_TOKEN missing');
    return res.status(503).json({ 
      error: 'CONFIGURATION_ERROR',
      message: 'Server configuration error: PLACID_SDK_TOKEN missing from environment. Please add your Placid Public Token.' 
    });
  }

  try {
    // Header
    const header = {
      alg: 'HS256',
      typ: 'JWT'
    };

    // Payload - Dokumentaation mukainen rakenne
    const payload = {
      // Timestamps (seconds)
      exp: Math.floor(Date.now() / 1000) + (60 * 60), // 1 tunti
      iat: Math.floor(Date.now() / 1000),
      
      // Placid specific fields
      sdk_token: sdkToken, // Public Token
      
      // Scopes: Annetaan oikeus muokata kaikkia projektin templateja
      // (Voisi rajata myös per template-uuid: "template:{UUID}:write")
      scopes: [
        "templates:write",
        "templates:read"
      ],
      
      // Editor Options: Määritellään editorin toiminnallisuudet
      editor_options: {
        enableButtonSave: true,
        enableButtonSaveAndClose: true, // Lisätään Save & Close nappi
        enableTemplateRenaming: false, // Ei anneta nimetä uudelleen, jotta pysyy synkassa variablesin kanssa
        enableHistory: true,
        enableTestMode: false,
        editorMode: "fullscreen"
      }
    };

    const base64UrlEncode = (obj) => {
      const stringified = JSON.stringify(obj);
      return Buffer.from(stringified).toString('base64')
        .replace(/=/g, '')
        .replace(/\+/g, '-')
        .replace(/\//g, '_');
    };

    const encodedHeader = base64UrlEncode(header);
    const encodedPayload = base64UrlEncode(payload);

    const signatureInput = `${encodedHeader}.${encodedPayload}`;
    
    // Allekirjoitetaan API Secretillä
    const signature = crypto
      .createHmac('sha256', apiSecret)
      .update(signatureInput)
      .digest('base64')
      .replace(/=/g, '')
      .replace(/\+/g, '-')
      .replace(/\//g, '_');

    const token = `${encodedHeader}.${encodedPayload}.${signature}`;

    return res.status(200).json({ token });

  } catch (error) {
    console.error('Token generation error:', error);
    return res.status(500).json({ error: 'Token generation failed' });
  }
}
