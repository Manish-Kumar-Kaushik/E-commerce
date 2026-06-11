# E-Commerce Backend

![Backend CI](https://github.com/OWNER/REPO/actions/workflows/backend-ci.yml/badge.svg)

> Replace `OWNER/REPO` with the actual GitHub repository slug to show the live status badge.

Production-ready Node.js + Express + MongoDB backend for an e-commerce app.

## Features

- JWT auth with role-based access
- User profile and multiple addresses
- Product CRUD, search, filter, pagination
- Reviews and ratings
- Cart and order flow
- Razorpay payment order + signature verification
- Cloudinary image upload
- Admin analytics, user management, order management
- Validation, error handling, rate limiting, logging

## API Docs

- Interactive Swagger UI: `/api/docs`
- OpenAPI JSON: `/api/docs.json`
- Swagger UI assets are bundled locally, so docs work without a CDN

## Run Locally

1. Update `.env` from `.env.example`
2. Start MongoDB locally or use MongoDB Atlas
3. Install dependencies:

```bash
npm install
```

4. Optional: seed demo data:

```bash
npm run seed
```

5. Start the server:

```bash
npm run dev
```

6. Run the smoke test in another terminal:

```bash
npm run smoke
```

7. Import Postman files if you want full API testing:

- Collection: `postman/ecommerce-backend.postman_collection.json`
- Environment: `postman/ecommerce-local.postman_environment.json`

## Production Checks

- Run the index review with real MongoDB `explain()` stats:

```bash
npm run index:review
```

- CI fails only when index-review thresholds are exceeded:
	- `INDEX_REVIEW_MAX_EXECUTION_MS`
	- `INDEX_REVIEW_MAX_DOCS_EXAMINED_PER_RETURNED_DOC`
	- `INDEX_REVIEW_MAX_DOCS_EXAMINED_WITHOUT_RESULTS`
- Default thresholds are set in `.github/workflows/backend-ci.yml`

## Quick Health Check

When the server is running, test these first:

```bash
curl http://localhost:5000/
curl http://localhost:5000/health
```

Expected:

- `/` returns a JSON success message
- `/health` returns the app status and current database status
- `npm run smoke` checks `/`, `/health`, login, and profile automatically

## Demo Credentials

Available after `npm run seed`:

- Admin: `admin@example.com` / `Admin@123`
- User: `user@example.com` / `User@123`

## Suggested Postman Test Flow

1. `POST /api/auth/login` with admin credentials
2. Copy the returned JWT token
3. `POST /api/products` with `Authorization: Bearer <token>`
4. `GET /api/products`
5. Login as normal user
6. `POST /api/cart/items`
7. `GET /api/cart`
8. `POST /api/orders`
9. `POST /api/payments/create-order`
10. `POST /api/payments/verify`

The import-ready files are in [postman/ecommerce-backend.postman_collection.json](/Users/manishkumarkaushik/Desktop/Project/backend/postman/ecommerce-backend.postman_collection.json) and [postman/ecommerce-local.postman_environment.json](/Users/manishkumarkaushik/Desktop/Project/backend/postman/ecommerce-local.postman_environment.json).

## Main API Groups

- `/api/auth`
- `/api/users`
- `/api/products`
- `/api/cart`
- `/api/orders`
- `/api/payments`
- `/api/uploads`
- `/api/admin`

## Important Note

If MongoDB is not reachable, the app can still boot while `REQUIRE_DB=false`, but database-backed endpoints will not work until `MONGO_URI` points to a live database.
