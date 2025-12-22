// components/tcgdex/RarityFilter.tsx
'use client'

import { X, Filter } from "lucide-react"

// Configuration des raretés avec couleurs et icônes
export const RARITY_CONFIG: Record<string, {
  color: string
  activeColor: string
  icon: string
  order: number
  aliases: string[]
}> = {
  'Common': { 
    color: 'bg-slate-100 text-slate-800 border-slate-300 hover:bg-slate-200',
    activeColor: 'bg-slate-600 text-white border-slate-700',
    icon: '⚫',
    order: 1,
    aliases: ['common']
  },
  'Uncommon': { 
    color: 'bg-emerald-100 text-emerald-800 border-emerald-300 hover:bg-emerald-200',
    activeColor: 'bg-emerald-600 text-white border-emerald-700',
    icon: '🔷',
    order: 2,
    aliases: ['uncommon']
  },
  'Rare': { 
    color: 'bg-blue-100 text-blue-800 border-blue-300 hover:bg-blue-200',
    activeColor: 'bg-blue-600 text-white border-blue-700',
    icon: '⭐',
    order: 3,
    aliases: ['rare']
  },
  'Rare Holo': { 
    color: 'bg-purple-100 text-purple-800 border-purple-300 hover:bg-purple-200',
    activeColor: 'bg-purple-600 text-white border-purple-700',
    icon: '💎',
    order: 4,
    aliases: ['rare holo', 'holo rare', 'holofoil rare']
  },
  'Rare Holo GX': { 
    color: 'bg-cyan-100 text-cyan-800 border-cyan-300 hover:bg-cyan-200',
    activeColor: 'bg-cyan-600 text-white border-cyan-700',
    icon: 'GX',
    order: 5,
    aliases: ['rare holo gx', 'holo rare gx']
  },
  'Rare Holo V': { 
    color: 'bg-indigo-100 text-indigo-800 border-indigo-300 hover:bg-indigo-200',
    activeColor: 'bg-indigo-600 text-white border-indigo-700',
    icon: 'V',
    order: 6,
    aliases: ['rare holo v', 'holo rare v']
  },
  'Rare Holo VMAX': { 
    color: 'bg-rose-100 text-rose-800 border-rose-300 hover:bg-rose-200',
    activeColor: 'bg-rose-600 text-white border-rose-700',
    icon: 'MAX',
    order: 7,
    aliases: ['rare holo vmax', 'holo rare vmax']
  },
  'Rare Holo VSTAR': { 
    color: 'bg-sky-100 text-sky-800 border-sky-300 hover:bg-sky-200',
    activeColor: 'bg-sky-600 text-white border-sky-700',
    icon: 'V⭐',
    order: 8,
    aliases: ['rare holo vstar', 'holo rare vstar']
  },
  'Double Rare': {
    color: 'bg-teal-100 text-teal-800 border-teal-300 hover:bg-teal-200',
    activeColor: 'bg-teal-600 text-white border-teal-700',
    icon: '⭐⭐',
    order: 9,
    aliases: ['double rare']
  },
  'Rare ACE': {
    color: 'bg-red-100 text-red-800 border-red-300 hover:bg-red-200',
    activeColor: 'bg-red-600 text-white border-red-700',
    icon: '🃏',
    order: 10,
    aliases: ['rare ace', 'ace spec rare']
  },
  'Radiant Rare': {
    color: 'bg-lime-100 text-lime-800 border-lime-300 hover:bg-lime-200',
    activeColor: 'bg-lime-600 text-white border-lime-700',
    icon: '🌟',
    order: 11,
    aliases: ['radiant rare', 'rare radiant', 'radient rare']
  },
  'Ultra Rare': {
    color: 'bg-yellow-100 text-yellow-800 border-yellow-300 hover:bg-yellow-200',
    activeColor: 'bg-yellow-600 text-white border-yellow-700',
    icon: '💫',
    order: 12,
    aliases: ['ultra rare', 'rare ultra']
  },
  'Illustration Rare': {
    color: 'bg-violet-100 text-violet-800 border-violet-300 hover:bg-violet-200',
    activeColor: 'bg-violet-600 text-white border-violet-700',
    icon: '🎨',
    order: 13,
    aliases: ['illustration rare', 'rare illustration']
  },
  'Special Illustration Rare': {
    color: 'bg-pink-100 text-pink-800 border-pink-300 hover:bg-pink-200',
    activeColor: 'bg-pink-600 text-white border-pink-700',
    icon: '✨',
    order: 14,
    aliases: ['special illustration rare', 'rare special illustration']
  },
  'Secret Rare': { 
    color: 'bg-amber-100 text-amber-800 border-amber-300 hover:bg-amber-200',
    activeColor: 'bg-amber-600 text-white border-amber-700',
    icon: '🔒',
    order: 15,
    aliases: ['secret rare', 'rare secret']
  },
  'Hyper Rare': {
    color: 'bg-orange-100 text-orange-800 border-orange-300 hover:bg-orange-200',
    activeColor: 'bg-orange-600 text-white border-orange-700',
    icon: '⚡',
    order: 16,
    aliases: ['hyper rare', 'rare hyper']
  },
  'Rare Rainbow': { 
    color: 'bg-gradient-to-r from-red-100 via-yellow-100 to-blue-100 text-slate-800 border-slate-300 hover:opacity-80',
    activeColor: 'bg-gradient-to-r from-red-600 via-yellow-600 to-blue-600 text-white border-slate-700',
    icon: '🌈',
    order: 17,
    aliases: ['rare rainbow', 'rainbow rare']
  }
}

