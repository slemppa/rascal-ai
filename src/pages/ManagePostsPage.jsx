import React, { useState, useEffect } from 'react'
import axios from 'axios'
import PageHeader from '../components/PageHeader'
import styles from './ManagePostsPage.module.css'

// Päivitetty media-logiikka korttiin
const getMediaElement = (mediaArr, alt, isLarge, post, segments) => {
  // Jos Carousel, näytä ensimmäisen sliden media/teksti
  if (post && post.Type === 'Carousel' && Array.isArray(segments)) {
    const firstSlide = segments
      .filter(seg => Array.isArray(seg.Content) && (seg.Content.includes(post["Record ID"]) || seg.Content.includes(post.id)))
      .sort((a, b) => parseInt(a["Slide No."]) - parseInt(b["Slide No."]))[0];
    if (firstSlide) {
      if (firstSlide.Media && Array.isArray(firstSlide.Media) && firstSlide.Media[0] && firstSlide.Media[0].url) {
        return (
          <div className={styles.bentoMediaWrapper}>
            <img src={firstSlide.Media[0].url} alt={alt} className={styles.bentoMedia} />
          </div>
        );
      } else if (firstSlide.Text) {
        return (
          <div className={styles.bentoMediaWrapper} style={{display:'flex',alignItems:'center',justifyContent:'center',background:'#f3f4f6'}}>
            <span style={{fontSize:22,fontWeight:600,textAlign:'center',color:'#222',padding:16}}>{firstSlide.Text}</span>
          </div>
        );
      }
    }
    // Jos ei slideja, näytä placeholder
    return (
      <div className={styles.bentoMediaWrapper}>
        <img src={process.env.BASE_URL ? process.env.BASE_URL + '/placeholder.png' : '/placeholder.png'} alt="Ei mediaa" className={styles.bentoMedia} />
      </div>
    );
  }
  // Muut post-tyypit kuten ennen
  if (!mediaArr || !Array.isArray(mediaArr) || !mediaArr[0] || !mediaArr[0].url) {
    return (
      <div className={styles.bentoMediaWrapper}>
        <img src={process.env.BASE_URL ? process.env.BASE_URL + '/placeholder.png' : '/placeholder.png'} alt="Ei mediaa" className={styles.bentoMedia} />
      </div>
    )
  }
  const media = mediaArr[0]
  const url = media.url
  const type = media.type || ''

  if (type.startsWith('video/')) {
    return (
      <div className={styles.bentoMediaWrapper}>
        <video
          src={url}
          controls
          className={styles.bentoMedia}
        />
      </div>
    )
  }
  if (type.startsWith('image/')) {
    return (
      <div className={styles.bentoMediaWrapper}>
        <img src={url} alt={alt} className={styles.bentoMedia} />
      </div>
    )
  }
  // Fallback: päätteen mukaan
  if (url.endsWith('.mp4') || url.endsWith('.webm')) {
    return (
      <div className={styles.bentoMediaWrapper}>
        <video
          src={url}
          controls
          className={styles.bentoMedia}
        />
      </div>
    )
  }
  return (
    <div className={styles.bentoMediaWrapper}>
      <img src={url} alt={alt} className={styles.bentoMedia} />
    </div>
  )
}

// Helperit
const getPostTitle = (post) => post.Idea || post.title || post.Title || '';
const getPostDescription = (post) => post.Caption || post.Voiceover || post.desc || post.Description || '';

// Status-värit
const getStatusColor = (status) => {
  switch (status) {
    case 'Under Review':
      return { background: '#fef3c7', text: '#d97706' }; // Keltainen
    case 'Scheduled':
      return { background: '#dbeafe', text: '#2563eb' }; // Sininen
    case 'Done':
      return { background: '#dcfce7', text: '#16a34a' }; // Vihreä
    case 'Draft':
      return { background: '#f3f4f6', text: '#6b7280' }; // Harmaa
    case 'Rejected':
      return { background: '#fee2e2', text: '#dc2626' }; // Punainen
    case 'Archived':
      return { background: '#f3e8ff', text: '#9333ea' }; // Violetti
    default:
      return { background: '#f3f4f6', text: '#6b7280' }; // Oletus harmaa
  }
};

