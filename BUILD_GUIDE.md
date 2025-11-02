# AI Voice to Quote Automation - Complete Build Guide

**Project:** A2Z Hydraulics Voice-to-Quote System  
**Status:** Production operational  
**Purpose:** Reference for building similar AI automation systems

---

## 🏗️ WORKING TECH STACK

### What Works ✅

**Voice:** Bland.ai ($0.09/min)
- Simple webhook integration
- Reliable transcription
- Easy to configure

**Database:** Supabase PostgreSQL
- Free tier sufficient
- Edge Functions (Deno) - NO timeouts
- Auto-generated APIs

**AI:** Anthropic Claude Sonnet 4.5
- $0.045 per quote
- 85-98% confidence
- JSON output reliable

**Email:** SendGrid (via Twilio Console)
- 100 emails/day free
- Single sender verification (5 min setup)
- No domain setup needed

**Frontend:** Next.js 16 + Vercel
- TypeScript + Tailwind
- Free deployment
- 24/7 uptime

**Version Control:** GitHub
- All code backed up
- Push after every feature

---

## ❌ WHAT FAILED & WHY

**Vapi.ai** → Function calling unreliable → Use Bland.ai  
**Vercel webhooks** → 10s timeout → Use Supabase Edge Functions  
**Resend** → Domain verification needed → Use SendGrid  
**Specific regex** → Breaks on variations → Use flexible patterns  
**HTTP fetch** → 401 errors → Use supabase.functions.invoke()  
**AI returning UUIDs** → Returns strings → Set pricing_catalog_id to null  
**cat >> heredoc** → File corruption → Use VS Code or complete file creation  

---

## ✅ SOLUTIONS THAT WORK

### Bland.ai Configuration
```
System Prompt: Plain English questions
Webhook: POST with full transcript
Events: Call + Webhook (both enabled)
```

### Flexible Regex
```javascript
// ✅ GOOD - Flexible
const match = transcript.match(/keyword.*?\n\s*user:\s*([^\n]+)/i)

// ❌ BAD - Too specific
const match = transcript.match(/Thanks (\w+)/)
```

### Supabase Function Calls
```javascript
// ✅ CORRECT
const { data, error } = await supabase.functions.invoke('function-name', {
  body: { param: value }
})

// ❌ WRONG
await fetch(`${url}/functions/v1/function-name`, {...})
```

### JWT Disabled
```
After EVERY Edge Function deployment:
1. Supabase Dashboard → Edge Functions
2. Click function name
3. Turn OFF "Verify JWT"
4. CRITICAL - Always do this!
```

---

## 🔄 GITHUB WORKFLOW
```bash
# Daily: Start work
cd ~/project
git pull origin main

# After each feature
git add -A
git commit -m "Descriptive message"
git push origin main

# ALWAYS push before closing
```

---

## 🛠️ FILE EDITING SHORTCUTS

### ❌ AVOID
```bash
nano file.txt          # Hard to use
cat >> file << 'EOF'   # Error prone for long files
vi file.txt            # Steep learning curve
```

### ✅ USE INSTEAD

**Method 1: VS Code (BEST)**
```bash
code filename.tsx
# Then: Cmd+A, Delete, Paste, Cmd+S
```

**Method 2: Complete File Creation**
```bash
cat > filename.tsx << 'ENDFILE'
[paste entire file here]
ENDFILE
```

**Method 3: For Small Changes**
```bash
# Backup first
cp file.tsx file.tsx.backup

# Then edit in VS Code
code file.tsx
```

---

## 🚀 DEPLOYMENT PROCESS

### Edge Functions
```bash
supabase functions deploy function-name

# THEN IMMEDIATELY:
# Supabase Dashboard → Turn OFF JWT
```

### Vercel (Frontend)
```bash
cd dashboard

# First time
npm install -g vercel
vercel login

# Deploy
vercel --prod

# Add env vars (first time)
vercel env add NEXT_PUBLIC_SUPABASE_URL
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
```

