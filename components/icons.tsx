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
  Wallet,
  Zap,
  Menu,
  Brain,
  Activity, // <-- Ajout de l'icône Activity
} from "lucide-react";



export const Icons = {
  // Trading / TCG
  TrendingUp: TrendingUp,
  TrendingDown: TrendingDown,
  LineChart: LineChart,
  wallet: Wallet,
  zap: Zap,
  activity: Activity, // <-- Ajout de la référence 'activity' ici
  
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
  menu: Menu,

  brain: Brain,
};