// Katkaise idea-teksti sanan jälkeen ja lisää '...' jos pitkä
function truncateWords(text, maxWords = 8) {
  if (!text) return '';
  const words = text.split(' ');
  if (words.length <= maxWords) return text;
  return words.slice(0, maxWords).join(' ') + '...';
}

// Palauta span-luokka kuvasuhteen perusteella
const getGridSpans = (media) => {
  if (!media || !media[0]) return '';
  const { width, height } = media[0];
  if (!width || !height) return '';
  const ratio = width / height;
  // 16:9
  if (Math.abs(ratio - 16/9) < 0.1) return styles.spanWide;
  // 9:16
  if (Math.abs(ratio - 9/16) < 0.1) return styles.spanTall;
  // 3:4
  if (Math.abs(ratio - 3/4) < 0.1) return styles.spanTall;
  // 1:1
  if (Math.abs(ratio - 1) < 0.1) return styles.spanSquare;
  // fallback
  return styles.spanSquare;
};

// Karuselli-komponentti Carousel-tyypin tietueille
function CarouselMedia({ post, segments }) {
  // Hae kaikki segmentit, joiden Content sisältää tämän Carouselin Record ID:n
  const postId = post["Record ID"] || post.id;
  const relatedSlides = segments
    .filter(seg => {
      // Tarkista onko segmentillä Slide No. (eli se on slide)
      if (!seg["Slide No."]) return false;
      
      // Tarkista onko Content-kentässä tämän postin ID
      if (Array.isArray(seg.Content)) {
        return seg.Content.some(content => 
          content === postId || 
          content.includes(postId) ||
          (typeof content === 'string' && content.includes(postId))
        );
      }
      
      return false;
    })
    .sort((a, b) => parseInt(a["Slide No."]) - parseInt(b["Slide No."]));

  const [currentSlide, setCurrentSlide] = useState(0);

  if (relatedSlides.length === 0) {
    return (
      <div className={styles.carouselContainer}>
        <div style={{padding: 16, color: '#666', fontSize: 14, textAlign: 'center'}}>
          Ei slideja saatavilla
        </div>
        <img
          src={process.env.BASE_URL ? process.env.BASE_URL + '/placeholder.png' : '/placeholder.png'}
          alt="Ei slideja"
          className={styles.carouselImage}
        />
      </div>
    );
  }

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % relatedSlides.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + relatedSlides.length) % relatedSlides.length);
  };

  const currentPost = relatedSlides[currentSlide];
  let imageUrl = null;
  

  
  if (currentPost.Media && Array.isArray(currentPost.Media) && currentPost.Media[0] && currentPost.Media[0].url) {
    imageUrl = currentPost.Media[0].url;
  }
  


  return (
    <div className={styles.carouselContainer}>
      <div className={styles.carouselWrapper}>
        <button
          onClick={prevSlide}
          className={styles.carouselButton}
          style={{ left: 10 }}
          aria-label="Edellinen kuva"
        >
          ‹
        </button>

        <div className={styles.carouselContent}>
          <div className={styles.carouselImageContainer}>
            {imageUrl ? (
              <img
                key={`${currentPost["Slide No."]}-${imageUrl}`}
                src={imageUrl}
                alt={`Slide ${currentPost["Slide No."]}`}
                className={styles.carouselImage}
              />
            ) : (
              <span style={{fontSize:28,fontWeight:600,textAlign:'center',color:'#222',padding:16,display:'block',width:'100%'}}>{currentPost.Text}</span>
            )}
          </div>
          <div className={styles.carouselInfo}>
            <div className={styles.slideNumber}>Slide {currentPost["Slide No."]}</div>
            <div className={styles.slideText}>{currentPost.Text}</div>
          </div>
        </div>

        <button
          onClick={nextSlide}
          className={styles.carouselButton}
          style={{ right: 10 }}
          aria-label="Seuraava kuva"
        >
          ›
        </button>
      </div>

      <div className={styles.carouselDots}>
        {relatedSlides.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentSlide(index)}
            className={`${styles.carouselDot} ${index === currentSlide ? styles.carouselDotActive : ''}`}
            aria-label={`Siirry kuvaan ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
}

function PostModal({ post, onClose, allPosts, segments }) {
  const [caption, setCaption] = useState(post.Caption || '');
  const [voiceover, setVoiceover] = useState(post.Voiceover || '');
  const [voiceoverConfirmed, setVoiceoverConfirmed] = useState(post.VoiceoverConfirmed || false);
  // Alusta publishDate datetime-local -muodossa (esim. 2024-07-01T12:34)
  const initialDate = post["Publish Date"] ? new Date(post["Publish Date"]).toISOString().slice(0, 16) : '';
  const [publishDate, setPublishDate] = useState(initialDate);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  // Tarkista onko julkaisupäivä asetettu
  const hasPublishDate = publishDate && publishDate.trim() !== '';
  
  // Tarkista onko valittu päivämäärä menneisyydessä
  const isPastDate = publishDate && new Date(publishDate) < new Date();
  
  // Hae nykyinen päivämäärä datetime-local -muodossa
  const getCurrentDateTime = () => {
    const now = new Date();
    return now.toISOString().slice(0, 16);
  };

  useEffect(() => {
    function handleEsc(e) {
      if (e.key === 'Escape') onClose();
    }
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleEsc);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleEsc);
    };
  }, [onClose]);

  if (!post) return null;

  const media = post.Media && Array.isArray(post.Media) && post.Media[0] && post.Media[0].url ? post.Media[0].url : null;
  const mediaType = post.Media && Array.isArray(post.Media) && post.Media[0] ? post.Media[0].type : null;
  const isVideo = media && (
    mediaType?.startsWith('video/') || 
    media.endsWith('.mp4') || 
    media.endsWith('.webm') || 
    media.endsWith('.mov') ||
    media.endsWith('.avi')
  );
  const isCarousel = post.Type === 'Carousel';
  


  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Tarkista ettei julkaisupäivä ole menneisyydessä
    if (publishDate && new Date(publishDate) < new Date()) {
      setError('Julkaisupäivä ei voi olla menneisyydessä');
      return;
    }
    
    // Tarkista voiceover vahvistus Reels-tyyppisille
    if (post.Type === 'Reels' && voiceover.trim() && !voiceoverConfirmed) {
      setError('Vahvista voiceover ennen tallennusta');
      return;
    }
    
    setLoading(true);
    setError(null);
    setSuccess(false);
    try {
      await axios.post('/api/update-post.js', {
        id: post["Record ID"] || post.id,
        Caption: caption,
        Voiceover: voiceover,
        VoiceoverConfirmed: voiceoverConfirmed,
        "Publish Date": publishDate,
        updateType: 'postUpdate',
        action: 'save'
      });
      setSuccess(true);
      setTimeout(() => onClose(), 1000);
    } catch (err) {
      setError('Tallennus epäonnistui');
    } finally {
      setLoading(false);
    }
  };

  const handleSchedule = async () => {
    // Tarkista ettei julkaisupäivä ole menneisyydessä
    if (publishDate && new Date(publishDate) < new Date()) {
      setError('Julkaisupäivä ei voi olla menneisyydessä');
      return;
    }
    
    // Tarkista voiceover vahvistus Reels-tyyppisille
    if (post.Type === 'Reels' && voiceover.trim() && !voiceoverConfirmed) {
      setError('Vahvista voiceover ennen ajastusta');
      return;
    }
    
    setLoading(true);
    setError(null);
    setSuccess(false);
    try {
      await axios.post('/api/update-post.js', {
        id: post["Record ID"] || post.id,
        Caption: caption,
        Voiceover: voiceover,
        VoiceoverConfirmed: voiceoverConfirmed,
        "Publish Date": publishDate,
        updateType: 'postUpdate',
        action: 'schedule'
      });
      setSuccess(true);
      setTimeout(() => onClose(), 1000);
    } catch (err) {
      setError('Ajastus epäonnistui');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Haluatko varmasti poistaa tämän julkaisun? Tätä toimintoa ei voi perua.')) {
      return;
    }
    
    setLoading(true);
    setError(null);
    setSuccess(false);
    try {
      await axios.post('/api/update-post.js', {
        id: post["Record ID"] || post.id,
        updateType: 'postUpdate',
        action: 'delete'
      });
      setSuccess(true);
      setTimeout(() => onClose(), 1000);
    } catch (err) {
      setError('Poisto epäonnistui');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modal}>
        <button onClick={onClose} className={styles.modalClose}>×</button>
        <div className={styles.modalMedia} style={{marginBottom: 24}}>
          {isCarousel ? (
            <CarouselMedia post={post} segments={segments} />
          ) : media ? (
            isVideo ? (
              <video src={media} controls className={styles.modalMediaContent} />
            ) : (
              <img src={media} alt={getPostTitle(post) || 'Julkaisukuva'} className={styles.modalMediaContent} />
            )
          ) : (
            <img 
              src={process.env.BASE_URL ? process.env.BASE_URL + '/placeholder.png' : '/placeholder.png'} 
              alt="Ei mediaa" 
              className={styles.modalMediaContent} 
            />
          )}
        </div>
        {/* Type ja Status badge Captionin yhteyteen */}
        <form className={styles.modalContent} onSubmit={handleSubmit}>
          <div style={{display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8}}>
            {post.Type && <span className={styles.typeBadge}>{post.Type}</span>}
            {post.Status && <span className={styles.statusBadge}>{post.Status}</span>}
          </div>
          <label className={styles.modalLabel} style={{marginBottom: 10}}>
            <span style={{fontWeight: 600, fontSize: 15}}>Kuvaus</span>
            <textarea
              value={caption}
              onChange={e => setCaption(e.target.value)}
              rows={6}
              className={styles.modalTextarea}
              style={{width: '100%', marginTop: 6, marginBottom: 18}}
              placeholder="Kirjoita julkaisun kuvaus..."
            />
          </label>
          {/* Voiceover Reels-postauksille */}
          {post.Type === 'Reels' && (
            <div style={{marginBottom: 18}}>
              <label className={styles.modalLabel}>
                <span style={{fontWeight: 600, fontSize: 15}}>Voiceover</span>
                <textarea
                  value={voiceover}
                  onChange={e => setVoiceover(e.target.value)}
                  rows={4}
                  className={styles.modalTextarea}
                  style={{width: '100%', marginTop: 6, marginBottom: 12}}
                  placeholder="Kirjoita voiceover-teksti..."
                />
              </label>
              {/* Voiceover vahvistus checkbox */}
              <div className={styles.voiceoverCheckbox}>
                <input
                  type="checkbox"
                  id="voiceover-confirm"
                  checked={voiceoverConfirmed}
                  onChange={e => setVoiceoverConfirmed(e.target.checked)}
                />
                <label htmlFor="voiceover-confirm">
                  Vahvistan että voiceover on valmis ja tarkistettu
                </label>
              </div>
            </div>
          )}
          <label className={styles.modalLabel} style={{marginBottom: 18}}>
            <span style={{fontWeight: 600, fontSize: 15}}>Julkaisupäivä</span>
            <input
              type="datetime-local"
              value={publishDate}
              onChange={e => setPublishDate(e.target.value)}
              min={getCurrentDateTime()}
              className={styles.modalInput}
              style={{marginTop: 6}}
            />
            {isPastDate && (
              <div className={styles.dateError}>
                ⚠️ Julkaisupäivä ei voi olla menneisyydessä
              </div>
            )}
          </label>
          {/* Ajasta-nappi */}
          {hasPublishDate && (
            <div style={{marginBottom: 18}}>
              <button
                type="button"
                className={styles.scheduleButton}
                onClick={handleSchedule}
                disabled={loading}
              >
                ⏰ Ajasta julkaisu
              </button>
            </div>
          )}
          {error && <div className={styles.modalError}>{error}</div>}
          {success && <div className={styles.modalSuccess}>Tallennettu!</div>}
          <div style={{display: 'flex', gap: 12, marginTop: 18}}>
            <button type="button" onClick={onClose} className={styles.secondaryButton} disabled={loading}>Peruuta</button>
            <button type="submit" className={styles.viewButton} disabled={loading}>Tallenna</button>
            <button type="button" onClick={handleDelete} className={styles.deleteButton} disabled={loading}>
              🗑️ Poista
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function ManagePostsPage() {
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [typeFilter, setTypeFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [selectedPost, setSelectedPost] = useState(null)
  const [segments, setSegments] = useState([])
  const [monthlyLimitReached, setMonthlyLimitReached] = useState(false)
  const [postsThisMonth, setPostsThisMonth] = useState(0)
  const [activeTab, setActiveTab] = useState('julkaisut') // Lisätty välilehti-tila
  
  // Generointimodaalien state-muuttujat
  const [showGenerationModal, setShowGenerationModal] = useState(false)
  const [generationType, setGenerationType] = useState('')
  const [generationIdea, setGenerationIdea] = useState('')
  const [generationLoading, setGenerationLoading] = useState(false)
  const [generationError, setGenerationError] = useState('')
  const [generationSuccess, setGenerationSuccess] = useState('')

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        setLoading(true)
        setError(null)
        const companyId = JSON.parse(localStorage.getItem('user') || 'null')?.companyId
        const url = `/api/get-posts${companyId ? `?companyId=${companyId}` : ''}`
        const response = await axios.get(url)
        // Oikea datan purku
        const all = Array.isArray(response.data?.[0]?.data) ? response.data[0].data : [];
        // Näytä kaikki postaukset, ei vain tiettyjä statuksia
        setPosts(all.filter(p => !p["Slide No."])); // Suodata pois vain slide-tiedostot
        setSegments(all.filter(p => p["Slide No."]));
        
        // Laske kuukausirajoitus
        const now = new Date()
        const currentMonth = now.getMonth()
        const currentYear = now.getFullYear()
        const postsThisMonth = all.filter(post => {
          // Suodata pois slide-tiedostot (joilla on "Slide No." -kenttä)
          if (post["Slide No."]) return false
          
          const date = post["createdTime"] ? new Date(post["createdTime"]) : null
          return date && date.getMonth() === currentMonth && date.getFullYear() === currentYear
        }).length
        
        const monthlyLimit = 30
        setPostsThisMonth(postsThisMonth)
        setMonthlyLimitReached(postsThisMonth >= monthlyLimit)
      } catch (err) {
        setError('Virhe haettaessa julkaisuja')
      } finally {
        setLoading(false)
      }
    }
    fetchPosts()
  }, [])

  // Hae uniikit tyypit ja statukset
  const types = [...new Set(posts.map(post => post.Type).filter(Boolean))]
  const statuses = [...new Set(posts.map(post => post.Status).filter(Boolean))]

  // Suodata julkaisut tyypin ja statusin mukaan
  const filteredPosts = posts.filter(post => {
    const typeMatch = !typeFilter || post.Type === typeFilter
    const statusMatch = !statusFilter || post.Status === statusFilter
    return typeMatch && statusMatch
  })

  const formatDate = (dateString) => {
    if (!dateString) return '-'
    try {
      return new Date(dateString).toLocaleDateString('fi-FI')
    } catch {
      return dateString
    }
  }

  // Generointimodaalin avaaminen
  const openGenerationModal = (type) => {
    setGenerationType(type)
    setGenerationIdea('')
    setGenerationError('')
    setGenerationSuccess('')
    setShowGenerationModal(true)
  }

  // Generointimodaalin sulkeminen
  const closeGenerationModal = () => {
    setShowGenerationModal(false)
    setGenerationType('')
    setGenerationIdea('')
    setGenerationError('')
    setGenerationSuccess('')
  }

  // Idean lähettäminen
  const handleIdeaGeneration = async (e) => {
    e.preventDefault()
    
    if (!generationIdea.trim()) {
      setGenerationError('Syötä idea ennen lähettämistä')
      return
    }
    
    setGenerationLoading(true)
    setGenerationError('')
    setGenerationSuccess('')
    
    try {
      // Hae käyttäjätiedot localStoragesta
      const user = JSON.parse(localStorage.getItem('user') || 'null')
      const companyId = user?.companyId || user?.user?.companyId
      
      console.log('Debug - Käyttäjätiedot:', { 
        user: user, 
        companyId: companyId, 
        generationType: generationType,
        generationIdea: generationIdea
      })
      
      if (!companyId) {
        throw new Error('Käyttäjätiedot puuttuvat')
      }
      
      const requestData = {
        idea: generationIdea,
        type: generationType,
        companyId: companyId
        // x-api-key käsitellään backend-puolella N8N_SECRET_KEY ympäristömuuttujasta
      }
      
      console.log('Debug - Lähetetään data:', requestData)
      
      const response = await axios.post('/api/idea-generation.js', requestData)
      
      console.log('Debug - Vastaus:', response.data)
      
      setGenerationSuccess('Idea lähetetty onnistuneesti!')
      setTimeout(() => {
        closeGenerationModal()
      }, 2000)
      
    } catch (err) {
      console.error('Debug - Virhe:', err)
      console.error('Debug - Virhe response:', err.response?.data)
      setGenerationError(err.response?.data?.error || 'Virhe idean lähettämisessä')
    } finally {
      setGenerationLoading(false)
    }
  }

  return (
    <>
      <PageHeader title="Julkaisujen hallinta" />
      
      {/* Kuukausirajoituksen varoitus */}
      {monthlyLimitReached && (
        <div style={{
          background: '#fef2f2',
          border: '1px solid #fecaca',
          borderRadius: 8,
          padding: '16px 20px',
          margin: '0 32px 24px 32px',
          color: '#dc2626',
          fontSize: 14,
          fontWeight: 500,
          display: 'flex',
          alignItems: 'center',
          gap: 8
        }}>
          ⚠️ Kuukausirajoitus saavutettu ({postsThisMonth}/30). Et voi luoda uusia julkaisuja tässä kuussa.
        </div>
      )}
      
      <div className={styles.container} style={{ padding: 0 }}>
        {/* Wrapper-elementti välilehdille ja sisällölle */}
        <div style={{ flex: 1, minHeight: 0 }}>
          {/* Välilehdet - samalla tyylillä kuin /calls ja /assistant */}
          <div style={{
            display: 'flex',
            borderBottom: '2px solid #e5e7eb',
            background: '#f9fafb',
            flexShrink: 0,
            padding: '0 32px',
            gap: 0,
            height: 48,
            margin: 0,
            width: '100%'
          }}>
            <button
              onClick={() => setActiveTab('julkaisut')}
              style={{
                flex: 1,
                height: '100%',
                border: 'none',
                background: activeTab === 'julkaisut' ? '#fff' : 'transparent',
                color: activeTab === 'julkaisut' ? 'var(--brand-dark, #1f2937)' : '#6b7280',
                fontWeight: activeTab === 'julkaisut' ? 700 : 500,
                cursor: 'pointer',
                borderBottom: activeTab === 'julkaisut' ? '3px solid var(--brand-accent, #7c3aed)' : '3px solid transparent',
                fontSize: 18,
                letterSpacing: 0.5,
                transition: 'background 0.15s, color 0.15s',
                borderRadius: 0,
                outline: 'none',
                boxShadow: 'none',
                margin: 0,
                padding: 0
              }}
              onMouseOver={e => { if(activeTab !== 'julkaisut') e.currentTarget.style.background = '#f3f4f6' }}
              onMouseOut={e => { if(activeTab !== 'julkaisut') e.currentTarget.style.background = 'transparent' }}
            >
              📝 Julkaisut
            </button>
            <button
              onClick={() => setActiveTab('generointi')}
              style={{
                flex: 1,
                height: '100%',
                border: 'none',
                background: activeTab === 'generointi' ? '#fff' : 'transparent',
                color: activeTab === 'generointi' ? 'var(--brand-dark, #1f2937)' : '#6b7280',
                fontWeight: activeTab === 'generointi' ? 700 : 500,
                cursor: 'pointer',
                borderBottom: activeTab === 'generointi' ? '3px solid var(--brand-accent, #7c3aed)' : '3px solid transparent',
                fontSize: 18,
                letterSpacing: 0.5,
                transition: 'background 0.15s, color 0.15s',
                borderRadius: 0,
                outline: 'none',
                boxShadow: 'none',
                margin: 0,
                padding: 0
              }}
              onMouseOver={e => { if(activeTab !== 'generointi') e.currentTarget.style.background = '#f3f4f6' }}
              onMouseOut={e => { if(activeTab !== 'generointi') e.currentTarget.style.background = 'transparent' }}
            >
              🤖 Generointi
            </button>
          </div>

          {/* Sisältö */}
          <div style={{ padding: 0 }}>
            {/* Julkaisut-välilehti */}
            {activeTab === 'julkaisut' && (
              <div style={{ padding: 32 }}>
                {/* Filtteripainikkeet */}
                {!loading && !error && (types.length > 0 || statuses.length > 0) && (
                  <>
                    {/* Type-filtteri */}
                    <div className={styles.filters}>
                      <div className={styles.filterLabel}>
                        Tyyppi
                      </div>
                      <div className={styles.filterButtonGroup}>
                        <button
                          onClick={() => setTypeFilter('')}
                          className={`${styles.filterButton} ${typeFilter === '' ? styles.filterButtonActive : styles.filterButtonInactive}`}
                        >
                          Kaikki
                        </button>
                        {types.map(type => (
                          <button
                            key={type}
                            onClick={() => setTypeFilter(type)}
                            className={`${styles.filterButton} ${typeFilter === type ? styles.filterButtonActive : styles.filterButtonInactive}`}
                          >
                            {type}
                          </button>
                        ))}
                      </div>
                    </div>
                    
                    {/* Status-filtteri */}
                    <div className={styles.filters}>
                      <div className={styles.filterLabel}>
                        Status
                      </div>
                      <div className={styles.filterButtonGroup}>
                        <button
                          onClick={() => setStatusFilter('')}
                          className={`${styles.filterButton} ${statusFilter === '' ? styles.filterButtonActive : styles.filterButtonInactive}`}
                        >
                          Kaikki
                        </button>
                        {statuses.map(status => (
                          <button
                            key={status}
                            onClick={() => setStatusFilter(status)}
                            className={`${styles.filterButton} ${statusFilter === status ? styles.filterButtonActive : styles.filterButtonInactive}`}
                          >
                            {status}
                          </button>
                        ))}
                      </div>
                    </div>
                  </>
                )}
                
                {loading && <p className={styles.loading}>Ladataan...</p>}
                {error && <p className={styles.error}>{error}</p>}
                
                {/* Grid */}
                {!loading && !error && (
                  <div className={styles.bentoGrid}>
                    {filteredPosts.map((post, index) => (
                      <div
                        key={post["Record ID"] || post.id || index}
                        className={
                          [
                            styles.bentoItem,
                            getGridSpans(post.Media)
                          ].join(' ')
                        }
                      >
                        {/* Media-kuva, video tai placeholder */}
                        {getMediaElement(post.Media, getPostTitle(post), false, post, segments)}
                        <div className={styles.bentoCardContent}>
                          {/* Tyyppibadge ja Status badge */}
                          <div style={{display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4}}>
                            {post.Type && (
                              <span className={styles.typeBadge}>{post.Type}</span>
                            )}
                            {post.Status && (
                              <span style={{
                                display: 'inline-block',
                                background: getStatusColor(post.Status).background,
                                color: getStatusColor(post.Status).text,
                                fontWeight: 600,
                                fontSize: 14,
                                borderRadius: 8,
                                padding: '2px 12px',
                                marginBottom: 10
                              }}>
                                {post.Status}
                              </span>
                            )}
                          </div>
                          {/* Idea näkyvästi */}
                          {getPostTitle(post) && (
                            <div className={styles.ideaDisplay}>
                              <span style={{fontWeight: 700, marginLeft: 0}}>{truncateWords(getPostTitle(post), 8)}</span>
                            </div>
                          )}
                          {/* Kuvaus */}
                          {getPostDescription(post) && (
                            <div className={styles.description}>{getPostDescription(post)}</div>
                          )}

                          {/* Alareuna */}
                          <div className={styles.cardFooter}>
                            <span className={styles.date}>
                              {post["Publish Date"] ? `Julkaistu: ${formatDate(post["Publish Date"])} ` : ''}
                              {post["Slide No."] && `Slide ${post["Slide No."]}`}
                            </span>
                            {post.Status === 'Scheduled' || post.Status === 'Done' ? (
                              <span style={{
                                fontSize: 12,
                                color: '#6b7280',
                                fontStyle: 'italic'
                              }}>
                                Ei muokattavissa
                              </span>
                            ) : (
                              <button
                                onClick={() => setSelectedPost(post)}
                                className={styles.viewButton}
                              >
                                Muokkaa
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Generointi-välilehti */}
            {activeTab === 'generointi' && (
              <div style={{ padding: 32 }}>
                <div className={styles.generationTab}>
                  <div className={styles.generationContent}>
                    <h2>🤖 Sisällön generointi</h2>
                    <p>Tässä voit generoida uutta sisältöä AI:n avulla.</p>
                    
                    <div className={styles.generationGrid}>
                      <div className={styles.generationCard}>
                        <div className={styles.generationIcon}>📝</div>
                        <h3>Blogin generointi</h3>
                        <p>Generoi blogitekstejä, artikkeleita ja pitkää sisältöä AI:n avulla</p>
                        <button 
                          className={styles.generationButton}
                          onClick={() => openGenerationModal('blog')}
                        >
                          Luo blogi
                        </button>
                      </div>
                      
                      <div className={styles.generationCard}>
                        <div className={styles.generationIcon}>🖼️</div>
                        <h3>Kuva julkaisu</h3>
                        <p>Luo kuvapostauksia ja visuaalista sisältöä julkaisuillesi</p>
                        <button 
                          className={styles.generationButton}
                          onClick={() => openGenerationModal('image')}
                        >
                          Luo kuva
                        </button>
                      </div>
                      
                      <div className={styles.generationCard}>
                        <div className={styles.generationIcon}>🎠</div>
                        <h3>Karusellin generointi</h3>
                        <p>Generoi karusellipostauksia useilla slideilla ja sisällöllä</p>
                        <button 
                          className={styles.generationButton}
                          onClick={() => openGenerationModal('carousel')}
                        >
                          Luo karuselli
                        </button>
                      </div>
                      
                      <div className={styles.generationCard}>
                        <div className={styles.generationIcon}>🤖</div>
                        <h3>Avatar generointi</h3>
                        <p>Luo avatar-videoita ja animoituja sisältöjä AI:n avulla</p>
                        <button 
                          className={styles.generationButton}
                          onClick={() => openGenerationModal('avatar')}
                        >
                          Luo avatar video
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      {selectedPost && <PostModal post={selectedPost} onClose={() => setSelectedPost(null)} allPosts={posts} segments={segments} />}
      
      {/* Generointimodaali */}
      {showGenerationModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <button onClick={closeGenerationModal} className={styles.modalClose}>×</button>
            
            <div className={styles.modalContent}>
              <h2 style={{ margin: '0 0 16px 0', fontSize: 24, fontWeight: 700, color: '#1f2937' }}>
                {generationType === 'blog' && '📝 Blogin generointi'}
                {generationType === 'image' && '🖼️ Kuva julkaisu'}
                {generationType === 'carousel' && '🎠 Karusellin generointi'}
                {generationType === 'avatar' && '🤖 Avatar generointi'}
              </h2>
              
              <p style={{ margin: '0 0 24px 0', color: '#6b7280', fontSize: 16, lineHeight: 1.5 }}>
                {generationType === 'blog' && 'Syötä avainsana tai idea blogitekstin generointiin.'}
                {generationType === 'image' && 'Syötä idea kuvapostauksen luomiseen.'}
                {generationType === 'carousel' && 'Syötä idea karusellipostauksen generointiin.'}
                {generationType === 'avatar' && 'Syötä idea avatar-videon luomiseen.'}
              </p>
              
              <form onSubmit={handleIdeaGeneration}>
                <label className={styles.modalLabel} style={{ marginBottom: 18 }}>
                  <span style={{ fontWeight: 600, fontSize: 15 }}>
                    {generationType === 'blog' ? 'Avainsana / idea' : 'Idea'}
                  </span>
                  <textarea
                    value={generationIdea}
                    onChange={e => setGenerationIdea(e.target.value)}
                    rows={4}
                    className={styles.modalTextarea}
                    style={{ width: '100%', marginTop: 6 }}
                    placeholder={
                      generationType === 'blog' 
                        ? 'Esim. "digitaalinen markkinointi", "sosiaalisen median strategiat"...'
                        : 'Kuvaile mitä haluat generoida...'
                    }
                    disabled={generationLoading}
                  />
                </label>
                
                {generationError && <div className={styles.modalError}>{generationError}</div>}
                {generationSuccess && <div className={styles.modalSuccess}>{generationSuccess}</div>}
                
                <div style={{ display: 'flex', gap: 12, marginTop: 18 }}>
                  <button 
                    type="button" 
                    onClick={closeGenerationModal} 
                    className={styles.secondaryButton} 
                    disabled={generationLoading}
                  >
                    Peruuta
                  </button>
                  <button 
                    type="submit" 
                    className={styles.viewButton} 
                    disabled={generationLoading}
                  >
                    {generationLoading ? 'Lähetetään...' : 'Lähetä idea'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  )
}