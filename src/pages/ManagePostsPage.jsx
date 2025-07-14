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
    
    setLoading(true);
    setError(null);
    setSuccess(false);
    try {
      await axios.post('/api/update-post.js', {
        id: post["Record ID"] || post.id,
        Caption: caption,
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
    
    setLoading(true);
    setError(null);
    setSuccess(false);
    try {
      await axios.post('/api/update-post.js', {
        id: post["Record ID"] || post.id,
        Caption: caption,
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
  const [selectedPost, setSelectedPost] = useState(null)
  const [segments, setSegments] = useState([])
  const [monthlyLimitReached, setMonthlyLimitReached] = useState(false)
  const [postsThisMonth, setPostsThisMonth] = useState(0)

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
        // Suodata vain halutut statukset: Under Review, Scheduled, Done
        const allowedStatuses = ['Under Review', 'Scheduled', 'Done'];
        setPosts(all.filter(p => !p["Slide No."] && allowedStatuses.includes(p.Status)));
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

  // Hae uniikit tyypit
  const types = [...new Set(posts.map(post => post.Type).filter(Boolean))]

  // Suodata julkaisut tyypin mukaan
  const filteredPosts = typeFilter 
    ? posts.filter(post => post.Type === typeFilter)
    : posts

  const formatDate = (dateString) => {
    if (!dateString) return '-'
    try {
      return new Date(dateString).toLocaleDateString('fi-FI')
    } catch {
      return dateString
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
      
      <div className={styles.container}>
        {/* Filtteripainikkeet */}
        {!loading && !error && types.length > 0 && (
          <div className={styles.filters}>
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
                      <span className={styles.statusBadge}>{post.Status}</span>
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
      {selectedPost && <PostModal post={selectedPost} onClose={() => setSelectedPost(null)} allPosts={posts} segments={segments} />}
    </>
  )
}