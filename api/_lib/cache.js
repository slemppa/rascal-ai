class CacheManager {
  constructor() {
    this.memoryCache = new Map()
    this.defaultTTL = 5 * 60 * 1000 // 5 minutes
  }

  set(key, value, ttl = this.defaultTTL) {
    const expiry = Date.now() + ttl
    this.memoryCache.set(key, { value, expiry })
  }

  get(key) {
    const item = this.memoryCache.get(key)
    if (!item) return null
    
    if (Date.now() > item.expiry) {
      this.memoryCache.delete(key)
      return null
    }
    
    return item.value
  }

  delete(key) {
    return this.memoryCache.delete(key)
  }

  clear() {
    this.memoryCache.clear()
  }

  has(key) {
    const item = this.memoryCache.get(key)
    if (!item) return false
    
    if (Date.now() > item.expiry) {
      this.memoryCache.delete(key)
      return false
    }
    
    return true
  }

  size() {
    return this.memoryCache.size
  }

  keys() {
    return Array.from(this.memoryCache.keys())
  }
}

export default new CacheManager() 