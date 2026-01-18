import crypto from 'crypto';
import { withOrganization } from '../_middleware/with-organization.js';

async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Ota vastaan template_id query-parametreista
  const { template_id } = req.query;

  if (!template_id) {
    return res.status(400).json({ error: 'Missing template_id' });
  }

  // TARKISTA OMISTAJUUS: Varmista, että tämä template kuuluu tälle organisaatiolle
  // req.organization.id tulee withOrganization-middlewaresta
  const { data: template, error: dbError } = await req.supabase
    .from('variables')
    .select('id, placid_id')
    .eq('placid_id', template_id)
    .eq('user_id', req.organization.id) // user_id viittaa organisaatioon variables-taulussa
    .single();

  if (dbError || !template) {
    console.error('Unauthorized access attempt to template:', template_id, req.organization.id);
    return res.status(403).json({ error: 'Unauthorized: You do not own this template' });
  }

  // 1. Private API Secret (Signing key)
  const apiSecret = process.env.PLACID_API_TOKEN;
  
  // 2. Public SDK Token (Required in payload)
  const sdkToken = process.env.PLACID_SDK_TOKEN;

  // Tarkistetaan konfiguraatio
  if (!apiSecret || !sdkToken) {
    return res.status(503).json({ 
      error: 'CONFIGURATION_ERROR',
      message: 'Missing API keys' 
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
      
      // RAJAA OIKEUDET: Vaikka Placid ei tukisi resource-scopeja, 
      // omistajuustarkistus (yllä) estää jo luvattoman tokenin luonnin.
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

// Wrap handler withOrganization-middlewareen
export default withOrganization(handler);
