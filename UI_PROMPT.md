# Shopzy E-Commerce UI Prompt

## Project Overview
Build a complete, production-ready e-commerce frontend using **React + Tailwind CSS**. The project follows a modern marketplace style (like Amazon, Flipkart, Meesho) with a clean, professional design.

---

## Design System

### Color Palette
- **Primary Brand Color**: `#6236FF` (Purple/Violet)
- **Secondary Brand Color**: `#FFD700` (Gold/Yellow for highlights)
- **Text Primary**: `#333333` (Charcoal/Dark Gray)
- **Text Secondary**: `#666666` (Medium Gray)
- **Text Muted**: `#6B7280` (Light Gray for descriptions)
- **Background Primary**: `#FFFFFF` (Pure White)
- **Background Secondary**: `#F6F6F8` (Light Lavender/Off-White for cards)
- **Background Accent**: `#F5F5FF` (Very Light Purple for hover states)
- **Border Color**: `#E5E7EB` (Light Gray borders)

### Typography
- **Font Family**: Inter, Poppins, or system sans-serif
- **Heading Sizes**: 
  - H1: 3-4xl (text-4xl font-bold)
  - H2: 2-3xl (text-2xl font-semibold)
  - H3: lg-xl (text-lg font-medium)
- **Body Text**: text-sm (14px), text-xs for smaller text
- **Tracking**: Use tracking-wide or tracking-wider for uppercase labels

### Spacing & Layout
- **Container**: `container-shell` (custom max-width container)
- **Grid Gaps**: gap-4, gap-6
- **Card Padding**: p-4, p-5, p-6
- **Border Radius**: 
  - Small: rounded-lg (8px)
  - Medium: rounded-xl (12px)
  - Large: rounded-2xl (16px), rounded-[2rem] (32px)
- **Hover Effects**: `hover:-translate-y-1` + `hover:shadow-lg` transition

---

## Page Structure

### 1. Header (Navbar)

**Desktop Layout (lg+ screens):**
- Top row: Logo (purple "S" icon + "SHOPZY" text), Search bar (centered, max-w-2xl), User icon + Cart icon (right)
- Bottom row: Browse Categories dropdown, Navigation links (Home, Shop, Blog, About, Contact, Become a Seller)

**Mobile Layout:**
- Hamburger menu (left), Logo (center), Search + Cart icons (right)
- Search expands below header when clicked

**Components:**
- Search bar with magnifying glass icon and placeholder "Search products, brands, categories..."
- Cart icon with badge showing item count
- User/Login icon
- Mega menu for categories on hover

**Styling:**
- Sticky header with `sticky top-0 z-30`
- Background: `bg-white/92 backdrop-blur-xl`
- On scroll: `shadow-[0_14px_34px_rgba(15,23,42,0.07)]`
- Nav links: `text-xs font-medium text-[#666666] hover:text-[#6236FF]`

---

### 2. Hero Section

**Layout**: Two-column grid (60% / 40% on desktop)

**Primary Banner (Left - 60%):**
- Purple gradient background
- "Limited Time" badge (gold/yellow)
- Large title, subtitle, description
- "Shop Now" button (purple bg)

**Secondary Banner (Right - 40%):**
- Blue/gold theme
- "Anniversary" badge
- Smaller promotional content

**Styling:**
- `min-h-[320px] lg:min-h-[400px]`
- Gradient overlays on images
- Buttons with hover effects

---

### 3. Categories Section

**Grid**: 10-column responsive grid (category-grid class)

**Each Category Card:**
- White background with subtle shadow
- Icon (emoji or SVG) in circular container
- Label below icon
- Hover: `hover:shadow-[0_20px_40px_rgba(0,0,0,0.15)]`

**Categories (10 total - as per Browse Categories):**
1. Electronics
2. Fashion
3. Home & Living
4. Beauty & Health
5. Baby & Kids
6. Sports & Outdoors
7. Automotive
8. Groceries
9. Pet Supplies
10. Mobile & Gadgets

---

### 4. Product Grid / Collection Page

**Layout**: Sidebar (25%) + Product Grid (75%)

