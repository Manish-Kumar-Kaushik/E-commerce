# macOS Setup Guide For This Repo

This guide is for the current project in this workspace.

Important differences from the old generic guide:

- Do not create a new `ecommerce-app` folder
- Do not copy downloaded backend/frontend starter files
- Backend runs on `http://localhost:5000`
- Frontend runs on `http://localhost:5173`
- API base is `http://localhost:5000/api`
- This repo already contains the code structure

## 1. Prerequisites

Check what you already have:

```bash
node --version
npm --version
brew --version
```

You need:

- Node.js 18+
- npm 9+
- MongoDB running locally or a MongoDB Atlas URI

## 2. Open This Project

```bash
cd /Users/manishkumarkaushik/Desktop/Project
```

## 3. Backend Setup

Open one terminal:

```bash
cd backend
npm install
```

Check `backend/.env`.

These are the important values:

- `PORT=5000`
- `MONGO_URI=...`
- `JWT_SECRET=...`
- `CLIENT_URL=http://localhost:5173`

Cloudinary is already configured in this repo.

If you want payment routes too, also add:

- `RAZORPAY_KEY_ID`
- `RAZORPAY_KEY_SECRET`

## 4. MongoDB

You must have a working MongoDB connection for auth, products, cart, orders, and seeding.

Important:

- This project is now configured to use MongoDB as the primary source of truth.
- `REQUIRE_DB=true` in `backend/.env`, so the backend will not silently fall back to local files.
- If MongoDB Atlas is used, make sure your current IP is added to the Atlas Network Access whitelist.

Two options:

- Local MongoDB:
  Use your installed MongoDB service and keep `MONGO_URI=mongodb://localhost:27017/myapp`
- MongoDB Atlas:
  Replace `MONGO_URI` in `backend/.env` with your Atlas connection string

## 5. Seed Demo Data

Still inside `backend`:

```bash
npm run seed
```

This creates demo users and products.

Demo credentials:

- Admin: `admin@example.com` / `Admin@123`
- User: `user@example.com` / `User@123`

If this command fails, MongoDB is not connected yet.

## 6. Start Backend

```bash
npm run dev
```

Backend checks:

- Root: `http://localhost:5000/`
- Health: `http://localhost:5000/health`

## 7. Start Frontend

Open a second terminal:

```bash
cd /Users/manishkumarkaushik/Desktop/Project/frontend
npm install
npm run dev
```

Frontend runs at:

```text
http://localhost:5173
```

## 8. Verify Everything

Open a third terminal and run:

```bash
curl http://localhost:5000/
curl http://localhost:5000/health
```

Then run:

```bash
cd /Users/manishkumarkaushik/Desktop/Project/backend
npm run smoke
```

Expected:

- Root returns success JSON
- Health returns success JSON
- Smoke test shows `ROOT`, `HEALTH`, `LOGIN`, and `PROFILE`

## 9. Postman Testing

Import these files into Postman:

- `backend/postman/ecommerce-backend.postman_collection.json`
- `backend/postman/ecommerce-local.postman_environment.json`

Suggested order:

1. `Health -> Root`
2. `Health -> Health Check`
3. `Auth -> Login Admin`
4. `Products -> Create Product`
5. `Auth -> Login User`
6. `Cart And Orders -> Add To Cart`
7. `Cart And Orders -> Create Order`
8. `Admin -> Get Analytics`

## 10. Common Problems

MongoDB not connected:

- `npm run seed` fails
- `/health` shows `"database":"disconnected"`

Fix:

- start local MongoDB, or
- replace `MONGO_URI` with a working Atlas URI

Backend not starting:

```bash
cd /Users/manishkumarkaushik/Desktop/Project/backend
npm run dev
```

Frontend not loading:

```bash
cd /Users/manishkumarkaushik/Desktop/Project/frontend
npm run dev
```

Port already in use:

```bash
lsof -i :5000
lsof -i :5173
```

Then kill the matching PID:

```bash
kill PID
```

## 11. Current Project Reality

This repo is already built.

You do not need to:

- create a new folder structure
- create `src/server.js` for backend
- create `public/index.html` for frontend
- use `/api/v1`
- copy starter files from Downloads

Use the code that already exists in this project.

## 12. Clerk Auth Setup

If auth is not working as expected, complete Clerk setup using:

- [CLERK_AUTH_SETUP.md](CLERK_AUTH_SETUP.md)

That checklist covers publishable key, secret key, allowed URLs, and provider setup.