export type RarityType = keyof typeof RARITY_CONFIG

// Fonction pour normaliser le nom d'une rareté
export const normalizeRarity = (rarity: string): string => {
  const normalized = rarity.toLowerCase().trim()
  
  // Chercher la rareté correspondante via les aliases
  for (const [key, config] of Object.entries(RARITY_CONFIG)) {
    if (config.aliases.includes(normalized)) {
      return key
    }
  }
  
  // Si pas trouvé, retourner le nom original
  return rarity
}

interface RarityFilterProps {
  availableRarities: string[]
  selectedRarities: Set<string>
  onToggleRarity: (rarity: string) => void
  onClearAll: () => void
  totalCards?: number
  filteredCount?: number
}

export const RarityFilter = ({
  availableRarities,
  selectedRarities,
  onToggleRarity,
  onClearAll,
  totalCards,
  filteredCount
}: RarityFilterProps) => {
  if (availableRarities.length === 0) return null

  const hasActiveFilters = selectedRarities.size > 0

  // Trier les raretés par ordre de rareté (du plus commun au plus rare)
  const sortedRarities = [...availableRarities].sort((a, b) => {
    const orderA = RARITY_CONFIG[a as RarityType]?.order ?? 999
    const orderB = RARITY_CONFIG[b as RarityType]?.order ?? 999
    return orderA - orderB
  })

  return (
    <div className="bg-card rounded-xl border border-border/50 p-4 space-y-3 shadow-sm animate-in fade-in slide-in-from-top-4 duration-300">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-muted-foreground" />
          <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">
            Filtrer par Rareté
          </h3>
        </div>
        {hasActiveFilters && (
          <button
            onClick={onClearAll}
            className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
          >
            <X className="w-3 h-3" />
            Effacer tout
          </button>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        {sortedRarities.map((rarity) => {
          const isActive = selectedRarities.has(rarity)
          const config = RARITY_CONFIG[rarity as RarityType]
          
          // Utiliser une config par défaut si la rareté n'est pas dans notre liste
          const defaultConfig = {
            color: 'bg-gray-100 text-gray-800 border-gray-300 hover:bg-gray-200',
            activeColor: 'bg-gray-600 text-white border-gray-700',
            icon: '•'
          }
          
          const { color, activeColor, icon } = config || defaultConfig

          return (
            <button
              key={rarity}
              onClick={() => onToggleRarity(rarity)}
              className={`
                px-3 py-1.5 rounded-full text-xs font-medium border-2 
                transition-all duration-200 
                flex items-center gap-1.5
                ${isActive ? `${activeColor} scale-105 shadow-md` : `${color} hover:scale-105`}
              `}
            >
              <span className="text-sm">{icon}</span>
              <span>{rarity}</span>
              {isActive && (
                <X className="w-3 h-3 ml-0.5" />
              )}
            </button>
          )
        })}
      </div>

      {hasActiveFilters && (
        <div className="text-xs text-muted-foreground pt-2 border-t">
          {selectedRarities.size} filtre{selectedRarities.size > 1 ? 's' : ''} actif{selectedRarities.size > 1 ? 's' : ''}
          {filteredCount !== undefined && totalCards !== undefined && (
            <> · {filteredCount} carte{filteredCount > 1 ? 's' : ''} {totalCards > filteredCount && `(${totalCards} au total)`}</>
          )}
        </div>
      )}
    </div>
  )
}