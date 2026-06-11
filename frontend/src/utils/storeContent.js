const picsum = (seed, width = 1600, height = 1000) =>
  `https://picsum.photos/seed/${seed}/${width}/${height}`

export const announcementMessages = [
  'Flat Rs. 300 off on the first style drop',
  'Free shipping across India',
  'Easy exchange on eligible styles',
  'COD available on select orders',
  'New season edits now live',
]

export const navGroups = [
  {
    label: 'New In',
    items: [
      { label: 'Dresses', to: '/collections/new-arrivals?category=dresses' },
      { label: 'Co-ord Sets', to: '/collections/new-arrivals?category=co-ord%20sets' },
      { label: 'Gowns', to: '/collections/new-arrivals?category=gowns' },
      { label: 'Fresh Drops', to: '/collections/new-arrivals?sortBy=new_arrivals' },
    ],
  },
  {
    label: 'Dresses',
    items: [
      { label: 'Mini Dresses', to: '/collections/new-arrivals?category=dresses&tag=mini' },
      { label: 'Maxi Dresses', to: '/collections/new-arrivals?category=dresses&tag=maxi' },
      { label: 'Occasion Dresses', to: '/collections/new-arrivals?category=dresses' },
      { label: 'Trending Dresses', to: '/collections/new-arrivals?category=dresses&sortBy=featured' },
    ],
  },
  {
    label: 'Co-Ords',
    items: [
      { label: 'Matching Sets', to: '/collections/new-arrivals?category=co-ord%20sets' },
      { label: 'Boss Mode', to: '/collections/boss-mode' },
      { label: 'Soft Glam Sets', to: '/collections/amore?category=co-ord%20sets' },
      { label: 'Travel Co-Ords', to: '/collections/new-arrivals?category=co-ord%20sets&tag=resort' },
    ],
  },
  {
    label: 'Occasion',
    items: [
      { label: 'Wedding Guest', to: '/collections/new-arrivals?tag=occasion' },
      { label: 'Evening Gowns', to: '/collections/new-arrivals?category=gowns' },
      { label: 'Cocktail Looks', to: '/collections/mon-cheri' },
      { label: 'Celebrity Closet', to: '/collections/celebrity-closet' },
    ],
  },
  {
    label: 'Luxe',
    items: [
      { label: 'Shopzy Luxe', to: '/collections/shopzy-luxe' },
      { label: 'Mon Cheri', to: '/collections/mon-cheri' },
      { label: 'Amore', to: '/collections/amore' },
      { label: 'Premium Picks', to: '/collections/new-arrivals?sortBy=price_desc' },
    ],
  },
  {
    label: 'Studio',
    items: [
      { label: 'Under Rs. 5000', to: '/collections/new-arrivals?maxPrice=5000' },
      { label: 'Rs. 5000 - 8000', to: '/collections/new-arrivals?minPrice=5000&maxPrice=8000' },
      { label: 'Above Rs. 8000', to: '/collections/new-arrivals?minPrice=8000' },
      { label: 'All Collections', to: '/collections/new-arrivals' },
    ],
  },
]

// SHOPZY Category Icons (20 categories - two rows of 10)
export const shopzyCategories = [
  // Row 1
  { label: 'Computers & Laptops', icon: '🖥️', category: 'computers', image: picsum('category-computers', 300, 300) },
  { label: 'Fashion', icon: '👗', category: 'fashion', image: picsum('category-fashion', 300, 300) },
  { label: 'Home & Living', icon: '🛋️', category: 'home-living', image: picsum('category-home-living', 300, 300) },
  { label: 'Beauty & Health', icon: '💄', category: 'beauty', image: picsum('category-beauty', 300, 300) },
  { label: 'Baby & Kids', icon: '👶', category: 'baby-kids', image: picsum('category-baby', 300, 300) },
  { label: 'Sports & Outdoors', icon: '🎽', category: 'sports', image: picsum('category-sports', 300, 300) },
  { label: 'Automotive', icon: '🚗', category: 'automotive', image: picsum('category-auto', 300, 300) },
  { label: 'Electronics', icon: '📺', category: 'electronics', image: picsum('category-electronics', 300, 300) },
  { label: 'Groceries', icon: '🥦', category: 'groceries', image: picsum('category-groceries', 300, 300) },
  { label: 'Pet Supplies', icon: '🐱', category: 'pet-supplies', image: picsum('category-pet', 300, 300) },
  // Row 2
  { label: 'Mobile & Gadgets', icon: '📱', category: 'mobile', image: picsum('category-mobile', 300, 300) },
  { label: 'Gaming', icon: '🎮', category: 'gaming', image: picsum('category-gaming', 300, 300) },
  { label: 'Office & Stationery', icon: '📊', category: 'office', image: picsum('category-office', 300, 300) },
  { label: 'Travel & Luggage', icon: '🧳', category: 'travel', image: picsum('category-travel', 300, 300) },
  { label: 'Watches & Accessories', icon: '⌚', category: 'watches', image: picsum('category-watches', 300, 300) },
  { label: 'Furniture', icon: '🪑', category: 'furniture', image: picsum('category-furniture', 300, 300) },
  { label: 'Books & Media', icon: '📚', category: 'books', image: picsum('category-books', 300, 300) },
  { label: 'Tools & Home', icon: '🔧', category: 'tools', image: picsum('category-tools', 300, 300) },
  { label: 'Music & Instruments', icon: '🎧', category: 'music', image: picsum('category-music', 300, 300) },
  { label: 'Men\'s Grooming', icon: '🪒', category: 'mens-grooming', image: picsum('category-grooming', 300, 300) },
]

