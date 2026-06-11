import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import { API_BASE_URL } from '../../utils/api'

const toQueryString = (params = {}) => {
  const searchParams = new URLSearchParams()

  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') {
      return
    }

    if (Array.isArray(value)) {
      value.forEach((item) => searchParams.append(key, item))
      return
    }

    searchParams.append(key, value)
  })

  const query = searchParams.toString()
  return query ? `?${query}` : ''
}

const rawBaseQuery = fetchBaseQuery({
  baseUrl: API_BASE_URL,
})

const baseQueryWithAuth = async (args, api, extraOptions) => {
  let token = localStorage.getItem('token')

  const request = typeof args === 'string' ? { url: args } : { ...args }
  const headers = new Headers(request.headers || {})

  if (token) {
    headers.set('Authorization', `Bearer ${token}`)
  }

  request.headers = headers

  return rawBaseQuery(request, api, extraOptions)
}

export const apiSlice = createApi({
  reducerPath: 'api',
  baseQuery: baseQueryWithAuth,
  tagTypes: ['Product', 'Collection', 'Cart', 'Order', 'Profile', 'Admin', 'Vendor', 'Wishlist', 'Wallet', 'Notification', 'Review'],
  endpoints: (builder) => ({
    getProducts: builder.query({
      query: (params = {}) => `/products${toQueryString(params)}`,
      providesTags: (result) =>
        result?.products
          ? [
              ...result.products.map((product) => ({ type: 'Product', id: product._id })),
              { type: 'Product', id: 'LIST' },
            ]
          : [{ type: 'Product', id: 'LIST' }],
    }),
    getProduct: builder.query({
      query: (slugOrParams) => {
        if (typeof slugOrParams === 'string') {
          return `/products/${slugOrParams}`
        }

        const { slug, ...params } = slugOrParams || {}
        return `/products/${slug}${toQueryString(params)}`
      },
      providesTags: (result, _error, slugOrParams) => {
        const cacheKey = typeof slugOrParams === 'string' ? slugOrParams : slugOrParams?.slug
        return [{ type: 'Product', id: result?.product?._id || cacheKey }]
      },
    }),
    getProductReviews: builder.query({
      query: ({ identifier, ...params }) => `/products/${identifier}/reviews${toQueryString(params)}`,
      providesTags: (_result, _error, { identifier }) => [{ type: 'Review', id: `PRODUCT_${identifier}` }],
    }),
    getReviewEligibility: builder.query({
      query: (identifier) => `/products/${identifier}/reviews/eligibility`,
      providesTags: (_result, _error, identifier) => [{ type: 'Review', id: `ELIGIBILITY_${identifier}` }],
    }),
    createProductReview: builder.mutation({
      query: ({ identifier, ...body }) => ({
        url: `/products/${identifier}/reviews`,
        method: 'POST',
        body,
      }),
      invalidatesTags: (_result, _error, { identifier }) => [
        { type: 'Review', id: `PRODUCT_${identifier}` },
        { type: 'Review', id: `ELIGIBILITY_${identifier}` },
        { type: 'Product', id: 'LIST' },
      ],
    }),
    updateProductReview: builder.mutation({
      query: (args) => {
        const { id, ...body } = args
        delete body.identifier

        return {
          url: `/products/reviews/${id}`,
          method: 'PATCH',
          body,
        }
      },
      invalidatesTags: (_result, _error, { identifier }) => [
        { type: 'Review', id: `PRODUCT_${identifier}` },
        { type: 'Review', id: `ELIGIBILITY_${identifier}` },
        { type: 'Product', id: 'LIST' },
      ],
    }),
    createProduct: builder.mutation({
      query: (body) => ({
        url: '/products',
        method: 'POST',
        body,
      }),
      invalidatesTags: [{ type: 'Product', id: 'LIST' }, { type: 'Admin', id: 'ANALYTICS' }],
    }),
    updateProduct: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `/products/${id}`,
        method: 'PUT',
        body,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'Product', id },
        { type: 'Product', id: 'LIST' },
        { type: 'Admin', id: 'ANALYTICS' },
      ],
    }),
    deleteProduct: builder.mutation({
      query: (id) => ({
        url: `/products/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: [{ type: 'Product', id: 'LIST' }, { type: 'Admin', id: 'ANALYTICS' }],
    }),
    uploadProductImages: builder.mutation({
      query: (formData) => ({
        url: '/uploads/products',
        method: 'POST',
        body: formData,
      }),
    }),
    getCollections: builder.query({
      query: (params = {}) => `/collections${toQueryString(params)}`,
      providesTags: (result) =>
        result?.collections
          ? [
              ...result.collections.map((collection) => ({ type: 'Collection', id: collection._id })),
              { type: 'Collection', id: 'LIST' },
            ]
          : [{ type: 'Collection', id: 'LIST' }],
    }),
    getCollection: builder.query({
      query: ({ slug, params = {} }) => `/collections/${slug}${toQueryString(params)}`,
      providesTags: (result, error, { slug }) => [
        { type: 'Collection', id: result?.collection?._id || slug },
        { type: 'Product', id: 'LIST' },
      ],
    }),
    createCollection: builder.mutation({
      query: (body) => ({
        url: '/admin/collections',
        method: 'POST',
        body,
      }),
      invalidatesTags: [{ type: 'Collection', id: 'LIST' }],
    }),
    updateCollection: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `/admin/collections/${id}`,
        method: 'PUT',
        body,
      }),
      invalidatesTags: [{ type: 'Collection', id: 'LIST' }],
    }),
    deleteCollection: builder.mutation({
      query: (id) => ({
        url: `/admin/collections/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: [{ type: 'Collection', id: 'LIST' }],
    }),
    register: builder.mutation({
      query: (body) => ({
        url: '/auth/register',
        method: 'POST',
        body,
      }),
    }),
    login: builder.mutation({
      query: (body) => ({
        url: '/auth/login',
        method: 'POST',
        body,
      }),
    }),
    adminLogin: builder.mutation({
      query: (body) => ({
        url: '/auth/admin/login',
        method: 'POST',
        body,
      }),
    }),
    syncUser: builder.mutation({
      query: (body) => ({
        url: '/auth/sync-user',
        method: 'POST',
        body,
      }),
    }),
    requestPasswordResetOtp: builder.mutation({
      query: (body) => ({
        url: '/auth/forgot-password/request-otp',
        method: 'POST',
        body,
      }),
    }),
    verifyPasswordResetOtp: builder.mutation({
      query: (body) => ({
        url: '/auth/forgot-password/verify-otp',
        method: 'POST',
        body,
      }),
    }),
    resetPasswordWithOtp: builder.mutation({
      query: (body) => ({
        url: '/auth/forgot-password/reset',
        method: 'POST',
        body,
      }),
    }),
    getUsers: builder.query({
      query: (params = {}) => `/admin/users${toQueryString(params)}`,
      providesTags: [{ type: 'Admin', id: 'USERS' }],
    }),
    getAdminVendors: builder.query({
      query: (params = {}) => `/admin/vendors${toQueryString(params)}`,
      providesTags: [{ type: 'Admin', id: 'VENDORS' }],
    }),
    approveVendor: builder.mutation({
      query: ({ id, reason }) => ({
        url: `/admin/vendors/${id}/approve`,
        method: 'PATCH',
        body: reason ? { reason } : {},
      }),
      invalidatesTags: [{ type: 'Admin', id: 'VENDORS' }],
    }),
    rejectVendor: builder.mutation({
      query: ({ id, reason }) => ({
        url: `/admin/vendors/${id}/reject`,
        method: 'PATCH',
        body: reason ? { reason } : {},
      }),
      invalidatesTags: [{ type: 'Admin', id: 'VENDORS' }],
    }),
    suspendVendor: builder.mutation({
      query: (id) => ({
        url: `/admin/vendors/${id}/suspend`,
        method: 'PATCH',
      }),
      invalidatesTags: [{ type: 'Admin', id: 'VENDORS' }],
    }),
    getProfile: builder.query({
      query: () => '/users/profile',
      providesTags: [{ type: 'Profile', id: 'ME' }],
    }),
    createProfile: builder.mutation({
      query: (body) => ({
        url: '/users/profile',
        method: 'POST',
        body,
      }),
      invalidatesTags: [{ type: 'Profile', id: 'ME' }],
    }),
    updateProfile: builder.mutation({
      query: (body) => ({
        url: '/users/profile',
        method: 'PUT',
        body,
      }),
      invalidatesTags: [{ type: 'Profile', id: 'ME' }],
    }),
    uploadProfileImage: builder.mutation({
      query: (formData) => ({
        url: '/uploads/profile',
        method: 'POST',
        body: formData,
      }),
      invalidatesTags: [{ type: 'Profile', id: 'ME' }],
    }),
    addAddress: builder.mutation({
      query: (body) => ({
        url: '/users/addresses',
        method: 'POST',
        body,
      }),
      invalidatesTags: [{ type: 'Profile', id: 'ME' }],
    }),
    getCart: builder.query({
      query: () => '/cart',
      providesTags: [{ type: 'Cart', id: 'CURRENT' }],
    }),
    getWishlist: builder.query({
      query: () => '/wishlist',
      providesTags: [{ type: 'Wishlist', id: 'CURRENT' }],
    }),
    toggleWishlistItem: builder.mutation({
      query: (productId) => ({
        url: '/wishlist/toggle',
        method: 'POST',
        body: { productId },
      }),
      invalidatesTags: [{ type: 'Wishlist', id: 'CURRENT' }],
    }),
    removeWishlistItem: builder.mutation({
      query: (productId) => ({
        url: `/wishlist/items/${productId}`,
        method: 'DELETE',
      }),
      invalidatesTags: [{ type: 'Wishlist', id: 'CURRENT' }],
    }),
    clearWishlist: builder.mutation({
      query: () => ({
        url: '/wishlist',
        method: 'DELETE',
      }),
      invalidatesTags: [{ type: 'Wishlist', id: 'CURRENT' }],
    }),
    syncCart: builder.mutation({
      query: (items) => ({
        url: '/cart/sync',
        method: 'POST',
        body: { items },
      }),
      invalidatesTags: [{ type: 'Cart', id: 'CURRENT' }],
    }),
    addCartItem: builder.mutation({
      query: (body) => ({
        url: '/cart/items',
        method: 'POST',
        body,
      }),
      invalidatesTags: [{ type: 'Cart', id: 'CURRENT' }],
    }),
    updateCartItem: builder.mutation({
      query: ({ productId, ...body }) => ({
        url: `/cart/items/${productId}`,
        method: 'PUT',
        body,
      }),
      invalidatesTags: [{ type: 'Cart', id: 'CURRENT' }],
    }),
    removeCartItem: builder.mutation({
      query: ({ productId, size, color }) => ({
        url: `/cart/items/${productId}${toQueryString({ size, color })}`,
        method: 'DELETE',
      }),
      invalidatesTags: [{ type: 'Cart', id: 'CURRENT' }],
    }),
    getOrders: builder.query({
      query: () => '/orders',
      providesTags: [{ type: 'Order', id: 'LIST' }],
    }),
    createOrder: builder.mutation({
      query: (body) => ({
        url: '/orders',
        method: 'POST',
        body,
      }),
      invalidatesTags: [{ type: 'Order', id: 'LIST' }, { type: 'Cart', id: 'CURRENT' }],
    }),
    cancelOrder: builder.mutation({
      query: ({ id, reason }) => ({
        url: `/orders/${id}/cancel`,
        method: 'PATCH',
        body: { reason },
      }),
      invalidatesTags: [{ type: 'Order', id: 'LIST' }, { type: 'Notification', id: 'LIST' }, { type: 'Notification', id: 'COUNT' }],
    }),
    downloadOrderInvoice: builder.mutation({
      query: (id) => ({
        url: `/orders/${id}/invoice`,
        method: 'GET',
        responseHandler: async (response) => response.blob(),
        cache: 'no-cache',
      }),
    }),
    updateOrderStatus: builder.mutation({
      query: ({ id, status }) => ({
        url: `/orders/${id}/status`,
        method: 'PUT',
        body: { status },
      }),
      invalidatesTags: [{ type: 'Order', id: 'LIST' }, { type: 'Admin', id: 'ANALYTICS' }],
    }),
    updateOrderInvoice: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `/orders/${id}/invoice`,
        method: 'PATCH',
        body,
      }),
      invalidatesTags: [{ type: 'Order', id: 'LIST' }],
    }),
    generateProductContent: builder.mutation({
      query: (body) => ({
        url: '/ai/generate-product-content',
        method: 'POST',
        body,
      }),
    }),
    // Stripe payment endpoints
    createStripePaymentIntent: builder.mutation({
      query: (orderId) => ({
        url: '/payments/stripe/create-payment-intent',
        method: 'POST',
        body: { orderId },
      }),
    }),
    verifyStripePayment: builder.mutation({
      query: (paymentIntentId) => ({
        url: '/payments/stripe/verify-payment',
        method: 'POST',
        body: { paymentIntentId },
      }),
      invalidatesTags: [{ type: 'Order', id: 'LIST' }, { type: 'Admin', id: 'ANALYTICS' }],
    }),
    subscribeNewsletter: builder.mutation({
      query: (body) => ({
        url: '/newsletter',
        method: 'POST',
        body,
      }),
    }),
    sendContact: builder.mutation({
      query: (body) => ({
        url: '/contact',
        method: 'POST',
        body,
      }),
    }),
    chatCustomerSupport: builder.mutation({
      query: (body) => ({
        url: '/ai/customer-support/chat',
        method: 'POST',
        body,
      }),
    }),
    getAdminAnalytics: builder.query({
      query: () => '/admin/analytics',
      providesTags: [{ type: 'Admin', id: 'ANALYTICS' }],
    }),
    getAdminOrders: builder.query({
      query: (params = {}) => `/admin/orders${toQueryString(params)}`,
      providesTags: [{ type: 'Order', id: 'LIST' }],
    }),
    getAdminProfile: builder.query({
      query: () => '/admin/profile',
      providesTags: [{ type: 'Admin', id: 'PROFILE' }],
    }),
    updateAdminProfile: builder.mutation({
      query: (body) => ({
        url: '/admin/profile',
        method: 'PUT',
        body,
      }),
      invalidatesTags: [{ type: 'Admin', id: 'PROFILE' }],
    }),
    updateAdminPassword: builder.mutation({
      query: (body) => ({
        url: '/admin/password',
        method: 'PATCH',
        body,
      }),
    }),
    updateAdminEmail: builder.mutation({
      query: (body) => ({
        url: '/admin/email',
        method: 'PATCH',
        body,
      }),
      invalidatesTags: [{ type: 'Admin', id: 'PROFILE' }],
    }),
    // Vendor endpoints
    getVendorProfile: builder.query({
      query: () => '/vendors/me',
      providesTags: [{ type: 'Profile', id: 'VENDOR' }],
    }),
    createVendorProfile: builder.mutation({
      query: (body) => ({
        url: '/vendors/register',
        method: 'POST',
        body,
      }),
      invalidatesTags: [{ type: 'Profile', id: 'VENDOR' }, { type: 'Vendor', id: 'STATUS' }],
    }),
    getMyVendorStatus: builder.query({
      query: () => '/vendors/me/status',
      providesTags: [{ type: 'Vendor', id: 'STATUS' }],
    }),
    updateVendorProfile: builder.mutation({
      query: (body) => ({
        url: '/vendors/me',
        method: 'PATCH',
        body,
      }),
      invalidatesTags: [{ type: 'Profile', id: 'VENDOR' }, { type: 'Vendor', id: 'STATUS' }],
    }),
    getVendorOrders: builder.query({
      query: (params = {}) => `/vendors/orders${toQueryString(params)}`,
      providesTags: [{ type: 'Order', id: 'VENDOR_LIST' }],
    }),
    updateVendorOrderStatus: builder.mutation({
      query: ({ id, status, ...body }) => ({
        url: `/vendors/orders/${id}/status`,
        method: 'PATCH',
        body: { status, ...body },
      }),
      invalidatesTags: [{ type: 'Order', id: 'VENDOR_LIST' }],
    }),
    getVendorWallet: builder.query({
      query: () => '/vendors/wallet',
      providesTags: [{ type: 'Wallet', id: 'VENDOR' }],
    }),
    getVendorAnalytics: builder.query({
      query: () => '/vendors/analytics',
      providesTags: [{ type: 'Admin', id: 'ANALYTICS' }],
    }),
    getNotifications: builder.query({
      query: () => '/notifications',
      providesTags: (result) =>
        result?.notifications
          ? [
              ...result.notifications.map((notification) => ({ type: 'Notification', id: notification._id })),
              { type: 'Notification', id: 'LIST' },
              { type: 'Notification', id: 'COUNT' },
            ]
          : [{ type: 'Notification', id: 'LIST' }, { type: 'Notification', id: 'COUNT' }],
    }),
    getNotificationCount: builder.query({
      query: () => '/notifications/count',
      providesTags: [{ type: 'Notification', id: 'COUNT' }],
    }),
    markNotificationAsRead: builder.mutation({
      query: (notificationId) => ({
        url: `/notifications/${notificationId}/read`,
        method: 'PATCH',
      }),
      invalidatesTags: (result, error, notificationId) => [
        { type: 'Notification', id: notificationId },
        { type: 'Notification', id: 'LIST' },
        { type: 'Notification', id: 'COUNT' },
      ],
    }),
    getCoupons: builder.query({
      query: () => '/admin/coupons',
      providesTags: (result) =>
        result?.coupons
          ? [
              ...result.coupons.map((coupon) => ({ type: 'Coupon', id: coupon._id })),
              { type: 'Coupon', id: 'LIST' },
            ]
          : [{ type: 'Coupon', id: 'LIST' }],
    }),
    createCoupon: builder.mutation({
      query: (body) => ({
        url: '/admin/coupons',
        method: 'POST',
        body,
      }),
      invalidatesTags: [{ type: 'Coupon', id: 'LIST' }],
    }),
    updateCoupon: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `/admin/coupons/${id}`,
        method: 'PUT',
        body,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'Coupon', id },
        { type: 'Coupon', id: 'LIST' },
      ],
    }),
    deleteCoupon: builder.mutation({
      query: (id) => ({
        url: `/admin/coupons/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: [{ type: 'Coupon', id: 'LIST' }],
    }),
    getVendorBankDetails: builder.query({
      query: () => '/vendors/bank-details',
      providesTags: [{ type: 'Vendor', id: 'BANK_DETAILS' }],
    }),
    updateVendorBankDetails: builder.mutation({
      query: (body) => ({
        url: '/vendors/bank-details',
        method: 'PUT',
        body,
      }),
      invalidatesTags: [{ type: 'Vendor', id: 'BANK_DETAILS' }],
    }),
    withdrawFromWallet: builder.mutation({
      query: (body) => ({
        url: '/vendors/wallet/withdraw',
        method: 'POST',
        body,
      }),
      invalidatesTags: [{ type: 'Wallet', id: 'VENDOR' }],
    }),
  }),
})

export const {
  useAddAddressMutation,
  useAddCartItemMutation,
  useCreateCollectionMutation,
  useCreateCouponMutation,
  useCreateOrderMutation,
  useCancelOrderMutation,
  useDownloadOrderInvoiceMutation,
  useCreateProductReviewMutation,
  useUpdateProductReviewMutation,
  useCreateProductMutation,
  useCreateProfileMutation,
  useCreateStripePaymentIntentMutation,
  useDeleteCollectionMutation,
  useDeleteCouponMutation,
  useDeleteProductMutation,
  useGetAdminAnalyticsQuery,
  useGetAdminOrdersQuery,
  useGetAdminProfileQuery,
  useGetCartQuery,
  useGetCollectionQuery,
  useGetCollectionsQuery,
  useGetCouponsQuery,
  useGetOrdersQuery,
  useGetWishlistQuery,
  useGetMyVendorStatusQuery,
  useGetProductQuery,
  useGetReviewEligibilityQuery,
  useGetProductReviewsQuery,
  useGetProductsQuery,
  useGetProfileQuery,
  useGetUsersQuery,
  useGetAdminVendorsQuery,
  useApproveVendorMutation,
  useRejectVendorMutation,
  useSuspendVendorMutation,
  useAdminLoginMutation,
  useLoginMutation,
  useRegisterMutation,
  useRequestPasswordResetOtpMutation,
  useUpdateAdminProfileMutation,
  useUpdateAdminPasswordMutation,
  useUpdateAdminEmailMutation,
  useUpdateCouponMutation,
  useVerifyPasswordResetOtpMutation,
  useResetPasswordWithOtpMutation,
  useRemoveCartItemMutation,
  useRemoveWishlistItemMutation,
  useSendContactMutation,
  useChatCustomerSupportMutation,
  useSubscribeNewsletterMutation,
  useSyncCartMutation,
  useSyncUserMutation,
  useClearWishlistMutation,
  useUpdateCartItemMutation,
  useUpdateCollectionMutation,
  useUpdateOrderStatusMutation,
  useUpdateOrderInvoiceMutation,
  useGenerateProductContentMutation,
  useUpdateProductMutation,
  useUpdateProfileMutation,
  useUploadProfileImageMutation,
  useUploadProductImagesMutation,
  useVerifyStripePaymentMutation,
  useToggleWishlistItemMutation,
  useGetVendorProfileQuery,
  useCreateVendorProfileMutation,
  useUpdateVendorProfileMutation,
  useGetVendorOrdersQuery,
  useUpdateVendorOrderStatusMutation,
  useGetVendorWalletQuery,
  useGetVendorAnalyticsQuery,
  useGetNotificationsQuery,
  useGetNotificationCountQuery,
  useMarkNotificationAsReadMutation,
  useGetVendorBankDetailsQuery,
  useUpdateVendorBankDetailsMutation,
  useWithdrawFromWalletMutation,
} = apiSlice
