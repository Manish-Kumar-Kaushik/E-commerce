import assert from 'node:assert/strict'
import test from 'node:test'

process.env.FORCE_LOCAL_STORE = 'true'
process.env.REQUIRE_DB = 'false'
process.env.NODE_ENV = 'test'

const { default: app } = await import('../src/app.js')
const { default: apiRoutes } = await import('../src/routes/index.js')
const { default: orderRoutes } = await import('../src/routes/orderRoutes.js')
const { default: productRoutes } = await import('../src/routes/productRoutes.js')
const { default: vendorRoutes } = await import('../src/routes/vendorRoutes.js')
const { loginUser } = await import('../src/services/authService.js')
const { getUserProfile } = await import('../src/services/userService.js')

const routePaths = (router) =>
  router.stack
    .filter((layer) => layer.route)
    .map((layer) => ({
      path: layer.route.path,
      methods: Object.keys(layer.route.methods).sort(),
    }))

const mountedPaths = (router, candidates) =>
  router.stack.flatMap((layer) =>
    candidates.filter((candidate) => layer.matchers?.some((matcher) => matcher(candidate))),
  )

test('app exposes the expected top-level routes', () => {
  const topLevelRoutes = routePaths(app.router)

  assert.deepEqual(
    topLevelRoutes,
    [
      { path: '/api/payments/stripe/webhook', methods: ['post'] },
      { path: '/api/docs.json', methods: ['get'] },
      { path: '/api/docs', methods: ['get'] },
      { path: '/', methods: ['get'] },
      { path: '/health', methods: ['get'] },
    ],
  )
})

test('api router mounts all major route groups including vendors', () => {
  const expectedMounts = [
    '/auth',
    '/users',
    '/products',
    '/collections',
    '/wishlist',
    '/cart',
    '/orders',
    '/payments',
    '/uploads',
    '/notifications',
    '/vendors',
    '/admin',
  ]

  assert.deepEqual(mountedPaths(apiRoutes, expectedMounts), expectedMounts)
})

test('vendor router exposes the full seller workflow endpoints once', () => {
  assert.deepEqual(routePaths(vendorRoutes), [
    { path: '/health', methods: ['get'] },
    { path: '/register', methods: ['post'] },
    { path: '/phone-otp/request', methods: ['post'] },
    { path: '/phone-otp/verify', methods: ['post'] },
    { path: '/me/status', methods: ['get'] },
    { path: '/', methods: ['post'] },
    { path: '/me', methods: ['get'] },
    { path: '/me', methods: ['patch'] },
    { path: '/bank-details', methods: ['get'] },
    { path: '/bank-details', methods: ['put'] },
    { path: '/wallet/withdraw', methods: ['post'] },
    { path: '/orders', methods: ['get'] },
    { path: '/orders/:id/status', methods: ['patch'] },
      { path: '/orders/:id/return/:itemId/approve', methods: ['patch'] },
      { path: '/orders/:id/return/:itemId/reject', methods: ['patch'] },
    { path: '/wallet', methods: ['get'] },
    { path: '/analytics', methods: ['get'] },
    { path: '/:id', methods: ['get'] },
  ])
})


test('order routes expose tracking, invoice, and refund endpoints', () => {
  assert.deepEqual(routePaths(orderRoutes), [
    { path: '/track', methods: ['get'] },
    { path: '/', methods: ['post'] },
    { path: '/', methods: ['get'] },
    { path: '/:id/invoice', methods: ['get'] },
    { path: '/:id', methods: ['get'] },
    { path: '/:id/cancel', methods: ['patch'] },
    { path: '/:id/return-request', methods: ['patch'] },
    { path: '/:id/refund', methods: ['post'] },
    { path: '/:id/status', methods: ['put'] },
  ])
})

test('product routes expose review endpoints', () => {
  assert.deepEqual(routePaths(productRoutes), [
    { path: '/', methods: ['get', 'post'] },
    { path: '/:identifier', methods: ['delete', 'get', 'put'] },
    { path: '/:identifier/reviews', methods: ['get', 'post'] },
    { path: '/reviews/:id', methods: ['delete', 'patch'] },
  ])
})
test('customer login works against the local store and returns a usable profile', async () => {
  const { user, token } = await loginUser({
    email: 'user@example.com',
    password: 'user123',
  })

  assert.equal(user.email, 'user@example.com')
  assert.equal(user.role, 'customer')
  assert.ok(typeof token === 'string' && token.length > 20)

  const profile = await getUserProfile(user._id)
  assert.equal(profile.email, 'user@example.com')
  assert.equal(profile.role, 'customer')
})
