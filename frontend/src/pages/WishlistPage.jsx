import { useSelector } from 'react-redux'
import toast from 'react-hot-toast'
import { Link } from 'react-router-dom'
import ProductCard from '../components/ProductCard'
import Seo from '../components/Seo'
import {
  useGetWishlistQuery,
  useRemoveWishlistItemMutation,
} from '../features/api/apiSlice'

const WishlistPage = () => {
  const token = useSelector((state) => state.auth?.token)
  const { data, isLoading } = useGetWishlistQuery(undefined, { skip: !token })
  const [removeWishlistItem, { isLoading: isRemoving }] = useRemoveWishlistItemMutation()
  const items = data?.wishlist?.items || []

  const handleRemove = async (productId) => {
    try {
      await removeWishlistItem(productId).unwrap()
      toast.success('Removed from wishlist')
    } catch (error) {
      toast.error(error?.data?.message || 'Unable to remove item')
    }
  }

  if (!token) {
    return (
      <div className="container-shell py-12">
        <Seo title="Wishlist" description="Your saved products." />
        <div className="rounded-4xl border border-stone-200 bg-white p-8 text-center">
          <h2 className="text-2xl font-semibold text-stone-950">Sign in required</h2>
          <p className="mt-3 text-stone-600">Wishlist items are saved in your account on MongoDB Atlas.</p>
          <Link to="/account/login" className="gold-button mt-6">
            Sign In
          </Link>
        </div>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="container-shell py-12">
        <Seo title="Wishlist" description="Your saved products." />
        <div className="rounded-4xl border border-stone-200 bg-white p-8 text-center text-stone-600">
          Loading wishlist...
        </div>
      </div>
    )
  }

  return (
    <div className="container-shell py-12">
      <Seo title="Wishlist" description="Your saved products." />

      <div className="mb-8">
        <p className="eyebrow">Account</p>
        <h1 className="mt-3 font-serif-display text-4xl text-stone-950">Wishlist</h1>
        <p className="mt-2 text-stone-600">Products you saved will appear here.</p>
      </div>

      {!items.length ? (
        <div className="rounded-4xl border border-stone-200 bg-white p-8 text-center">
          <h2 className="text-2xl font-semibold text-stone-950">Wishlist is empty</h2>
          <p className="mt-3 text-stone-600">You can save items from the product page using the heart icon.</p>
          <Link to="/products" className="gold-button mt-6">
            Browse Products
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {items.map((product) => (
            <div key={product.product?._id || product._id} className="relative">
              <button
                type="button"
                onClick={() => handleRemove(product.product?._id || product._id)}
                disabled={isRemoving}
                className="absolute right-3 top-3 z-10 rounded-full bg-white/95 px-3 py-1 text-xs font-semibold text-stone-700 shadow-sm transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-60"
              >
                Remove
              </button>
              <ProductCard product={product.product || product} />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default WishlistPage
