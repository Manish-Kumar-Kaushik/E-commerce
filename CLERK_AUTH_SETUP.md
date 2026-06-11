# Clerk Auth Setup

Use this when Clerk sign-in/sign-up works for email/password but you still need the app wired end-to-end.

## 1) Configure frontend env

In [frontend/.env](frontend/.env):

- `VITE_CLERK_PUBLISHABLE_KEY=<your_clerk_publishable_key>`

Then restart the frontend.

## 2) Configure backend env

In [backend/.env](backend/.env):

- `CLERK_SECRET_KEY=<your_clerk_secret_key>`

This repo uses the backend JWT returned by `/auth/sync-user`, but Clerk secret is kept for server-side integrations and future verification.

## 3) Allowed URLs in Clerk

Add these URLs in Clerk dashboard:

- `http://localhost:5173`
- `http://localhost:5173/account/login`
- `http://localhost:5173/account/register`
- Your production domain

## 4) Enable auth methods

In Clerk dashboard:

- Enable email/password sign-in
- Enable email/password sign-up
- Enable Google if you want social login
- Enable Apple if you want social login

## 5) Verify the flow

- Login page should show Clerk sign-in UI
- Register page should show Clerk sign-up UI
- Successful auth should sync the Clerk user to the backend and redirect to `/account/profile-setup`
- Existing users should sign in instead of creating duplicate records

## 6) Common problems

- Missing publishable key: the app will show an auth setup screen
- Sign-in succeeds but app is not authenticated: check that `/auth/sync-user` returns a JWT and the bootstrap component writes it to localStorage
- Google/Apple not working: verify provider setup and callback URLs in Clerk dashboard