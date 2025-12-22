// lib/cache-service.ts
type CacheEntry<T> = {
    data: T
    timestamp: number
    expiresAt: number
  }
  
  class CacheService {
    private cache: Map<string, CacheEntry<any>> = new Map()
    private readonly DEFAULT_TTL = 5 * 60 * 1000 // 5 minutes
    private readonly SETS_TTL = 30 * 60 * 1000 // 30 minutes (sets changent rarement)
    private readonly CARDS_TTL = 10 * 60 * 1000 // 10 minutes
  
    /**
     * Récupère une donnée du cache si elle est encore valide
     */
    get<T>(key: string): T | null {
      const entry = this.cache.get(key)
      
      if (!entry) return null
      
      // Vérifier si le cache a expiré
      if (Date.now() > entry.expiresAt) {
        this.cache.delete(key)
        return null
      }
      
      return entry.data as T
    }
  
    /**
     * Stocke une donnée dans le cache avec un TTL personnalisé
     */
    set<T>(key: string, data: T, ttl?: number): void {
      const now = Date.now()
      const expiresAt = now + (ttl || this.DEFAULT_TTL)
      
      this.cache.set(key, {
        data,
        timestamp: now,
        expiresAt
      })
    }
  
    /**
     * Stocke des sets avec un TTL plus long
     */
    setSets<T>(data: T): void {
      this.set('ppt:sets', data, this.SETS_TTL)
    }
  
    /**
     * Récupère les sets du cache
     */
    getSets<T>(): T | null {
      return this.get<T>('ppt:sets')
    }
  
    /**
     * Stocke les cartes d'un set
     */
    setCards<T>(setId: string, data: T): void {
      this.set(`ppt:cards:${setId}`, data, this.CARDS_TTL)
    }
  
    /**
     * Récupère les cartes d'un set du cache
     */
    getCards<T>(setId: string): T | null {
      return this.get<T>(`ppt:cards:${setId}`)
    }
  
    /**
     * Invalide une clé spécifique
     */
    invalidate(key: string): void {
      this.cache.delete(key)
    }
  
    /**
     * Invalide toutes les clés commençant par un préfixe
     */
    invalidatePrefix(prefix: string): void {
      for (const key of this.cache.keys()) {
        if (key.startsWith(prefix)) {
          this.cache.delete(key)
        }
      }
    }
  
    /**
     * Vide tout le cache
     */
    clear(): void {
      this.cache.clear()
    }
  
    /**
     * Nettoie les entrées expirées
     */
    cleanup(): void {
      const now = Date.now()
      for (const [key, entry] of this.cache.entries()) {
        if (now > entry.expiresAt) {
          this.cache.delete(key)
        }
      }
    }
  
    /**
     * Retourne les statistiques du cache
     */
    getStats() {
      const now = Date.now()
      let validEntries = 0
      let expiredEntries = 0
  
      for (const entry of this.cache.values()) {
        if (now > entry.expiresAt) {
          expiredEntries++
        } else {
          validEntries++
        }
      }
  
      return {
        total: this.cache.size,
        valid: validEntries,
        expired: expiredEntries
      }
    }
  }
  
  // Instance singleton
  export const cacheService = new CacheService()
  
  // Nettoyer le cache toutes les 5 minutes
  if (typeof window !== 'undefined') {
    setInterval(() => {
      cacheService.cleanup()
    }, 5 * 60 * 1000)
  }