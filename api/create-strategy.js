import axios from 'axios';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Vain POST sallittu' });
  }

  const { month, strategy, companies } = req.body;
  if (!month || !strategy) {
    return res.status(400).json({ error: 'Kuukausi ja strategia vaaditaan' });
  }

  try {
    const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID || 'appeVatHuDQHlYuyX';
    const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY || 'patVf4zHcio3aIeiy.5a7cbd1d2334d16e965010c852499c3e3d8e0a8e2262011aa1b8b5fac50691ce';
    const AIRTABLE_API_URL = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/Content%20Strategy`;

    const fields = {
      Month: month,
      Strategy: strategy
    };
    if (companies && Array.isArray(companies) && companies.length > 0) {
      fields.Companies = companies;
    }

    const airtableRes = await axios.post(
      AIRTABLE_API_URL,
      {
        records: [
          { fields }
        ]
      },
      {
        headers: {
          Authorization: `Bearer ${AIRTABLE_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    const created = airtableRes.data.records && airtableRes.data.records[0];
    return res.status(200).json({ success: true, record: created });
  } catch (error) {
    console.error('Airtable create error:', error.response?.data || error.message);
    return res.status(500).json({ error: 'Strategian luonti epäonnistui', details: error.response?.data || error.message });
  }
} 