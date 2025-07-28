import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import Button from './Button';
import './CarouselTemplateSelector.css';

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
    <div className="carousel-selector">
      <h2 className="carousel-title">Valitse karusellin ulkoasu</h2>
      <div className="templates-grid">
        {templates.map((tpl) => (
          <div
            key={tpl.id}
            onClick={() => handleSelect(tpl.id)}
            className={`template-card ${selected === tpl.id ? 'selected' : ''}`}
          >
            <img src={tpl.image} alt={tpl.name} className="template-image" />
            <div className="template-name">{tpl.name}</div>
          </div>
        ))}
      </div>
      <Button
        onClick={handleSubmit}
        disabled={loading}
        className="submit-button"
      >
        {loading ? 'Lähetetään...' : 'Valitse'}
      </Button>
      {success && <div className="success-message">Valinta lähetetty!</div>}
      {error && <div className="error-message">{error}</div>}
    </div>
  );
} 