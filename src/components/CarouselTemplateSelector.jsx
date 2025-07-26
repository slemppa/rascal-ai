import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import Button from './Button'

const templates = [
  { id: 'template1', name: 'Moderni', image: '/carousel1.jpg', placidId: 'xpnx52obc7b5r' },
  { id: 'template2', name: 'Klassinen', image: '/carousel2.jpg', placidId: 'xv4vrp3ifldw3' }
];

export default function CarouselTemplateSelector() {
  const { user } = useAuth();
  const [selected, setSelected] = useState(templates[0].id);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSelect = (id) => setSelected(id);

  const handleSubmit = async () => {
    setLoading(true);
    setError('');
    setSuccess(false);
    try {
      const selectedTemplate = templates.find(t => t.id === selected);
      // Hae companyId Supabase-käyttäjästä
      const companyId = user?.user_metadata?.company_id || null;
      const res = await fetch('/api/carousel-template', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          templateId: selectedTemplate.placidId,
          companyId: companyId
        })
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Virhe lähetyksessä');
      }
      setSuccess(true);
    } catch (e) {
      setError(e.message || 'Tuntematon virhe');
    } finally {
      setLoading(false);
    }
  };

    return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: 16 }}>
      <h2 style={{ marginBottom: 16, fontSize: 16, fontWeight: 600, color: '#1f2937' }}>Valitse karusellin ulkoasu</h2>
      <div style={{ display: 'flex', gap: 16, marginBottom: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
        {templates.map((tpl) => (
          <div
            key={tpl.id}
            onClick={() => handleSelect(tpl.id)}
            style={{
              border: selected === tpl.id ? '3px solid #3b82f6' : '1px solid #e5e7eb',
              borderRadius: 12,
              padding: 12,
              cursor: 'pointer',
              background: selected === tpl.id ? '#eff6ff' : '#fff',
              transition: 'all 0.2s',
              textAlign: 'center',
              width: 160,
              boxSizing: 'border-box',
              boxShadow: selected === tpl.id ? '0 4px 24px rgba(59,130,246,0.10)' : '0 2px 8px rgba(0,0,0,0.07)',
              marginBottom: 8
            }}
          >
            <img src={tpl.image} alt={tpl.name} style={{ width: 160, height: 200, objectFit: 'cover', borderRadius: 8, marginBottom: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }} />
            <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 2 }}>{tpl.name}</div>
          </div>
        ))}
      </div>
      <Button
        onClick={handleSubmit}
        disabled={loading}
        style={{
          marginBottom: 8
        }}
      >
        {loading ? 'Lähetetään...' : 'Valitse'}
      </Button>
      {success && <div style={{ color: 'green', marginTop: 6, fontSize: 12 }}>Valinta lähetetty!</div>}
      {error && <div style={{ color: 'red', marginTop: 6, fontSize: 12 }}>{error}</div>}
    </div>
  );
} 