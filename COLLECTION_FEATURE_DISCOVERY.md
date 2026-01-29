# Collection Feature - Discovery Notes

## Phase 1: Repository & DB Reconnaissance

### 1. Codebase Conventions

#### Routing (Next.js App Router)
- **Pattern:** `/app/{route}/page.tsx` for pages
- **API Routes:** `/app/api/{route}/route.ts`
- **French routes used:** `/analyse`, `/cartes`, `/rechercher`, `/a-propos`, `/pricing`, `/settings`
- **Recommendation:** Use `/ma-collection` for consistency with French naming

#### API Routes Pattern
- Location: `/app/api/**/route.ts`
- Error handling: Return `NextResponse.json({ error: message }, { status: code })`
- Auth check: Verify token via `adminAuth().verifyIdToken(token)`
- Caching: `next: { revalidate: seconds }` for ISR

#### Services Layer
- Location: `/lib/`
- Pattern: Export functions directly, no class wrappers
- Examples:
  - `/lib/subscription.ts` - `getUserSubscription(userId)`
  - `/lib/user-profile.ts` - `getUserProfile(userId)`, `updateUserProfile(userId, data)`
  - `/lib/tokens.ts` - `consumeToken(userId, tier)`
  - `/lib/insert-price.ts` - `insertPriceInDB(itemId, payload)`

#### Types
- Main location: `/types/index.ts`
- Domain-specific: `/lib/analyse/types.ts`
- Naming: PascalCase for types, colocated with usage

#### Custom Hooks
- Location: `/hooks/`
- Naming: `use{Feature}.ts`
- Pattern: Return object with `{ data, loading, error, ...actions }`
- Examples: `useSearch`, `useAnalyseItems`, `useSeriesFinance`

#### UI Components
- Base: `/components/ui/` (shadcn/ui + Radix primitives)
- Available: Dialog, Sheet, Button, Input, Card, Badge, Tabs, Checkbox, ScrollArea, Skeleton
- Styling: TailwindCSS v4 + `cn()` utility (clsx + tailwind-merge)
- Feature components: `/components/{feature}/`

#### Error Handling
- API: Try/catch with JSON error response
- Hooks: Set error state, fallback to cached data when possible
- UI: Inline error messages, no toast library currently

#### Loading States
- Hook-based: `loading` boolean in hook returns
- Modal overlays with `LoaderSpinner` component
- Skeleton screens via `/components/ui/skeleton.tsx`

### 2. Items Representation

#### Item Types (Sealed Products)
```typescript
// /lib/analyse/types.ts
type Item = {
  name: string;
  releaseDate: string;
  bloc: string;           // Series/expansion block
  image?: string;
  type: ItemType;         // "ETB" | "Display" | etc.
  retailPrice?: number;   // MSRP
  prices?: PricePoint[];  // Historical prices
}

type PricePoint = { date: string; price: number }

type ItemType = "ETB" | "Display" | "Demi-Display" | "Tri-Pack" |
               "UPC" | "Artset" | "Bundle" | "Coffret Collection Poster"
```

#### Item Queries
- Fetch all items: `GET /api/analyse/items` (5-min server cache)
- Items stored in: `items/{itemId}` Firestore collection
- Prices in: `items/{itemId}/prices` subcollection

### 3. Price Retrieval Logic

#### Primary Source for Sealed Products
- Collection: `items/{itemId}/prices`
- Schema: `{ date: string, price: number | null, createdAt: string }`
- Access: Via `/api/analyse/items` endpoint

#### Index Status API
- Endpoint: `GET /api/index-status`
- Returns: `{ status: "UP_TO_DATE" | "IN_PROGRESS" | "OUTDATED", totalItems, itemsWithTodayPrice }`
- Logic: Checks if all items have today's price entry

#### Caching
- Server: 5-minute in-memory cache (`/api/analyse/items`)
- Client: 2-minute sessionStorage cache (`useAnalyseItems`)
- ISR: `next: { revalidate }` on API routes

### 4. Database Organization

