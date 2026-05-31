# ⚔️ The Officer's Ascent
### Turning Potential Into Leadership
**SSB Preparation & Performance Tracking Platform**

---

## 📁 Folder Structure

```
officers-ascent/
├── index.html                  ← Entry point (start here)
├── firestore.rules             ← Firebase security rules
├── css/
│   ├── style.css              ← Main styles
│   └── login.css              ← Login page styles
├── js/
│   ├── firebase-config.js     ← Firebase connection
│   ├── app.js                 ← Shared utilities & layout
│   └── seed.js                ← Database initialization
└── pages/
    ├── login.html             ← Login page
    ├── dashboard.html         ← Member homepage
    ├── members.html           ← All members grid
    ├── profile.html           ← Individual profile
    ├── attendance.html        ← Attendance system
    ├── evaluations.html       ← Peer evaluation center
    ├── quiz.html              ← Quiz center
    ├── leaderboard.html       ← Rankings
    ├── study.html             ← Study materials
    └── admin/
        ├── admin-dashboard.html
        ├── manage-members.html
        ├── manage-tasks.html
        ├── manage-quizzes.html
        ├── manage-study.html
        ├── analytics.html
        └── settings.html
```

---

## 🚀 LOCAL TESTING (VS Code)

1. Open the `officers-ascent` folder in VS Code
2. Install "Live Server" extension (by Ritwick Dey)
3. Right-click `index.html` → **Open with Live Server**
4. Opens at `http://localhost:5500`

---

## 🔐 DEFAULT LOGIN CREDENTIALS

### Admin Login
- **Username:** `Harshit Singh`
- **Password:** `admin@123`

### Member Logins (placeholder names)
| Name | PIN |
|------|-----|
| Candidate 1 | 1001 |
| Candidate 2 | 1002 |
| Candidate 3 | 1003 |
| ... | ... |
| Candidate 10 | 1010 |

> Change member names via Admin → Manage Members

---

## 🌐 DEPLOYMENT TO NETLIFY (Free)

### Method 1: Drag & Drop (Easiest)
1. Go to **netlify.com** → Sign up free
2. Click **"Add new site"** → **"Deploy manually"**
3. Drag the entire `officers-ascent` folder onto the page
4. Done! You get a free `*.netlify.app` link

### Method 2: GitHub (Recommended — auto-updates)
1. Create a GitHub account at github.com
2. Create a new repository called `officers-ascent`
3. Upload all files to the repository
4. Go to netlify.com → **"Add new site"** → **"Import from Git"**
5. Connect GitHub → Select your repo → Deploy
6. Now every time you update GitHub, Netlify auto-updates!

---

## ✏️ HOW TO MAKE CHANGES LATER

### Change member names:
- Login as admin → Manage Members → Edit any slot

### Add/edit tasks:
- Admin → Manage Tasks → Create Task

### Add study materials:
- Admin → Study Materials → Add Material

### Change admin password:
- Admin → Settings → Admin Credentials

### Add new members (up to 15 total):
- Admin → Manage Members → Edit an inactive slot → Set name, PIN, Active

### Add evaluation traits:
- Admin → Settings → Evaluation Traits → + Add

### Change hero images:
- Admin → Settings → Hero Slideshow Images → paste new URLs

### Update announcement:
- Admin → Dashboard → Announcement Banner

---

## 🛠️ FIXING ERRORS

If something doesn't work:
1. Press F12 in browser → Console tab
2. Copy the red error message
3. Send it to Claude with "Fix this error: [paste error]"
4. Get updated file → replace old file → re-deploy

---

## 🔥 FIREBASE INFO

- **Project:** the-officers-ascent
- **Database:** Firestore (asia-south2 / Delhi)
- **Storage:** Firebase Storage (for profile pictures)
- **Data auto-seeds** on first load (members, traits, settings)

---

## 📱 FEATURES SUMMARY

✅ Member login (name dropdown + PIN)  
✅ Admin login (username + password)  
✅ 15 member slots (10 active + 5 blank)  
✅ Profile pictures (upload or URL)  
✅ Personal taglines (editable by member)  
✅ Private journal (member-only)  
✅ Daily attendance marking  
✅ Peer evaluation with dynamic traits  
✅ Quiz center with timer  
✅ Leaderboard (overall + category rankings)  
✅ Achievement badges (auto-awarded)  
✅ Study materials with Drive links  
✅ Google Meet links per task  
✅ Admin full control panel  
✅ Analytics dashboard  
✅ Futuristic military theme  
✅ Animated hero slideshow  
✅ Fighter jet animations  
✅ Responsive (mobile + desktop)  
