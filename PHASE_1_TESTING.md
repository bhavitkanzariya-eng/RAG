# Phase 1: Authentication Testing Guide

## ✅ LOCAL TESTING (Before Deploying)

### Step 1: Install & Setup
```bash
npm install
```

### Step 2: Create .env.local
Copy from .env.example and add your actual Clerk keys from https://dashboard.clerk.com

### Step 3: Run Dev Server
```bash
npm run dev
```
Should output: `> Ready in 1.2s`

### Step 4: Test in Browser
1. Open http://localhost:3000
2. Should see "Sign In" and "Sign Up" buttons
3. NOT signed in yet

### Step 5: Test Sign-Up
1. Click "Sign Up"
2. Enter email and password
3. Complete sign-up flow
4. Should redirect to homepage with your user ID visible
5. Should see green "Phase 1 Complete ✅" message

### Step 6: Test Sign-Out & Sign-In
1. Click your avatar (UserButton) in top right
2. Click "Sign out"
3. Should return to homepage without user ID
4. See "Sign In" and "Sign Up" buttons again
5. Click "Sign In"
6. Enter your email/password
7. Should redirect to homepage with user ID
8. All working ✅

### Step 7: Test API Authentication
1. Make sure you're signed in
2. Open browser DevTools (F12)
3. Go to Console tab
4. Run this command:
```javascript
fetch('/api/test')
  .then(r => r.json())
  .then(d => console.log(d))
```
5. Should output:
```json
{
  "success": true,
  "message": "Authentication test passed",
  "userId": "user_xxx..."
}
```

### Step 8: Test Unauthorized API Access
1. Sign out
2. Run the same fetch command in console
3. Should output:
```json
{
  "success": false,
  "error": "Not authenticated"
}
```
With 401 status

---

## 🚀 DEPLOYMENT TO VERCEL

### Step 1: Push to GitHub
```bash
git add .
git commit -m "Phase 1: Clean auth setup with Clerk"
git push origin main
```

### Step 2: Deploy on Vercel
```bash
vercel deploy
```

### Step 3: Set Environment Variables in Vercel Dashboard
- Add `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
- Add `CLERK_SECRET_KEY`
- Both set to your Clerk values

### Step 4: Redeploy for Env Variables to Take Effect
```bash
vercel deploy --prod
```

### Step 5: Test Production
1. Visit your Vercel URL
2. Should see sign-in prompt
3. Complete same tests as local
4. All should work on production

---

## ✅ SUCCESS CHECKLIST

Mark these as you complete them:

### Local Development
- [ ] npm install succeeds
- [ ] npm run dev starts without errors
- [ ] http://localhost:3000 loads (with Sign In/Up buttons)
- [ ] Sign-up creates account
- [ ] After sign-up, redirects to homepage with user ID
- [ ] UserButton shows in top right
- [ ] Sign-out works and returns to initial state
- [ ] Sign-in with email/password works
- [ ] Fetch to /api/test returns 200 with userId when signed in
- [ ] Fetch to /api/test returns 401 when not signed in

### Production (Vercel)
- [ ] Deployment successful
- [ ] Vercel URL loads
- [ ] Sign-up works on Vercel
- [ ] Sign-in works on Vercel
- [ ] User ID displays after authentication
- [ ] API test endpoint works on Vercel
- [ ] All styling appears correct

---

## ⚠️ If Something Doesn't Work

### "Cannot find module '@clerk/nextjs'"
```bash
npm install @clerk/nextjs
```

### "NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY is not set"
- Create .env.local
- Add your Clerk keys
- Restart dev server

### Sign-in page doesn't load / shows error
- Check Clerk dashboard - is your instance created?
- Check .env.local - are keys correct?
- Check browser console - what error is shown?

### API returns 500 error
- Check terminal for error message
- Should mention if auth() fails
- Verify middleware.ts exists

### After fixing anything
- Stop dev server (Ctrl+C)
- Start dev server again (npm run dev)
- Clear browser cache (Ctrl+Shift+Delete)
- Test again

---

## 🎯 What This Proves

When all tests pass, you've confirmed:
1. ✅ Next.js 15 works with TypeScript
2. ✅ Clerk integration is correct
3. ✅ Middleware properly sets up auth context
4. ✅ Sign-in/Sign-up flows work
5. ✅ Client components can access auth (useAuth hook)
6. ✅ Server-side auth works (auth() in API routes)
7. ✅ Unauthorized requests are properly rejected
8. ✅ Styling with Tailwind works
9. ✅ Ready to move to Phase 2

---

## Next: Phase 2

Once all of above is confirmed working, we proceed to:
- Database setup with Neon PostgreSQL
- Basic CRUD operations
- Testing database queries

No Phase 2 until Phase 1 is 100% confirmed working.