// Legacy compatibility
export const quickLinks = shopzyCategories.slice(0, 7)

export const marketHeroSlides = [
  {
    image: picsum('market-hero-1', 1700, 1100),
    eyebrow: 'Runway ready',
    title: 'Statement layers for everyday standout dressing',
    subtitle: 'Sharp jackets, fluid co-ords, and polished separates in a cleaner, easier-to-shop format.',
    cta: '/collections/new-arrivals',
  },
  {
    image: picsum('market-hero-2', 1700, 1100),
    eyebrow: 'Fresh launch',
    title: 'New-season silhouettes with high-energy color and movement',
    subtitle: 'Discover fresh drops across dresses, gowns, and occasion-led edits built for scroll-stopping style.',
    cta: '/collections/new-arrivals',
  },
  {
    image: picsum('market-hero-3', 1700, 1100),
    eyebrow: 'Trending now',
    title: 'Easy glamour, faster discovery, stronger edits',
    subtitle: 'Browse premium collections, trending categories, and current offers without losing the fashion-first feel.',
    cta: '/collections/new-arrivals?sortBy=featured',
  },
]

// SHOPZY Hero Banners (60/40 split)
export const shopzyHeroBanners = [
  {
    title: 'Weekend Shock Sale',
    subtitle: 'Up to 70% off on luggage & travel bags',
    description: 'Limited time offers on premium luggage, backpacks, and travel accessories.',
    cta: '/collections/new-arrivals?tag=weekend-sale',
    color: 'purple',
    image: picsum('shopzy-luggage', 1200, 800),
  },
  {
    title: 'Anniversary Deals',
    subtitle: 'Celebrating 5 Years of SHOPZY',
    description: 'Golden balloons & exclusive deals on anniversary collections.',
    cta: '/collections/new-arrivals?tag=anniversary',
    color: 'blue',
    image: picsum('shopzy-anniversary', 800, 800),
  },
]

export const marketPromoPanels = [
  {
    title: 'Active Glam',
    offer: '40-70% off',
    description: 'Performance-led layers and easy separates that keep the styling polished.',
    brands: ['Boss Mode', 'Shopzy Luxe', 'Amore'],
    cta: '/collections/new-arrivals?category=jackets',
  },
  {
    title: 'Going-Out Edit',
    offer: 'Party-ready picks',
    description: 'Evening gowns, soft shimmer, and co-ords that feel camera-ready without the clutter.',
    brands: ['Mon Cheri', 'Celebrity Closet', 'New Arrivals'],
    cta: '/collections/celebrity-closet',
  },
]

export const heroSlides = [
  {
    image: picsum('hero-slide-1'),
    title: 'Luxe silhouettes designed for statement arrivals',
    subtitle: 'Premium Indian womenswear with fluid tailoring and editorial polish.',
    cta: '/collections/new-arrivals',
  },
  {
    image: picsum('hero-slide-2'),
    title: 'Occasionwear that moves with confidence and ease',
    subtitle: 'Discover crafted satin, clean lines, and modern feminine drape.',
    cta: '/collections/mon-cheri',
  },
  {
    image: picsum('hero-slide-3'),
    title: 'Power dressing with soft gold restraint',
    subtitle: 'Boss Mode pairs sharp tailoring with elevated evening energy.',
    cta: '/collections/boss-mode',
  },
]

export const secondarySlides = [
  {
    image: picsum('secondary-slide-1', 1600, 900),
    title: 'Celebrity Closet',
    subtitle: 'Camera-ready pieces with dramatic shine and elevated finish.',
    cta: '/collections/celebrity-closet',
  },
  {
    image: picsum('secondary-slide-2', 1600, 900),
    title: 'Mon Cheri',
    subtitle: 'Romantic occasionwear with satin, shimmer, and soft structure.',
    cta: '/collections/mon-cheri',
  },
  {
    image: picsum('secondary-slide-3', 1600, 900),
    title: 'Amore',
    subtitle: 'Lighter neutrals and polished textures for everyday luxury.',
    cta: '/collections/amore',
  },
]