#### Technology
- **Database:** Firebase Firestore (NoSQL)
- **Auth:** Firebase Authentication
- **Dependencies:** `firebase: ^12.6.0`, `firebase-admin: ^13.6.0`

#### Collections Structure
```
subscriptions/{userId}
├── tier: "free" | "pro" | "admin"
├── createdAt: Timestamp
├── expiresAt: Timestamp | null
├── stripeCustomerId?: string
├── stripeSubscriptionId?: string
└── updatedAt: Timestamp

users/{userId}
├── firstName: string
├── lastName: string
├── photoURL: string | null
├── updatedAt: string (ISO)
└── usage/tokens (subcollection document)
    ├── tokens: number
    ├── maxTokens: number
    ├── lastReset: Timestamp
    └── tier: string

items/{itemId}
├── name: string
├── releaseDate: string
├── bloc: string
├── image?: string
├── type: ItemType
├── retailPrice?: number
└── prices/ (subcollection)
    ├── {priceId}
    │   ├── date: string
    │   ├── price: number | null
    │   └── createdAt: string

alerts/{alertId}
├── userId: string (owner)
└── ... (alert config)
```

#### Security Rules Pattern
- Helper functions: `isAuthenticated()`, `isOwner(userId)`, `isAdmin()`, `isPro()`
- User data: Read/write by owner only
- Public data: `items`, `index`, `series` - read all, write admin
- Pro features: Check subscription tier in rules

#### Timestamp Conventions
- Firestore native: `serverTimestamp()` for server operations
- ISO strings: `new Date().toISOString()` for dates
- Parsing: Handle both Timestamp objects and Date objects

### 5. Auth Patterns

#### Context
- Location: `/context/AuthContext.tsx`
- Hook: `useAuth()` returns `{ user, loading, subscription, tier, isPro, isAdmin }`

#### Gating Logic
- Pro features: `isPro || isAdmin`
- Admin features: `isAdmin` only
- Token consumption: Check tier, free users have daily limits

---

## Phase 2: Schema Proposal

### Proposed Collection Schema

Following existing patterns (user data under `users/{uid}/`), I propose:

#### Option A: Subcollection under users (Recommended)
```
users/{userId}/collection/{itemId}
├── itemId: string          // Reference to items/{itemId}
├── itemName: string        // Denormalized for display
├── itemImage: string       // Denormalized for display
├── itemType: ItemType      // Denormalized for filtering
├── quantity: number        // Number of copies owned
├── addedAt: Timestamp      // When added to collection
├── updatedAt: Timestamp    // Last modification
└── purchase?: {            // Optional purchase metadata
    ├── price: number       // Purchase price per unit
    ├── totalCost: number   // quantity * price
    ├── date?: string       // Purchase date (ISO)
    └── notes?: string      // Optional notes
}
```

**Rationale:**
- Follows existing `users/{uid}/usage/tokens` subcollection pattern
- User-scoped data stays under user document
- Document ID = itemId for easy lookups and updates
- Denormalized fields avoid joins for display (consistent with how alerts likely work)

#### Collection Value Snapshots
```
users/{userId}/collection-snapshots/{date}
├── date: string            // YYYY-MM-DD
├── totalValue: number      // Sum of (quantity * currentPrice)
├── totalCost: number       // Sum of purchase costs (if tracked)
├── itemCount: number       // Total items in collection
├── createdAt: Timestamp
└── items: [                // Optional: breakdown per item
    {
      itemId: string,
      quantity: number,
      unitPrice: number,
      totalValue: number
    }
]
```

**Rationale:**
- One document per day maximum (lazy snapshot pattern)
- Document ID = date for easy daily lookups
- Follows same subcollection pattern

### Security Rules Addition
```javascript
// In firestore.rules, add:
match /users/{userId}/collection/{itemId} {
  allow read, write: if isOwner(userId);
}

match /users/{userId}/collection-snapshots/{snapshotId} {
  allow read, write: if isOwner(userId);
}
```

---

## Phase 3: Implementation Plan

### 1. Types + DB Access
- [ ] Add types in `/types/collection.ts`
- [ ] Add service functions in `/lib/collection.ts`

