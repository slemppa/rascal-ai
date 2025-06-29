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

  const form = new formidable.IncomingForm();
  form.parse(req, async (err, fields, files) => {
    if (err) {
      return res.status(400).json({ error: 'Tiedoston vastaanotto epäonnistui' });
    }
    const file = files.file || files.files || Object.values(files)[0];
    if (!file) {
      return res.status(400).json({ error: 'Tiedosto puuttuu' });
    }
    try {
      const webhookUrl = process.env.N8N_ASSISTANT_KNOWLEDGE_URL;
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
        body: formData,
      });
      if (!response.ok) {
        throw new Error('Webhook epäonnistui');
      }
      return res.status(200).json({ success: true });
    } catch (e) {
      return res.status(500).json({ error: 'Tiedoston lähetys epäonnistui' });
    }
  });
} 