import React, { useEffect, useRef, useMemo } from 'react'
import { createPortal } from 'react-dom'
import { useAuth } from '../contexts/AuthContext'
import { usePosts } from '../contexts/PostsContext'
import { supabase } from '../lib/supabase'
import Button from '../components/Button'
import '../components/ModalComponents.css'
import './ManagePostsPage.css'

// Dummy data for initial state
const initialPosts = [
  {
    id: 1,
    title: 'Miten rakentaa menestyksekäs sosiaalisen median strategia',
    status: 'Kesken',
    thumbnail: '/placeholder.png',
    caption: 'Opi tärkeimmät vaiheet tehokkaan sosiaalisen median strategian luomiseen.',
    createdAt: '2024-01-15'
  },
  {
    id: 2,
    title: '10 vinkkiä parempaan sisältömarkkinointiin',
    status: 'Valmis',
    thumbnail: '/placeholder.png',
    caption: 'Löydä todistetut strategiat sisältömarkkinoinnin parantamiseen.',
    createdAt: '2024-01-16'
  },
  {
    id: 3,
    title: 'Digitaalisen markkinoinnin tulevaisuus 2024',
    status: 'Ajastettu',
    thumbnail: '/placeholder.png',
    caption: 'Tutustu uusimpiin trendeihin ja teknologioihin.',
    scheduledDate: '2024-01-20'
  },
  {
    id: 4,
    title: 'Bränditietoisuuden rakentaminen sosiaalisessa mediassa',
    status: 'Julkaistu',
    thumbnail: '/placeholder.png',
    caption: 'Tehokkaat strategiat brändin näkyvyyden lisäämiseen.',
    publishedAt: '2024-01-10'
  }
]

const columns = [
  { status: 'Kesken', title: 'Avatar', color: '#fef3c7' },
  { status: 'KeskenSupabase', title: 'Kesken', color: '#fef3c7' },
  { status: 'Tarkistuksessa', title: 'Valmiina julkaisuun', color: '#dbeafe' },
  { status: 'Aikataulutettu', title: 'Aikataulutettu', color: '#fce7f3' }
]

const publishedColumn = { status: 'Julkaistu', title: 'Julkaistu', color: '#dcfce7' }