### 2. "Add to Collection" UI
- [ ] Create `AddToCollectionDialog` component
- [ ] Integrate in `/app/analyse/page.tsx` item cards
- [ ] Add auth check (login CTA if not authenticated)

### 3. "Ma Collection" Page
- [ ] Create `/app/ma-collection/page.tsx`
- [ ] Add `useCollection` hook
- [ ] Summary metrics component
- [ ] Holdings list/table with edit/remove

### 4. Pricing Aggregation
- [ ] Reuse existing price data from `/api/analyse/items`
- [ ] Compute total value by joining collection with prices

### 5. Value History (Lazy Snapshots)
- [ ] Create snapshot on first daily visit
- [ ] Simple line chart for history

### 6. Security Rules
- [ ] Update `firestore.rules` with collection rules

---

## Constraints & Risks

### Constraints
1. Must use existing Firestore structure
2. No new third-party services
3. Must support free/pro/admin tiers (TBD: is collection a pro feature?)
4. French UI labels required

### Risks & Mitigations
| Risk | Mitigation |
|------|------------|
| Price data missing for some items | Show "N/A" gracefully, exclude from totals |
| Large collections slow to load | Paginate if needed, use indexes |
| Snapshot bloat over time | Consider retention policy (e.g., 90 days) |
| Cross-user data access | Firestore rules enforce owner-only access |

---

## Questions for Clarification

1. Should the collection feature be available to all users or Pro-only?
2. Is there a maximum collection size to enforce?
3. Should we track individual card items (from `/cartes`) or only sealed products (from `/analyse`)?

---

## Phase 3: Implementation Summary

### Files Created

| File | Purpose |
|------|---------|
| `/types/collection.ts` | TypeScript types for collection feature |
| `/lib/collection.ts` | Firestore service functions for collection CRUD |
| `/hooks/useCollection.ts` | Custom hook for collection state management |
| `/components/collection/AddToCollectionDialog.tsx` | Dialog for adding items to collection |
| `/app/ma-collection/page.tsx` | Collection management page |

### Files Modified

| File | Changes |
|------|---------|
| `/firestore.rules` | Added security rules for `users/{userId}/collection` and `users/{userId}/collection-snapshots` |
| `/components/icons.tsx` | Added collection, plusCircle, minusCircle, calendar, euro icons |
| `/components/layout/Navbar.tsx` | Added "Collection" navigation link |
| `/components/analyse/ItemCard.tsx` | Added "Add to Collection" button on product cards |

### Features Implemented

1. **Add to Collection**
   - Button on each product card in `/analyse` page
   - Dialog with quantity input and optional purchase metadata
   - Visual indicator when item is already in collection

2. **Collection Page (`/ma-collection`)**
   - Summary metrics (total value, total cost, profit/loss)
   - Value history chart (from daily snapshots)
   - Filterable and sortable item grid
   - Edit quantity and purchase price
   - Remove items from collection

3. **Lazy Snapshots**
   - Automatically creates one snapshot per day on first visit
   - Stores total value, cost, and item count
   - Used for value history chart

4. **Security**
   - Firestore rules ensure users can only access their own collection
   - All routes enforce authentication

### Database Schema

```
users/{userId}/collection/{itemId}
├── itemId: string
├── itemName: string
├── itemImage: string
├── itemType: ItemType
├── itemBloc: string
├── quantity: number
├── addedAt: Timestamp
├── updatedAt: Timestamp
└── purchase?: {
    ├── price: number
    ├── totalCost: number
    ├── date?: string
    └── notes?: string
}

users/{userId}/collection-snapshots/{date}
├── date: string (YYYY-MM-DD)
├── totalValue: number
├── totalCost: number
├── itemCount: number
└── createdAt: Timestamp
```

### Acceptance Checklist

- [x] Logged-in user can add item with qty (+ optional purchase fields)
- [x] Collection page shows correct computed total from existing price source
- [x] User can edit qty / remove item
- [x] Snapshots create at most one per day and chart renders
- [x] No cross-user data access possible (Firestore rules enforced)