---

## 🐛 COMMON ERRORS & FIXES

### 401 Error
**Cause:** JWT enabled  
**Fix:** Disable JWT in Supabase Dashboard

### Invalid UUID
**Cause:** AI returns string, not UUID  
**Fix:** Set `pricing_catalog_id: null`

### Items Not Showing
**Cause:** Old quote before fix, or RLS enabled  
**Fix:** Make new test call, or disable RLS

### Timeout Error
**Cause:** Using Vercel for long operations  
**Fix:** Use Supabase Edge Functions

### Module Not Found
**Cause:** Component doesn't exist  
**Fix:** Create component file first

---

## 📋 CRITICAL DO'S AND DON'TS

### ✅ ALWAYS DO
1. Push to GitHub after every feature
2. Disable JWT after Edge Function deployment
3. Test locally before deploying
4. Use flexible regex patterns
5. Check logs for errors
6. Backup files before editing
7. Hard refresh browser (Cmd+Shift+R)
8. Use TypeScript for type safety

### ❌ NEVER DO
1. Leave JWT enabled on webhooks
2. Work without Git backups
3. Commit API keys to Git
4. Use Vapi for function calling
5. Use Vercel for long webhooks
6. Skip testing after deployment
7. Trust UI settings (verify in code)
8. Use overly specific regex

---

## 🎯 PROJECT STRUCTURE
```
project/
├── supabase/
│   └── functions/
│       ├── webhook/index.ts
│       └── process/index.ts
├── dashboard/
│   ├── app/
│   ├── components/
│   ├── lib/
│   ├── .env.local (NOT in Git)
│   └── package.json
├── BUILD_GUIDE.md
└── README.md
```

---

## 📝 QUICK COMMANDS
```bash
# Local Dev
cd ~/project/dashboard
npm run dev

# Git
git pull origin main
git add -A
git commit -m "message"
git push origin main

# Deploy
supabase functions deploy name
vercel --prod

# Files
code filename.tsx
ls -la directory/
cat file.txt | head -20
```

---

## 🎓 KEY LEARNINGS

1. **Simple > Complex** - Bland.ai beats Vapi, SendGrid beats Resend
2. **Test Integration Points** - JWT blocks webhooks, Vercel times out
3. **Flexible > Rigid** - Flexible regex handles variations
4. **Documentation Saves Time** - Knowledge base prevents re-learning
5. **Git Everything** - Push after every feature, never lose work
6. **Read Logs** - Error messages tell you exactly what's wrong

---

## 💰 ROI

**Cost per job:** $0.275  
**Manual cost:** $47-95  
**Savings:** $46.73-$94.73 per quote  
**ROI:** 17,000%-34,000%  
**Break-even:** 2 quotes

---

## ✅ SUCCESS CHECKLIST

Development:
- [ ] All features work locally
- [ ] No console errors
- [ ] Mobile responsive
- [ ] Pushed to GitHub

Deployment:
- [ ] Edge Functions deployed
- [ ] JWT disabled
- [ ] Frontend on Vercel
- [ ] Env vars set
- [ ] Production test passed

Documentation:
- [ ] Knowledge base complete
- [ ] URLs documented
- [ ] Access shared
- [ ] Team trained

---

## 🚀 FUTURE PROJECT TEMPLATE

**Week 1:** Voice/Data Collection  
**Week 2:** AI Processing  
**Week 3:** Database & Backend  
**Week 4:** Dashboard  
**Week 5:** Polish & Deploy  
**Week 6:** Documentation

---

## 📞 ESSENTIAL URLS

- Supabase: https://supabase.com/dashboard
- Vercel: https://vercel.com/dashboard
- GitHub: https://github.com
- Bland.ai: https://app.bland.ai
- Anthropic: https://console.anthropic.com

---

**This guide contains all learnings from building A2Z Hydraulics. Use it to build similar systems without trial and error!**

Version: 1.0 | Status: Production-tested | ROI: 17,000%+