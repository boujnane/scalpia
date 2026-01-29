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
  RefreshCw,
  ExternalLink,
  Package,
  ShoppingBag,
  TrendingUp,
  TrendingDown,
  Minus,
  LineChart,
  BarChart3,
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
  ArrowRight,
  WalletCards,
  BadgeDollarSign,
  ScanSearch,
  Trophy,
  Building2,
  Play,
  BadgeQuestionMark,
  FolderHeart,
  PlusCircle,
  MinusCircle,
  Calendar,
  Euro,

  // ✅ AJOUTS pour la page Contact
  LifeBuoy,
  Database,
  Send,
  AlertTriangle,
  Link as LinkIcon,
  Bug,
  FileText,
  Scale,
} from "lucide-react"

type PokeballIconProps = {
  size?: number | string;
  color?: string;
  opacity?: number;
  className?: string;
};

const PokeballIcon = ({
  size = 24,
  color = "currentColor",
  opacity = 1,
  className,
}: PokeballIconProps) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 8 8"
      width={size}
      height={size}
      fill={color}
      className={className}
      style={{ opacity }}
    >
      <path d="M0 4c0-5.25 8-5.25 8 0S0 9.25 0 4m1 0c0 4 6 4 6 0H6Q4 1 2 4m1 0l1-1l1 1l-1 1" />
    </svg>
  );
};

export const Icons = {
  // Trading / Data / Market Intelligence
  trendingUp: TrendingUp,
  trendingDown: TrendingDown,
  linechart: LineChart,
  barChart3: BarChart3,
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
  refresh: RefreshCcw,
  refreshCw: RefreshCw,
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
  arrowRight: ArrowRight,
  walletCards: WalletCards,
  badgeDollarSign: BadgeDollarSign,
  scanSearch: ScanSearch,
  trophy: Trophy,
  building2: Building2,
  play: Play,
  badgeQuestionMark: BadgeQuestionMark,

  // ✅ Contact page
  lifeBuoy: LifeBuoy,
  database: Database,
  send: Send,
  alertTriangle: AlertTriangle,
  link: LinkIcon,
  bug: Bug,
  fileText: FileText,
  scale: Scale,
  pokeball: PokeballIcon,

  // ✅ Collection page
  collection: FolderHeart,
  plusCircle: PlusCircle,
  minusCircle: MinusCircle,
  calendar: Calendar,
  euro: Euro,
}