// Optimized PostCard component with React.memo
const PostCard = React.memo(({ post, onEdit, onDelete, onPublish, onSchedule, onMoveToNext }) => {
  const handleEdit = () => onEdit(post)
  const handleDelete = () => onDelete(post)
  const handlePublish = () => onPublish(post)
  const handleSchedule = () => onSchedule(post)
  const handleMoveToNext = () => onMoveToNext(post)

  return (
    <div className="post-card">
      <div className="post-card-content">
        <div className="post-thumbnail">
          {post.thumbnail ? (
            <img 
              src={post.thumbnail} 
              alt={post.title}
            />
          ) : (
            <div className="placeholder-content">
              <div className="placeholder-fallback">
                <span className="placeholder-icon">📷</span>
                <p className="placeholder-text">Ei kuvaa</p>
              </div>
            </div>
          )}
        </div>
        
        <div className="post-info">
          <div className="post-header">
            <h3 className="post-title">
              {post.title}
            </h3>
            <div className="post-badges">
              <span className="post-type">{post.type}</span>
              <span className="post-source supabase">Supabase</span>
            </div>
          </div>
          
          <p className="post-caption">
            {post.caption}
          </p>
          
          <div className="post-footer">
            <div className="post-date">
              {post.createdAt ? new Date(post.createdAt).toLocaleDateString('fi-FI') : 'Ei päivämäärää'}
            </div>
            
            <div className="post-actions">
              <Button
                onClick={handleEdit}
                variant="secondary"
                style={{ fontSize: 11, padding: '4px 8px' }}
              >
                ✏️ Muokkaa
              </Button>
              
              {post.status === 'Kesken' && (
                <Button
                  onClick={handleMoveToNext}
                  variant="primary"
                  style={{ fontSize: 11, padding: '4px 8px' }}
                >
                  ➡️ Seuraava
                </Button>
              )}
              
              {post.status === 'Tarkistuksessa' && (
                <>
                  <Button
                    onClick={handlePublish}
                    variant="primary"
                    style={{ fontSize: 11, padding: '4px 8px' }}
                  >
                    📤 Julkaise
                  </Button>
                  <Button
                    onClick={handleSchedule}
                    variant="secondary"
                    style={{ fontSize: 11, padding: '4px 8px' }}
                  >
                    ⏰ Ajasta
                  </Button>
                </>
              )}
              
              <Button
                onClick={handleDelete}
                variant="secondary"
                style={{ 
                  fontSize: 11, 
                  padding: '4px 8px',
                  background: '#ef4444',
                  color: '#fff'
                }}
              >
                🗑️ Poista
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
})

PostCard.displayName = 'PostCard'

// Optimized Kanban Column component
const KanbanColumn = React.memo(({ title, posts, color, onEdit, onDelete, onPublish, onSchedule, onMoveToNext }) => {
  return (
    <div className="kanban-column">
      <h3 className="column-title" style={{ color: color, borderBottomColor: color }}>
        {title} ({posts.length})
      </h3>
      
      <div className="column-content">
        {posts.map(post => (
          <PostCard
            key={post.id}
            post={post}
            onEdit={onEdit}
            onDelete={onDelete}
            onPublish={onPublish}
            onSchedule={onSchedule}
            onMoveToNext={onMoveToNext}
          />
        ))}
        
        {posts.length === 0 && (
          <div style={{
            textAlign: 'center',
            padding: 40,
            color: '#9ca3af',
            fontSize: 14
          }}>
            Ei julkaisuja tässä tilassa
          </div>
        )}
      </div>
    </div>
  )
})

KanbanColumn.displayName = 'KanbanColumn'

// Main component
export default function ManagePostsPageOptimized() {
  const { user } = useAuth()
  const {
    posts,
    loading,
    error,
    filters,
    modals,
    editingPost,
    publishingPost,
    filteredPosts,
    postsByStatus,
    setFilters,
    setModals,
    setEditingPost,
    setPublishingPost,
    fetchPosts,
    fetchSocialAccounts,
    fetchReelsPosts,
    addPost,
    updatePost,
    deletePost
  } = usePosts()

  const hasInitialized = useRef(false)

  // Initialize data fetching
  useEffect(() => {
    if (!user || hasInitialized.current) return
    
    hasInitialized.current = true
    fetchPosts(user.id)
    fetchSocialAccounts(user.id)
    fetchReelsPosts(user.id)
  }, [user, fetchPosts, fetchSocialAccounts, fetchReelsPosts])

  // Memoized handlers to prevent unnecessary re-renders
  const handleEdit = useMemo(() => (post) => {
    setEditingPost(post)
    setModals({ showEditModal: true })
  }, [setEditingPost, setModals])

  const handleDelete = useMemo(() => async (post) => {
    if (!confirm('Haluatko varmasti poistaa tämän julkaisun?')) return
    
    try {
      // API call to delete post
      await deletePost(post.id)
    } catch (err) {
      console.error('Virhe julkaisun poistossa:', err)
    }
  }, [deletePost])

  const handlePublish = useMemo(() => (post) => {
    setPublishingPost(post)
    setModals({ showPublishModal: true })
  }, [setPublishingPost, setModals])

  const handleSchedule = useMemo(() => (post) => {
    setEditingPost(post)
    setModals({ showScheduleModal: true })
  }, [setEditingPost, setModals])

  const handleMoveToNext = useMemo(() => async (post) => {
    try {
      const newStatus = post.status === 'Kesken' ? 'Tarkistuksessa' : 'Julkaistu'
      const updatedPost = { ...post, status: newStatus }
      await updatePost(updatedPost)
    } catch (err) {
      console.error('Virhe statusin päivityksessä:', err)
    }
  }, [updatePost])

  const handleCreatePost = useMemo(() => () => {
    setModals({ showCreateModal: true })
  }, [setModals])

  const handleSubmitCreatePost = useMemo(() => async (e) => {
    e.preventDefault()
    const formData = new FormData(e.target)
    
    try {
      // Haetaan käyttäjän user_id ja company_id users taulusta
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id, company_id')
        .eq('auth_user_id', user.id)
        .single()
      
      if (userError || !userData?.id) {
        throw new Error('Käyttäjän ID ei löytynyt')
      }

      const postData = {
        title: formData.get('title'),
        type: formData.get('type'),
        caption: formData.get('caption')
      }

      // Lähetetään idea-generation kutsu N8N:lle
      try {
        console.log('Sending idea generation request:', {
          idea: postData.title,
          type: postData.type,
          companyId: userData.company_id
        })

        const response = await fetch('/api/idea-generation', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            idea: postData.title,
            type: postData.type,
            companyId: userData.company_id
          })
        })

        if (!response.ok) {
          console.error('Idea generation failed:', response.status)
        } else {
          const result = await response.json()
          console.log('Idea generation success:', result)
        }
      } catch (webhookError) {
        console.error('Idea generation webhook error:', webhookError)
      }

      setModals({ showCreateModal: false })
      alert('Idea lähetetty AI:lle! Some-sisältö generoidaan taustalla.')
      
      // Päivitä data
      await fetchPosts(user.id)
      
    } catch (error) {
      console.error('Virhe uuden julkaisun luomisessa:', error)
      alert('Virhe: Ei voitu luoda some-sisältöä. Yritä uudelleen.')
    }
  }, [user, setModals, fetchPosts])

  const handleSearchChange = useMemo(() => (e) => {
    setFilters({ searchTerm: e.target.value })
  }, [setFilters])

  const handleStatusFilterChange = useMemo(() => (e) => {
    setFilters({ statusFilter: e.target.value })
  }, [setFilters])

  const handleTypeFilterChange = useMemo(() => (e) => {
    setFilters({ typeFilter: e.target.value })
  }, [setFilters])

  const handleDataSourceToggle = useMemo(() => (source) => {
    setFilters({ dataSourceToggle: source })
  }, [setFilters])

  // Memoized filtered data
  const displayPosts = useMemo(() => {
    if (filters.dataSourceToggle === 'reels') {
      return posts.filter(post => post.type === 'Reel')
    }
    return filteredPosts
  }, [filters.dataSourceToggle, filteredPosts])

  // Memoized columns data
  const columnsData = useMemo(() => {
    return columns.map(column => ({
      ...column,
      posts: postsByStatus[column.status] || []
    }))
  }, [postsByStatus])

  const publishedPosts = useMemo(() => {
    return postsByStatus['Julkaistu'] || []
  }, [postsByStatus])

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '50vh',
        fontSize: 18,
        color: '#6b7280'
      }}>
        Ladataan julkaisuja...
      </div>
    )
  }

  if (error) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '50vh',
        fontSize: 18,
        color: '#ef4444'
      }}>
        Virhe: {error}
      </div>
    )
  }

  return (
    <div className="posts-container">
      {/* Header */}
      <div className="posts-header">
        <h1 style={{ margin: 0, fontSize: 28, fontWeight: 700, color: '#1f2937' }}>
          📝 Julkaisujen hallinta
        </h1>
        
        <Button
          onClick={handleCreatePost}
          variant="primary"
          style={{ padding: '12px 24px', fontSize: 14, fontWeight: 600 }}
        >
          ➕ Luo uusi julkaisu
        </Button>
      </div>

      {/* Search and Filters */}
      <div className="search-filters">
        <div style={{ display: 'flex', gap: 16, alignItems: 'center', flex: 1 }}>
          <input
            type="text"
            value={filters.searchTerm}
            onChange={handleSearchChange}
            placeholder="Hae julkaisuja..."
            className="search-input"
          />
          
          <select
            value={filters.statusFilter}
            onChange={handleStatusFilterChange}
            className="status-filter"
          >
            <option value="">Kaikki statukset</option>
            <option value="Kesken">Kesken</option>
            <option value="Tarkistuksessa">Valmiina julkaisuun</option>
            <option value="Aikataulutettu">Aikataulutettu</option>
            <option value="Julkaistu">Julkaistu</option>
          </select>
          
          <select
            value={filters.typeFilter}
            onChange={handleTypeFilterChange}
            className="filter-select"
          >
            <option value="">Kaikki tyypit</option>
            <option value="Photo">📸 Photo</option>
            <option value="Carousel">🎠 Carousel</option>
            <option value="Reels">🎬 Reels</option>
          </select>
        </div>
        
        {/* Data source toggle */}
        <div style={{ display: 'flex', gap: 8 }}>
          <Button
            onClick={() => handleDataSourceToggle('all')}
            variant={filters.dataSourceToggle === 'all' ? 'primary' : 'secondary'}
            className="toggle-button"
            style={{ fontSize: 12, padding: '6px 12px' }}
          >
            Kaikki ({posts.length})
          </Button>
          <Button
            onClick={() => handleDataSourceToggle('reels')}
            variant={filters.dataSourceToggle === 'reels' ? 'primary' : 'secondary'}
            className="toggle-button"
            style={{ fontSize: 12, padding: '6px 12px' }}
          >
            Reels ({posts.filter(p => p.type === 'Reel').length})
          </Button>
        </div>
      </div>

      {/* Kanban Board */}
      <div className="kanban-board">
        <div className="kanban-top-row">
          {columnsData.map(column => (
            <KanbanColumn
              key={column.status}
              title={column.title}
              posts={column.posts}
              color={column.color}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onPublish={handlePublish}
              onSchedule={handleSchedule}
              onMoveToNext={handleMoveToNext}
            />
          ))}
        </div>
      </div>

      {/* Published Posts */}
      {publishedPosts.length > 0 && (
        <div style={{ marginTop: 32 }}>
          <h2 style={{ 
            margin: '0 0 16px 0', 
            fontSize: 20, 
            fontWeight: 600,
            color: '#1f2937'
          }}>
            📤 Julkaistut julkaisut ({publishedPosts.length})
          </h2>
          
          <div className="kanban-board">
            <div className="kanban-bottom-row">
              {publishedPosts.map(post => (
                <PostCard
                  key={post.id}
                  post={post}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                  onPublish={handlePublish}
                  onSchedule={handleSchedule}
                  onMoveToNext={handleMoveToNext}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Modals would go here - simplified for this example */}
      {modals.showCreateModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: '#fff',
            padding: 24,
            borderRadius: 12,
            maxWidth: 500,
            width: '90%'
          }}>
            <h3>Luo uusi julkaisu</h3>
            <p>Modal sisältö tähän...</p>
            <Button
              onClick={() => setModals({ showCreateModal: false })}
              variant="secondary"
            >
              Sulje
            </Button>
          </div>
        </div>
      )}

      {/* Modals */}
      {modals.showCreateModal && createPortal(
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h2>Luo uusi julkaisu</h2>
              <button onClick={() => setModals({ showCreateModal: false })}>✕</button>
            </div>
            <form onSubmit={handleSubmitCreatePost} className="modal-form">
              <div className="form-group">
                <label>Otsikko</label>
                <input 
                  type="text" 
                  name="title"
                  placeholder="Kirjoita otsikko..." 
                  required
                />
              </div>
              <div className="form-group">
                <label>Tyyppi</label>
                <select name="type" required>
                  <option value="Photo">📸 Photo</option>
                  <option value="Carousel">🎠 Carousel</option>
                  <option value="Reels">🎬 Reels</option>
                </select>
              </div>
              <div className="form-group">
                <label>Kuvaus</label>
                <textarea 
                  name="caption"
                  placeholder="Kirjoita kuvaus..." 
                  rows={4}
                ></textarea>
              </div>
              <div className="modal-actions">
                <Button 
                  type="button"
                  variant="secondary" 
                  onClick={() => setModals({ showCreateModal: false })}
                >
                  Peruuta
                </Button>
                <Button type="submit" variant="primary">
                  Luo julkaisu
                </Button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {modals.showEditModal && editingPost && createPortal(
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h2>Muokkaa julkaisua</h2>
              <button onClick={() => setModals({ showEditModal: false })}>✕</button>
            </div>
            <div className="modal-form">
              <div className="form-group">
                <label>Otsikko</label>
                <input type="text" defaultValue={editingPost.title} />
              </div>
              <div className="form-group">
                <label>Kuvaus</label>
                <textarea defaultValue={editingPost.caption} rows={4}></textarea>
              </div>
              <div className="modal-actions">
                <Button variant="secondary" onClick={() => setModals({ showEditModal: false })}>
                  Peruuta
                </Button>
                <Button variant="primary">
                  Tallenna
                </Button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      {modals.showPublishModal && publishingPost && createPortal(
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h2>Julkaise julkaisu</h2>
              <button onClick={() => setModals({ showPublishModal: false })}>✕</button>
            </div>
            <div className="modal-form">
              <p>Haluatko varmasti julkaista julkaisun "{publishingPost.title}"?</p>
              <div className="modal-actions">
                <Button variant="secondary" onClick={() => setModals({ showPublishModal: false })}>
                  Peruuta
                </Button>
                <Button variant="primary">
                  Julkaise
                </Button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      {modals.showScheduleModal && editingPost && createPortal(
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h2>Aikatauluta julkaisu</h2>
              <button onClick={() => setModals({ showScheduleModal: false })}>✕</button>
            </div>
            <div className="modal-form">
              <div className="form-group">
                <label>Julkaisupäivä</label>
                <input type="datetime-local" />
              </div>
              <div className="modal-actions">
                <Button variant="secondary" onClick={() => setModals({ showScheduleModal: false })}>
                  Peruuta
                </Button>
                <Button variant="primary">
                  Aikatauluta
                </Button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  )
} 