**Sidebar:**
- Light gray background (`bg-gray-100`)
- Sticky on desktop (`sticky top-24`)
- Search input with magnifying glass icon
- Sort dropdown with chevron icon
- Filter sections:
  - Categories (checkboxes)
  - Types (checkboxes)
- Active filters displayed as removable pills

**Product Grid:**
- Responsive: 1 col (mobile), 2 col (sm), 3 col (lg), 4 col (xl)
- Gap: `gap-6`

**Product Card:**
- Square image container (`aspect-square`, `bg-[#F6F6F8]`)
- Pill-shaped category tag (top-right)
- Image with 15% padding (object-contain)
- Below image:
  - Product name: Bold uppercase, `#333333`
  - Price: On right side, bold
  - Description: 2-line truncated, `#6B7280`, text-xs
- Hover: `hover:-translate-y-1 hover:shadow-lg`

**Pagination:**
- Pill-shaped buttons
- Active state: `bg-gray-700 text-white`
- Inactive state: `bg-gray-100 text-gray-600`
- Previous/Next buttons on sides

---

### 5. Footer

**Layout**: 4-column grid on desktop

**Columns:**
1. Brand info: Logo, description, contact details, social badges
2. Information: Policy links (Returns, Shipping, FAQ, etc.)
3. Social: Social media links
4. Payments & Country: Payment method badges, country selector

**Bottom Bar:**
- Copyright text centered
- Background: Dark/surface-panel-dark

**Styling:**
- Dark background (`surface-panel-dark` or custom dark)
- Text: White with reduced opacity (`text-white/72`)
- Section headings in gold accent color (`text-[#d8c296]`)

---

## Key Components

### Buttons
- **Primary**: Purple bg (`bg-[#6236FF]`), white text, hover darker
- **Secondary**: White bg, border, dark text
- **Ghost**: Transparent, borderless, text only
- **Pill Toggle**: Rounded-full, toggleable active/inactive states

### Cards
- **Surface Panel**: White bg, subtle shadow, rounded corners
- **Info Chip**: Small pill-shaped badge for labels

### Forms
- **Inputs**: Rounded-lg, border-gray-300, focus:ring-purple
- **Select**: Custom dropdown with chevron icon

---

## Responsive Breakpoints
- **Mobile**: < 640px (sm)
- **Tablet**: 640px - 1024px (md, lg)
- **Desktop**: > 1024px (xl, 2xl)

---

## Animations & Transitions
- Hover transitions: `duration-300 ease-in-out`
- Fade in animations for loading states
- Scale effects on product hover
- Smooth scroll behavior

---

## Implementation Notes

1. Use **React Router** for navigation
2. Use **Redux Toolkit** for state management
3. Use **RTK Query** for API calls
4. Use **Framer Motion** for animations (optional)
5. Implement lazy loading for images
6. Handle loading and error states gracefully

---

## File Structure (Frontend)
```
frontend/src/
├── components/
│   ├── layout/
│   │   ├── Navbar.jsx
│   │   ├── Footer.jsx
│   │   ├── BottomNav.jsx
│   │   └── Layout.jsx
│   ├── ProductCard.jsx
│   ├── ProductSkeleton.jsx
│   ├── EmptyState.jsx
│   └── ...
├── pages/
│   ├── HomePage.jsx
│   ├── CollectionPage.jsx
│   ├── AllProductsPage.jsx
│   ├── ProductPage.jsx
│   ├── CartPage.jsx
│   └── ...
├── features/
│   ├── api/
│   │   └── apiSlice.js
│   ├── auth/
│   │   └── authSlice.js
│   └── cart/
│       └── cartSlice.js
├── hooks/
│   ├── useCart.js
│   └── ...
└── utils/
    ├── storeContent.js
    ├── currency.js
    └── formatters.js
```

---

## API Endpoints (Expected)
- `GET /products` - List all products with filters
- `GET /products/:slug` - Single product details
- `GET /collections` - List collections
- `GET /collections/:slug` - Collection with products
- `GET /cart` - User's cart
- `POST /cart/items` - Add to cart
- `POST /orders` - Create order

---

This prompt can be used to build or rebuild any part of the Shopzy e-commerce UI from header to footer.