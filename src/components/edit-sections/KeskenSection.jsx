import React from 'react'

export default function KeskenSection({ t, editingPost }) {
  if (!editingPost) return null
  return (
    <div className="edit-modal-grid">
      <div className="edit-modal-media">
        {(() => {
          const mediaUrls = editingPost.media_urls || editingPost.mediaUrls || []
          const firstUrl = mediaUrls[0] || editingPost.thumbnail || null
          if (!firstUrl) {
            return (
              <div className="video-placeholder">
                <span className="video-icon">Media</span>
                <p>Ei mediaa saatavilla</p>
              </div>
            )
          }
          const isVideo = firstUrl.includes('.mp4') || firstUrl.includes('.webm') || firstUrl.includes('.mov') || firstUrl.includes('.avi')
          return isVideo ? (
            <video src={firstUrl} controls className="video-element" />
          ) : (
            <img src={firstUrl} alt="thumbnail" className="video-element" />
          )
        })()}
      </div>
      <div className="edit-modal-fields">
        <div className="form-group">
          <label className="form-label">Kuvaus</label>
          <textarea
            name="caption"
            rows={6}
            className="form-textarea"
            defaultValue={editingPost.caption || ""}
            placeholder={t('posts.placeholders.caption')}
          />
        </div>
      </div>
    </div>
  )
}


