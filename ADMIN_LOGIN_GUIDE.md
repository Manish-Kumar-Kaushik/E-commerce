# Admin Login Credentials Guide

## ✅ Default Admin Credentials

**Email:** `admin@example.com`  
**Password:** `admin123`

These credentials are automatically pre-filled in the admin login form.

---

## How to Login as Admin

1. **Navigate to Admin Login**
   - Go to: `http://localhost:5173/admin/login` (frontend)
   - Or click the admin login link from home page

2. **View Pre-filled Credentials**
   - Email field shows: `admin@example.com`
   - Password field shows: `admin123`
   - These are automatically filled for convenience

3. **Click "Admin Sign In"**
   - You will be logged in and redirected to `/admin` dashboard
   - Admin dashboard will load with all tabs (Overview, Vendors, Collections, Orders, Users, Settings)

---

## If You Get "Invalid Admin Credentials" Error

**Possible reasons:**

1. **Backend hasn't created the admin account yet**
   - Solution: Restart backend server
   - Backend automatically creates admin on startup
   - Check backend logs for: "Default admin created" or "Default admin already exists"

2. **Database connection issue**
   - Solution: Verify MongoDB is running
   - Check `backend/.env` has correct `MONGO_URI`

3. **Modified credentials**
   - Solution: Use exactly these credentials:
     - Email: `admin@example.com` (case-sensitive)
     - Password: `admin123`

---

## Backend Verification

The admin account is automatically created by `adminBootstrapService.js` when backend starts.

**To verify admin exists in database:**

```bash
# Open MongoDB shell or compass and check:
db.admins.findOne({ email: "admin@example.com" })

# Should return:
{
  "_id": ObjectId("..."),
  "name": "Admin User",
  "email": "admin@example.com",
  "password": "hashed-password",
  "phone": "",
  "role": "admin",
  "createdAt": ISODate("..."),
  "updatedAt": ISODate("...")
}
```

---

## Admin Login Flow

```
1. Frontend: Navigate to /admin/login
2. Form pre-fills with:
   - admin@example.com
   - admin123
3. Frontend: Submit login request to /api/auth/admin-login
4. Backend: Validate credentials
5. Backend: Return JWT token + admin user data
6. Frontend: Store token in localStorage
7. Frontend: Redirect to /admin dashboard
8. Admin Dashboard: Display with all features
```

---

## Admin Dashboard Features

Once logged in, you can access:

✅ **Dashboard Overview**
- Store health metrics
- Recent orders
- Collection status

✅ **Vendors Tab**
- Approve/reject vendor registrations
- Manage vendor status
- Vendor KYC review

✅ **Collections Tab**
- Create collections
- Upload banners
- Manage themed campaigns

✅ **Orders Tab**
- View all orders
- Update order status
- Track fulfillment

✅ **Users Tab**
- Manage customer accounts
- View customer profiles
- Separate from vendors

✅ **Settings Tab** (NEW)
- Update profile (name, phone, photo)
- Change email address
- Change password

---

## Troubleshooting

### Backend Not Started?
```bash
cd backend
npm install
npm run dev
```

### Frontend Not Running?
```bash
cd frontend
npm install
npm run dev
```

### Still Getting Invalid Credentials?
1. Check backend console for error messages
2. Verify admin account exists: `db.admins.find()`
3. Restart both frontend and backend
4. Clear browser cache and localStorage
5. Try incognito/private window

---

## Notes

- Admin credentials are **hardcoded** in both frontend and backend for security simplicity
- The email and password cannot be changed to anything else
- To use different credentials, you must modify:
  - `backend/src/services/authService.js` (ADMIN_EMAIL_CANONICAL)
  - `frontend/src/pages/AdminLoginPage.jsx` (FIXED_ADMIN_EMAIL, FIXED_ADMIN_PASSWORD)
  - Then restart both servers

---

## Quick Copy-Paste

**Email:** admin@example.com  
**Password:** admin123