export const saleHighlights = [
  'BUY 1 GET 10% OFF',
  'BUY 2 GET 15% OFF',
  'BUY 3 GET 20% OFF',
]

export const editorialSections = {
  monCheri: {
    image: picsum('mon-cheri-editorial', 1800, 900),
    title: 'Mon Cheri',
    subtitle: 'Romantic evening edits in satin, gloss, and modern drape.',
    tag: 'mon-cheri',
    link: '/collections/mon-cheri',
  },
  bossMode: {
    image: picsum('boss-mode-editorial', 1800, 900),
    title: 'Boss Mode',
    subtitle: 'Strong lines, structured tailoring, and after-dark confidence.',
    tag: 'boss-mode',
    link: '/collections/boss-mode',
  },
}

export const contactDetails = {
  address: 'Shopzy Studio, 42 E-Commerce District, Mumbai, India',
  email: 'info@shopzy.in',
  phone: '+91 93023 84486',
}

export const footerLinks = {
  information: [
    { label: 'Contact', to: '/contact' },
    { label: 'About', to: '/about' },
    { label: 'FAQs', to: '/faqs' },
    { label: 'Size Chart', to: '/size-chart' },
    { label: 'Return / Refund Policy', to: '/policies/return' },
  ],
  social: [
    { label: 'Instagram', href: 'https://instagram.com' },
    { label: 'Pinterest', href: 'https://pinterest.com' },
    { label: 'Facebook', href: 'https://facebook.com' },
  ],
}

export const faqItems = [
  {
    title: 'How does the SHOPZYDEAL coupon work?',
    content: 'Use code SHOPZYDEAL at checkout to get 10% off 1 item, 15% off 2 items, and 20% off 3 or more items.',
  },
  {
    title: 'Do you offer cash on delivery?',
    content: 'Yes. COD is available on eligible orders across India.',
  },
  {
    title: 'How long does shipping take?',
    content: 'Orders usually dispatch within 2 business days and are delivered within 3 to 7 business days depending on location.',
  },
  {
    title: 'Can I exchange or return an item?',
    content: 'Eligible items can be returned or exchanged according to the policy listed on our policy pages.',
  },
]

export const sizeChartRows = [
  { size: 'XS', bust: '32', waist: '26', hips: '36' },
  { size: 'S', bust: '34', waist: '28', hips: '38' },
  { size: 'M', bust: '36', waist: '30', hips: '40' },
  { size: 'L', bust: '38', waist: '32', hips: '42' },
  { size: 'XL', bust: '40', waist: '34', hips: '44' },
  { size: 'XXL', bust: '42', waist: '36', hips: '46' },
]

export const policyContent = {
  shipping: {
    title: 'Shipping Policy',
    intro: 'We currently offer shipping across India with order updates shared by email.',
    bullets: [
      'Orders are processed within 1 to 2 business days.',
      'Standard delivery usually takes 3 to 7 business days.',
      'Shipping timelines may vary during launches and sale periods.',
    ],
  },
  refund: {
    title: 'Refund Policy',
    intro: 'Approved refunds are processed back to the original payment method or store credit as applicable.',
    bullets: [
      'Refunds are initiated after quality checks on returned items.',
      'Processing timelines depend on your bank or payment provider.',
      'Shipping charges are non-refundable unless the order arrives damaged or incorrect.',
    ],
  },
  return: {
    title: 'Return Policy',
    intro: 'Returns are accepted on eligible styles within the return window published at purchase.',
    bullets: [
      'Items must be unused, unwashed, and returned with all original tags.',
      'Made-to-order and intimate styles may be non-returnable.',
      'Requests started outside the return window may be declined.',
    ],
  },
  privacy: {
    title: 'Privacy Policy',
    intro: 'We collect only the information needed to process orders, support customers, and improve the shopping experience.',
    bullets: [
      'Customer data is handled securely and never sold to third parties.',
      'Marketing emails are sent only to users who subscribe.',
      'You may contact us to review or update your personal information.',
    ],
  },
  terms: {
    title: 'Terms & Conditions',
    intro: 'By using the website, you agree to the terms governing orders, payments, and website usage.',
    bullets: [
      'Product availability and pricing may change without prior notice.',
      'Orders can be canceled if payment authorization fails or inventory is unavailable.',
      'Content on the website is owned by the brand and may not be reused without permission.',
    ],
  },
}

export const aboutSections = [
  {
    title: 'Quality products at great prices',
    text: 'Shopzy is your one-stop destination for electronics, fashion, home, beauty, and more. We curate the best products from top brands and deliver them straight to your doorstep.',
    image: picsum('about-story-1', 1200, 1400),
  },
  {
    title: 'Fast delivery across India',
    text: 'With pan-India shipping and quick delivery times, Shopzy ensures you get your orders when you need them. Shop now and experience the future of e-commerce.',
    image: picsum('about-story-2', 1200, 1400),
  },
]
