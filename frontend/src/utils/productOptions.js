export const CATEGORIES = [
  { value: 'electronics', label: 'Electronics' },
  { value: 'laptops', label: 'Laptops' },
  { value: 'tv', label: 'TV & Entertainment' },
  { value: 'fashion', label: 'Fashion' },
  { value: 'home-living', label: 'Home & Living' },
  { value: 'beauty', label: 'Beauty & Health' },
  { value: 'baby-kids', label: 'Baby & Kids' },
  { value: 'sports', label: 'Sports & Outdoors' },
  { value: 'automotive', label: 'Automotive' },
  { value: 'groceries', label: 'Groceries' },
  { value: 'mobile', label: 'Mobile & Gadgets' },
  { value: 'furniture', label: 'Furniture' },
  { value: 'books', label: 'Books' },
  { value: 'gaming', label: 'Gaming' },
  { value: 'toys', label: 'Toys & Games' },
  { value: 'pet-supplies', label: 'Pet Supplies' },
  { value: 'office', label: 'Office Supplies' },
  { value: 'watches', label: 'Watches' },
  { value: 'jewelry', label: 'Jewelry' },
  { value: 'bags', label: 'Bags & Luggage' },
  { value: 'dresses', label: 'Dresses' },
  { value: 'menswear', label: 'Menswear' },
  { value: 'womenswear', label: 'Womenswear' },
  { value: 'footwear', label: 'Footwear' },
  { value: 'other', label: 'Other' },
]

// Categories that don't need size selection (like electronics, phones, etc.)
export const CATEGORIES_NO_SIZE = [
  'electronics',
  'laptops',
  'tv',
  'mobile',
  'home-living',
  'beauty',
  'groceries',
  'furniture',
  'books',
  'gaming',
  'toys',
  'pet-supplies',
  'office',
  'watches',
  'jewelry',
  'automotive',
]

// Categories that need size selection (like clothing)
export const CATEGORIES_WITH_SIZE = [
  'fashion',
  'dresses',
  'menswear',
  'womenswear',
  'footwear',
  'sports',
  'baby-kids',
  'bags',
]

export const COLORS = [
  'black',
  'white',
  'red',
  'blue',
  'green',
  'yellow',
  'orange',
  'pink',
  'purple',
  'brown',
  'gray',
  'gold',
  'silver',
  'ivory',
  'beige',
  'navy',
  'teal',
  'maroon',
]

export const GST_SLAB_OPTIONS = [
  { value: 0, label: '0%' },
  { value: 5, label: '5%' },
  { value: 12, label: '12%' },
  { value: 18, label: '18%' },
  { value: 28, label: '28%' },
]

export const SIZES = [
  'XS',
  'S',
  'M',
  'L',
  'XL',
  'XXL',
  '3XL',
  '4XL',
  '5XL',
  '6',
  '7',
  '8',
  '9',
  '10',
  '11',
  '12',
  'Free Size',
  'One Size',
]

export const createInitialProductForm = () => ({
  basePrice: '',
  category: 'fashion',
  collection: '',
  colors: [],
  colorImages: {},
  discountAmount: '',
  description: '',
  attributes: [],
  gstRate: '5',
  images: [],
  name: '',
  sizes: [],
  stock: '',
  tags: '',
})

export const PRODUCT_SPEC_TEMPLATES = {
  electronics: [
    { key: 'brand', section: 'Specifications', label: 'Brand' },
    { key: 'modelName', section: 'Specifications', label: 'Model Name' },
    { key: 'screenSize', section: 'Display', label: 'Screen Size' },
    { key: 'colour', section: 'Specifications', label: 'Colour' },
    { key: 'ramMemoryInstalledSize', section: 'Performance', label: 'RAM Memory Installed Size' },
    { key: 'operatingSystem', section: 'Performance', label: 'Operating System' },
    { key: 'graphicsCardDescription', section: 'Performance', label: 'Graphics Card Description' },
    { key: 'cpuSpeed', section: 'Performance', label: 'CPU Speed' },
    { key: 'hardDiskDescription', section: 'Storage', label: 'Hard Disk Description' },
    { key: 'itemWeight', section: 'Specifications', label: 'Item Weight' },
  ],
  laptops: [
    { key: 'brand', section: 'Specifications', label: 'Brand' },
    { key: 'modelName', section: 'Specifications', label: 'Model Name' },
    { key: 'screenSize', section: 'Display', label: 'Screen Size' },
    { key: 'colour', section: 'Specifications', label: 'Colour' },
    { key: 'ramMemoryInstalledSize', section: 'Performance', label: 'RAM Memory Installed Size' },
    { key: 'operatingSystem', section: 'Performance', label: 'Operating System' },
    { key: 'graphicsCardDescription', section: 'Performance', label: 'Graphics Card Description' },
    { key: 'cpuSpeed', section: 'Performance', label: 'CPU Speed' },
    { key: 'hardDiskDescription', section: 'Storage', label: 'Hard Disk Description' },
    { key: 'itemWeight', section: 'Specifications', label: 'Item Weight' },
  ],
  mobile: [
    { key: 'brand', section: 'Specifications', label: 'Brand' },
    { key: 'modelName', section: 'Specifications', label: 'Model Name' },
    { key: 'screenSize', section: 'Display', label: 'Screen Size' },
    { key: 'colour', section: 'Specifications', label: 'Colour' },
    { key: 'ramMemoryInstalledSize', section: 'Performance', label: 'RAM Memory Installed Size' },
    { key: 'operatingSystem', section: 'Performance', label: 'Operating System' },
    { key: 'cpuSpeed', section: 'Performance', label: 'CPU Speed / Chipset' },
    { key: 'hardDiskDescription', section: 'Storage', label: 'Hard Disk Description' },
    { key: 'itemWeight', section: 'Specifications', label: 'Item Weight' },
    { key: 'variant', section: 'Variants', label: 'Variant' },
  ],
  tv: [
    { key: 'brand', section: 'Specifications', label: 'Brand' },
    { key: 'modelName', section: 'Specifications', label: 'Model Name' },
    { key: 'screenSize', section: 'Display', label: 'Screen Size' },
    { key: 'colour', section: 'Specifications', label: 'Colour' },
    { key: 'operatingSystem', section: 'Smart Features', label: 'Operating System' },
    { key: 'graphicsCardDescription', section: 'Smart Features', label: 'Graphics Card Description' },
    { key: 'cpuSpeed', section: 'Smart Features', label: 'CPU Speed' },
    { key: 'hardDiskDescription', section: 'Smart Features', label: 'Storage / Memory' },
    { key: 'itemWeight', section: 'Specifications', label: 'Item Weight' },
  ],
}

export const getProductSpecTemplate = (category) => PRODUCT_SPEC_TEMPLATES[String(category || '').trim().toLowerCase()] || []

export const buildInitialProductAttributes = (category) =>
  getProductSpecTemplate(category).map((field) => ({
    key: field.key,
    section: field.section,
    label: field.label,
    value: '',
  }))

export const createInitialCollectionForm = () => ({
  bannerImage: '',
  description: '',
  name: '',
})
