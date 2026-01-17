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
  RefreshCcw, // Celui que tu avais déjà (Counter Clockwise)
  RefreshCw,  // Le nouveau pour l'update (Clockwise)
  ExternalLink,
  Package,
  ShoppingBag,
  TrendingUp,
  TrendingDown,
  Minus,
  LineChart,
  BarChart3, // Le nouveau pour l'aspect "Données/Index"
  Wallet,
  Zap,
  Menu,
  Brain,
  Activity,
  HelpCircle,
  Sparkles,
  Shield,
  Settings,
  CreditCard,
  ArrowRight
} from "lucide-react";

export const Icons = {
  // Trading / Data / Market Intelligence
  trendingUp: TrendingUp,
  trendingDown: TrendingDown,
  linechart: LineChart,
  barChart3: BarChart3, // Utilisé dans le nouveau CTA
  wallet: Wallet,
  zap: Zap,
  activity: Activity,
  
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
  refresh: RefreshCcw,    // Ton ancien refresh
  refreshCw: RefreshCw,   // Le nouveau refresh pour le badge "Mise à jour"
  external: ExternalLink,
  package: Package,
  bag: ShoppingBag,
  info: Info,
  minus: Minus,
  menu: Menu,
  brain: Brain,
  helpCircle: HelpCircle,
  sparkles: Sparkles,
  shield: Shield,
  settings: Settings,
  creditCard: CreditCard,
  loader: Loader2,
  arrowRight: ArrowRight
};