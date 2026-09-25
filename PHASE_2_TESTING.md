# Phase 2: Database - Testing Guide

## ✅ What Was Built

- ✅ PostgreSQL database schema (chatbots, documents, conversations, messages)
- ✅ Database connection pooling
- ✅ CRUD operations for chatbots
- ✅ API endpoints for database operations
- ✅ Dashboard with database integration
- ✅ Deployed to Vercel

## 🌍 Production URL

**https://rag-ivxpdj5g1-bhavitkanzariya-engs-projects.vercel.app**

## 📋 Phase 2 Testing Checklist

### Test 1: Homepage Loads
1. Visit https://rag-ivxpdj5g1-bhavitkanzariya-engs-projects.vercel.app
2. Should be signed in (showing your user ID)
3. Should see two status boxes:
   - ✅ Phase 1: Authentication Complete
   - 🔄 Phase 2: Database Integration
4. Should see chatbots list section (currently empty)

### Test 2: Create Test Chatbot
1. On the homepage, click **"➕ Create Test Chatbot"** button
2. Wait 2-3 seconds for API response
3. Should see success alert: "✅ Chatbot created successfully!"
4. Chatbot should appear in the list below immediately

### Test 3: Verify Chatbot in List
After creating a chatbot, verify:
- [ ] Chatbot name displays
- [ ] Description shows (if provided)
- [ ] Chatbot ID is visible
- [ ] Created date is shown
- [ ] Status badge shows "ACTIVE"

### Test 4: Refresh Data
1. Click **"🔄 Refresh"** button
2. Should fetch latest chatbots from database
3. Previously created chatbots should still be there

### Test 5: Create Multiple Chatbots
1. Click "Create Test Chatbot" 3-5 times
2. Each click should create a new entry
3. List should show all created chatbots
4. Count should increase (shows "X chatbots")

### Test 6: Persistence Across Page Reload
1. Create a chatbot
2. Note its ID and name
3. Refresh the page (F5 or Cmd+R)
4. After page reloads, the chatbot should still appear
5. This proves data was saved to database

### Test 7: API Direct Testing
1. Open DevTools (F12 → Console)
2. Fetch all chatbots:
```javascript
fetch('/api/chatbots')
  .then(r => r.json())
  .then(d => console.log(d))
```
3. Should return JSON with:
```json
{
  "success": true,
  "data": [{...chatbots...}],
  "count": N
}
```

### Test 8: Create Chatbot via API
```javascript
fetch('/api/chatbots', {
  method: 'POST',
  headers: {'Content-Type': 'application/json'},
  body: JSON.stringify({name: 'API Test Bot', description: 'Created via API'})
})
  .then(r => r.json())
  .then(d => console.log(d))
```
Should return:
```json
{
  "success": true,
  "data": {id: N, name: "API Test Bot", ...},
  "message": "Chatbot created successfully"
}
```

### Test 9: Fetch Single Chatbot
Replace `{id}` with an actual chatbot ID:
```javascript
fetch('/api/chatbots/{id}')
  .then(r => r.json())
  .then(d => console.log(d))
```
Should return single chatbot details

### Test 10: Update Chatbot
Replace `{id}` with actual ID:
```javascript
fetch('/api/chatbots/{id}', {
  method: 'PUT',
  headers: {'Content-Type': 'application/json'},
  body: JSON.stringify({name: 'Updated Name'})
})
  .then(r => r.json())
  .then(d => console.log(d))
```
Should return updated chatbot

---

## ✅ Phase 2 Success Criteria

Mark each as you test:

**UI/UX:**
- [ ] Homepage loads with Phase 2 status box
- [ ] "Create Test Chatbot" button is clickable
- [ ] "Refresh" button is clickable
- [ ] Chatbots list displays created items
- [ ] No JavaScript errors in console

**Database Operations:**
- [ ] Can create chatbot via UI button
- [ ] Chatbot appears immediately in list
- [ ] Chatbot persists after page reload
- [ ] Count updates correctly
- [ ] Can create multiple chatbots

**API Endpoints:**
- [ ] GET /api/chatbots returns all user's chatbots
- [ ] POST /api/chatbots creates new chatbot
- [ ] GET /api/chatbots/{id} returns single chatbot
- [ ] PUT /api/chatbots/{id} updates chatbot
- [ ] DELETE /api/chatbots/{id} deletes chatbot

**Error Handling:**
- [ ] No auth errors (should be signed in)
- [ ] No database connection errors
- [ ] Proper error messages for invalid operations

---

## 🔧 Troubleshooting

### "Failed to fetch chatbots"
- Check you're signed in
- Check browser console for network errors
- Check Vercel logs: `vercel logs`

### Button clicks don't work
- Check browser console (F12)
- Verify JavaScript is enabled
- Try refreshing the page

### API returns 401
- You're not signed in
- Sign in first, then test

### Database connection error
- DATABASE_URL might not be set in Vercel
- Check Vercel dashboard → Settings → Environment Variables

---

## 📊 What This Proves

When all tests pass:
- ✅ PostgreSQL database is working
- ✅ Connection pooling works
- ✅ CRUD operations work
- ✅ Data persists correctly
- ✅ API endpoints are functional
- ✅ Authentication integration works
- ✅ Error handling works
- ✅ **READY FOR PHASE 3**

---

## 🎯 Phase 2 PASSED When

- [ ] Can create chatbot via UI
- [ ] Chatbot persists after page reload
- [ ] Can create multiple chatbots
- [ ] All API endpoints work correctly
- [ ] No console errors
- [ ] No database errors in Vercel logs

---

## Next: Phase 3

Once Phase 2 is confirmed working:
- Document upload functionality
- File processing
- Document chunk storage
- Embedding generation

**NO Phase 3 until Phase 2 is 100% confirmed working.**
