// components/icons.tsx

import {
  User,
  Notebook,
  Loader2,
  Plus,
  Trash,
  Pencil,
  Save,
  X,
  Info,
  Check,
  ChevronDown,
  ChevronUp,
  Search,
  Upload,
  Image as ImageIcon,
  RefreshCcw,
  ExternalLink,
  Package,
  ShoppingBag,
  TrendingUp,
  TrendingDown,
  Minus,
  LineChart,
  Wallet, // Ajouté pour le portefeuille
  Zap,    // Ajouté pour les alertes/énergie
  Menu,   // Ajouté pour le menu mobile
  Brain
} from "lucide-react";



export const Icons = {
  // Trading / TCG
  TrendingUp: TrendingUp,
  TrendingDown: TrendingDown,
  LineChart: LineChart,
  wallet: Wallet, // Ajouté
  zap: Zap,       // Ajouté
  
  // Core UI
  user: User,
  note: Notebook,
  spinner: Loader2,
  add: Plus,
  delete: Trash,
  edit: Pencil,
  save: Save,
  close: X,
  check: Check,
  chevronDown: ChevronDown,
  chevronUp: ChevronUp,
  search: Search,
  upload: Upload,
  image: ImageIcon,
  refresh: RefreshCcw,
  external: ExternalLink,
  package: Package,
  bag: ShoppingBag,
  info: Info,
  minus: Minus,
  menu: Menu, // Ajouté

  brain: Brain, // ← Ici
};