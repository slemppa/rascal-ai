import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import Button from './Button';
import { useTranslation } from 'react-i18next';
import './CarouselTemplateSelector.css';

const templates = [
  { id: 'template1', name: 'Moderni', image: '/carousel1.jpg', placidId: 'xpnx52obc7b5r' },
  { id: 'template2', name: 'Klassinen', image: '/carousel2.jpg', placidId: 'xv4vrp3ifldw3' }
];

export default function CarouselTemplateSelector() {
  const { user } = useAuth();
  const { t } = useTranslation('common');
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
      
      // Hae companyId Supabase users-taulusta
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('company_id')
        .eq('auth_user_id', user.id)
        .single()
      
      if (userError || !userData?.company_id) {
        throw new Error(t('settings.carousel.userCompanyMissing'));
      }
      
      const res = await fetch('/api/carousel-template', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          templateId: selectedTemplate.placidId,
          companyId: userData.company_id
        })
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || t('settings.carousel.sendError'));
      }
      setSuccess(true);
    } catch (e) {
      setError(e.message || t('settings.carousel.unknownError'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="carousel-selector">
      <h2 className="carousel-title">{t('settings.carousel.title')}</h2>
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
        {loading ? t('settings.carousel.sending') : t('settings.carousel.select')}
      </Button>
      {success && <div className="success-message">{t('settings.carousel.sent')}</div>}
      {error && <div className="error-message">{error}</div>}
    </div>
  );
} 