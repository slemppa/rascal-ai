import formidable from 'formidable';
import fs from 'fs';

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Vain POST sallittu' });
  }

  try {
    const webhookUrl = process.env.N8N_ASSISTANT_KNOWLEDGE_URL;
    const N8N_SECRET_KEY = process.env.N8N_SECRET_KEY;

    if (!webhookUrl) {
      console.error('N8N_ASSISTANT_KNOWLEDGE_URL puuttuu')
      return res.status(500).json({ error: 'Webhook URL ei ole konfiguroitu' })
    }

    if (!N8N_SECRET_KEY) {
      console.error('N8N_SECRET_KEY puuttuu')
      return res.status(500).json({ error: 'API-avain ei ole konfiguroitu' })
    }

    const form = new formidable.IncomingForm();
    form.parse(req, async (err, fields, files) => {
      if (err) {
        console.error('Formidable virhe:', err)
        return res.status(400).json({ error: 'Tiedoston vastaanotto epäonnistui' });
      }

      const file = files.file || files.files || Object.values(files)[0];
      if (!file) {
        return res.status(400).json({ error: 'Tiedosto puuttuu' });
      }

      console.log('Kutsu N8N webhookia:', webhookUrl)
      console.log('Fields:', fields)
      console.log('Files:', Object.keys(files))

      try {
        const formData = new FormData();
        // Tuki usealle tiedostolle
        if (Array.isArray(file)) {
          file.forEach(f => formData.append('files', fs.createReadStream(f.filepath), f.originalFilename));
        } else {
          formData.append('files', fs.createReadStream(file.filepath), file.originalFilename);
        }
        formData.append('companyId', fields.companyId);
        formData.append('assistantId', fields.assistantId);
        formData.append('action', 'feed');

        const response = await fetch(webhookUrl, {
          method: 'POST',
          headers: {
            'x-api-key': N8N_SECRET_KEY
          },
          body: formData,
        });

        if (!response.ok) {
          console.error('N8N webhook vastasi virheellä:', response.status, response.statusText)
          return res.status(response.status).json({ 
            error: 'Webhook-virhe', 
            status: response.status,
            statusText: response.statusText
          })
        }

        return res.status(200).json({ success: true });
      } catch (e) {
        console.error('Virhe upload-knowledge endpointissa:', e)
        return res.status(500).json({ error: 'Tiedoston lähetys epäonnistui', details: e.message });
      }
    });
  } catch (e) {
    console.error('Virhe upload-knowledge endpointissa:', e)
    return res.status(500).json({ error: 'Virhe tiedoston käsittelyssä', details: e.message });
  }
} 