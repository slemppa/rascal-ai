import { useEffect } from 'react'

const PageMeta = ({ 
  title, 
  description, 
  image = '/hero.png',
  url = window.location.href 
}) => {
  useEffect(() => {
    // Päivitä title
    if (title) {
      document.title = title
    }

    // Päivitä meta description
    let metaDescription = document.querySelector('meta[name="description"]')
    if (!metaDescription) {
      metaDescription = document.createElement('meta')
      metaDescription.name = 'description'
      document.head.appendChild(metaDescription)
    }
    if (description) {
      metaDescription.content = description
    }

    // Päivitä Open Graph meta-tagit
    const updateMetaTag = (property, content) => {
      let metaTag = document.querySelector(`meta[property="${property}"]`)
      if (!metaTag) {
        metaTag = document.createElement('meta')
        metaTag.setAttribute('property', property)
        document.head.appendChild(metaTag)
      }
      metaTag.content = content
    }

    if (title) {
      updateMetaTag('og:title', title)
      updateMetaTag('twitter:title', title)
    }
    
    if (description) {
      updateMetaTag('og:description', description)
      updateMetaTag('twitter:description', description)
    }

    if (image) {
      const fullImageUrl = image.startsWith('http') ? image : `${window.location.origin}${image}`
      updateMetaTag('og:image', fullImageUrl)
      updateMetaTag('twitter:image', fullImageUrl)
    }

    if (url) {
      updateMetaTag('og:url', url)
      updateMetaTag('twitter:url', url)
    }

    // Cleanup function
    return () => {
      // Palauta alkuperäiset arvot jos tarpeen
      document.title = 'Rascal AI - Älykäs puhelin- ja viestintäautomaatio'
    }
  }, [title, description, image, url])

  return null // Tämä komponentti ei renderöi mitään
}

export default PageMeta 