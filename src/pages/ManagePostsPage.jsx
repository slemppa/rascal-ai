import React, { useState, useEffect } from 'react'
import axios from 'axios'
import PageHeader from '../components/PageHeader'
import styles from './ManagePostsPage.module.css'

// Päivitetty media-logiikka korttiin
const getMediaElement = (mediaArr, alt, isLarge) => {
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

function PostModal({ post, onClose }) {
  const [caption, setCaption] = useState(post.Caption || '');
  // Alusta publishDate datetime-local -muodossa (esim. 2024-07-01T12:34)
  const initialDate = post["Publish Date"] ? new Date(post["Publish Date"]).toISOString().slice(0, 16) : '';
  const [publishDate, setPublishDate] = useState(initialDate);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

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
  const isVideo = media && (media.endsWith('.mp4') || media.endsWith('.webm'));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);
    try {
      await axios.post('/api/update-post.js', {
        id: post["Record ID"] || post.id,
        Caption: caption,
        "Publish Date": publishDate,
        updateType: 'postUpdate'
      });
      setSuccess(true);
      setTimeout(() => onClose(), 1000);
    } catch (err) {
      setError('Tallennus epäonnistui');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modal}>
        <button onClick={onClose} className={styles.modalClose}>×</button>
        <div className={styles.modalMedia} style={{marginBottom: 24}}>
          {media ? (
            isVideo ? (
              <video src={media} controls className={styles.modalMediaContent} />
            ) : (
              <img src={media} alt={getPostTitle(post) || 'Julkaisukuva'} className={styles.modalMediaContent} />
            )
          ) : (
            <div className={styles.modalMediaPlaceholder}>Ei mediaa</div>
          )}
        </div>
        {/* Type ja Status badge Captionin yhteyteen */}
        <form className={styles.modalContent} onSubmit={handleSubmit}>
          <div style={{display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8}}>
            {post.Type && <span className={styles.typeBadge}>{post.Type}</span>}
            {post.Status && <span className={styles.statusBadge}>{post.Status}</span>}
          </div>
          <label className={styles.modalLabel} style={{marginBottom: 10}}>
            <span style={{fontWeight: 600, fontSize: 15}}>Caption</span>
            <textarea
              value={caption}
              onChange={e => setCaption(e.target.value)}
              rows={6}
              className={styles.modalTextarea}
              style={{width: '100%', marginTop: 6, marginBottom: 18}}
            />
          </label>
          <label className={styles.modalLabel} style={{marginBottom: 18}}>
            <span style={{fontWeight: 600, fontSize: 15}}>Publish Date</span>
            <input
              type="datetime-local"
              value={publishDate}
              onChange={e => setPublishDate(e.target.value)}
              className={styles.modalInput}
              style={{marginTop: 6}}
            />
          </label>
          {error && <div className={styles.modalError}>{error}</div>}
          {success && <div className={styles.modalSuccess}>Tallennettu!</div>}
          <div style={{display: 'flex', gap: 12, marginTop: 18}}>
            <button type="button" onClick={onClose} className={styles.secondaryButton} disabled={loading}>Peruuta</button>
            <button type="submit" className={styles.viewButton} disabled={loading}>Tallenna</button>
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

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        setLoading(true)
        setError(null)
        const companyId = JSON.parse(localStorage.getItem('user') || 'null')?.companyId
        const url = `/api/get-posts${companyId ? `?companyId=${companyId}` : ''}`
        const response = await axios.get(url)
        setPosts(Array.isArray(response.data) ? response.data : [])
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
                {getMediaElement(post.Media, getPostTitle(post))}
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
                    </span>
                    <button
                      onClick={() => setSelectedPost(post)}
                      className={styles.viewButton}
                    >
                      Muokkaa
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      {selectedPost && <PostModal post={selectedPost} onClose={() => setSelectedPost(null)} />}
    </>
  )
}