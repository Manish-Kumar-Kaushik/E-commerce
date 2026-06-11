import assert from 'node:assert/strict'
import test from 'node:test'

process.env.FORCE_LOCAL_STORE = 'true'
process.env.REQUIRE_DB = 'false'
process.env.NODE_ENV = 'test'

const { default: orderRoutes } = await import('../src/routes/orderRoutes.js')
const { default: paymentRoutes } = await import('../src/routes/paymentRoutes.js')
const { default: Order } = await import('../src/models/Order.js')
const { default: VendorWallet } = await import('../src/models/VendorWallet.js')
const { default: Product } = await import('../src/models/Product.js')
const { default: openApiSpec } = await import('../src/docs/openapi.js')

const routePaths = (router) =>
  router.stack
    .filter((layer) => layer.route)
    .map((layer) => ({
      path: layer.route.path,
      methods: Object.keys(layer.route.methods).sort(),
    }))

test('order routes include cancel and return request endpoints', () => {
  const paths = routePaths(orderRoutes)

  assert.ok(paths.some((entry) => entry.path === '/:id/cancel' && entry.methods.includes('patch')))
  assert.ok(paths.some((entry) => entry.path === '/:id/return-request' && entry.methods.includes('patch')))
})

test('payment routes include stripe create and verify endpoints', () => {
  const paths = routePaths(paymentRoutes)

  assert.ok(paths.some((entry) => entry.path === '/stripe/create-payment-intent' && entry.methods.includes('post')))
  assert.ok(paths.some((entry) => entry.path === '/stripe/verify-payment' && entry.methods.includes('post')))
})

test('critical indexes exist for order, product, and wallet models', () => {
  const orderIndexes = Order.schema.indexes().map(([spec]) => JSON.stringify(spec))
  const productIndexes = Product.schema.indexes().map(([spec]) => JSON.stringify(spec))
  const walletIndexes = VendorWallet.schema.indexes().map(([spec]) => JSON.stringify(spec))

  assert.ok(orderIndexes.includes(JSON.stringify({ user: 1, createdAt: -1 })))
  assert.ok(orderIndexes.includes(JSON.stringify({ reservationExpiresAt: 1, paymentStatus: 1, orderStatus: 1 })))
  assert.ok(orderIndexes.includes(JSON.stringify({ 'subOrders.vendor': 1, 'subOrders.status': 1, createdAt: -1 })))

  assert.ok(productIndexes.includes(JSON.stringify({ vendor: 1, createdAt: -1 })))
  assert.ok(productIndexes.includes(JSON.stringify({ approvalStatus: 1, isPublished: 1, createdAt: -1 })))

  assert.ok(walletIndexes.includes(JSON.stringify({ 'transactions.subOrderId': 1 })))
})

test('openapi spec includes key order/payment/vendor paths', () => {
  assert.ok(openApiSpec.paths['/orders'])
  assert.ok(openApiSpec.paths['/payments/stripe/create-payment-intent'])
  assert.ok(openApiSpec.paths['/payments/stripe/webhook'])
  assert.ok(openApiSpec.paths['/vendors/orders'])
})
