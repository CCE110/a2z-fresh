# A2Z Hydraulics - COMPLETE System Knowledge Base

**Last Updated:** November 2, 2025  
**Status:** ✅ PRODUCTION - FULLY OPERATIONAL  
**GitHub:** https://github.com/CCE110/a2z-fresh  
**Production Dashboard:** https://a2z-dashboard-nw7bp9g7j-cce110s-projects.vercel.app

---

## 📚 TABLE OF CONTENTS

1. [System Overview](#system-overview)
2. [Complete Tech Stack](#complete-tech-stack)
3. [System Flow](#system-flow)
4. [Working Features](#working-features)
5. [What Failed & Why](#what-failed--why)
6. [Solutions Found](#solutions-found)
7. [Database Structure](#database-structure)
8. [Code Repository](#code-repository)
9. [Critical Do's and Don'ts](#critical-dos-and-donts)
10. [GitHub Workflow](#github-workflow)
11. [File Editing Methods](#file-editing-methods)
12. [Deployment Process](#deployment-process)
13. [Common Errors & Fixes](#common-errors--fixes)
14. [Testing Procedures](#testing-procedures)
15. [Troubleshooting Guide](#troubleshooting-guide)
16. [Performance Metrics](#performance-metrics)
17. [Cost Analysis](#cost-analysis)
18. [Configuration Details](#configuration-details)
19. [Environment Setup](#environment-setup)
20. [Key URLs & Contacts](#key-urls--contacts)

---

## 🎯 SYSTEM OVERVIEW

### What This System Does

Complete automated quote generation from voice call to professional dashboard:

1. Worker calls phone number
2. AI records job details
3. AI generates quote with line items
4. Email sent to supervisor
5. Quote appears in dashboard
6. Supervisor reviews/edits/approves
7. PDF generated and sent to client

### Current Status

**✅ 100% Operational in Production**

- Voice recording: Working perfectly
- AI quote generation: 85-98% confidence
- Dashboard: Live at production URL
- All features: Fully functional
- Team: Using daily

### Key Achievements

- Built in 4 weeks (October-November 2025)
- $0.275 cost per quote vs $47-95 manual
- 17,000%+ ROI
- 85-98% AI accuracy
- <60 seconds end-to-end time
- Professional UI with branding
- Deployed to production on Vercel

---

## 🏗️ COMPLETE TECH STACK

### Voice Recording Layer ✅

**Service:** Bland.ai  
**Why chosen:** Simple, reliable, cheap  
**Cost:** $0.09/minute  
**Performance:** 95% call completion rate  

**Configuration:**
- Voice: Australian male (Riley)
- Model: Enhanced
- Max duration: 30 minutes
- Webhook: Supabase Edge Function URL
- Events: Call + Webhook (BOTH enabled)

**Phone Numbers:**
- Test: +61 468 031 930 → rob@kvell.net
- Production: +61 7 5651 2608 → admin@a2zh.com.au

**System Prompt:**
```
You are a job recording assistant for A2Z Hydraulics.
Ask these questions in order:
1. What's your name?
2. What's the job address?
3. Is this business or residential?
4. Who's the client?
5. What work needs doing?
6. Anything else we should know?
```

**What We Tried First:**
- ❌ Vapi.ai - Function calling unreliable
- ✅ Bland.ai - Simple webhook, works perfectly

---

### Database Layer ✅

**Service:** Supabase (PostgreSQL)  
**Why chosen:** PostgreSQL power + serverless convenience  
**Cost:** Free tier (sufficient for this project)  

**Project Details:**
- Project: a2z-hydraulics
- Region: Sydney
- Project ID: grptqxahlpqevdrnodqs
- URL: https://grptqxahlpqevdrnodqs.supabase.co

**Database Schema:**

**7 Core Tables:**

1. **job_calls** - Voice recording data
   - Stores call transcripts, extracted details
   - Links to quotes table
   - Tracks call metadata (duration, cost)

2. **pricing_catalog** - Master price list
   - 89 active items
   - 8 categories (storm_water, sewer, water_supply, fire, rough_in, gas, site, labor)
   - Base prices, units, descriptions
   - Usage tracking for AI learning

3. **quotes** - Main quote records
   - Quote number: A2Z-YYMM-#### format
   - Client and project details
   - Financial totals (subtotal, GST, total)
   - Status workflow (draft, pending_review, approved, sent)
   - AI metadata (confidence, generation time)

4. **quote_items** - Individual line items
   - Links to quotes and pricing_catalog
   - Organized by section
   - Quantity, unit, prices, totals
   - AI confidence per item
   - Modification tracking

5. **quote_sections** - Pre-calculated section totals
   - Auto-updated via triggers
   - Speeds up display

6. **ai_learning_feedback** - Tracks modifications
   - Records what AI suggested vs final
   - Used for continuous improvement
   - Not yet implemented in UI

7. **quote_audit_log** - Complete audit trail
   - Every change tracked
   - Who, what, when for compliance

**Database Functions:**
- generate_quote_number() - Creates A2Z-YYMM-#### format
- calculate_quote_totals() - Auto-calculates totals
- update_quote_sections() - Updates section summaries

**Triggers:**
- Auto-update updated_at timestamps
- Recalculate totals when items change
- Track catalog usage

**Current Settings:**
- RLS: Disabled (for development)
- Enable for production with multiple users

---

### Backend Layer ✅

**Service:** Supabase Edge Functions  
**Why chosen:** No timeout limits (unlike Vercel)  
**Runtime:** Deno (TypeScript)  
**Cost:** Free tier sufficient  

**Functions:**

**1. bland-webhook**
- Receives call data from Bland.ai
- Extracts job details with flexible regex
- Saves to job_calls table
- Triggers generate-quote function
- Sends email notification
- Status: ✅ Working

**2. generate-quote**
- Receives job_call_id
- Loads job details and pricing catalog
- Builds comprehensive AI prompt
- Calls Claude API
- Parses JSON response
- Saves quote and items to database
- Returns success with quote details
- Status: ✅ Working (UUID bug fixed)

**Critical Configuration:**
- ⚠️ JWT MUST be DISABLED on both functions
- Check after EVERY deployment
- Supabase Dashboard → Edge Functions → Turn OFF "Verify JWT"

**What We Tried First:**
- ❌ Vercel Edge Functions - 10s timeout too short
- ✅ Supabase Edge Functions - No timeout issues

---

### AI Layer ✅

**Service:** Anthropic Claude  
**Model:** claude-sonnet-4-5-20250929  
**Why chosen:** Best at structured extraction + reasoning  
**Cost:** ~$0.045 per quote (4.5 cents)  

**Performance:**
- Confidence: 85-98% average
- Generation time: 3-20 seconds
- Token usage: ~5,000 input + 2,000 output
- Accuracy: High (monitored via user edits)

**Prompt Engineering:**
```
Context provided:
- Job description from call
- Complete pricing catalog (89 items)
- Similar past quotes for reference
- Company standards and practices

Request format:
- JSON output with specific structure
- Confidence score for each item (0-1)
- Reasoning for each selection
- Client notes and exclusions
- Professional language
```

**JSON Structure:**
```json
{
  "items": [
    {
      "item_name": "...",
      "description": "...",
      "quantity": 1.5,
      "unit": "ea",
      "unit_price": 150.00,
      "section": "water_supply",
      "confidence": 0.95,
      "reasoning": "..."
    }
  ],
  "client_notes": "...",
  "exclusions": ["...", "..."]
}
```

**Key Fix:**
- Originally tried to have AI return pricing_catalog_id
- AI returned item codes like "LABOR-PLUMBER" 
- Database expects UUID, caused errors
- **Solution:** Set pricing_catalog_id to null always

---

### Email Layer ✅

**Service:** SendGrid  
**Why chosen:** Simple setup, no domain needed  
**Cost:** Free tier (100 emails/day)  
**Access:** Via Twilio Console ONLY  

**Setup Process:**
1. Login to Twilio Console
2. Navigate to SendGrid Email API
3. Settings → API Keys
4. Create key with "Mail Send" permission
5. Store in Supabase secrets

**Email Routing:**
- Test number (+61 468 031 930) → rob@kvell.net
- Production (+61 7 5651 2608) → admin@a2zh.com.au

**Email Content:**
- Job details (worker, address, client, work)
- Quote summary (number, total, confidence)
- Link to dashboard (when available)
- Full call transcript

**What We Tried First:**
- ❌ Resend - Required domain verification
- ✅ SendGrid - Single sender, 5 minute setup

---

### Frontend Dashboard ✅

**Framework:** Next.js 16 (App Router)  
**Language:** TypeScript  
**Styling:** Tailwind CSS  
**Deployment:** Vercel  
**Cost:** Free tier  

**Production URL:**
https://a2z-dashboard-nw7bp9g7j-cce110s-projects.vercel.app

**Local Development:**
http://localhost:3000 (when running npm run dev)

**Key Features:**
- Server and Client components
- Image optimization (Next.js Image)
- File-based routing
- TypeScript for type safety
- Tailwind for styling
- No API routes (using Supabase direct)

**Pages Built:**

1. **Quote List (/)** 
   - Shows all quotes
   - Table view with sorting
   - Status badges
   - Confidence indicators
   - Clickable rows

2. **Quote Detail (/quotes/[id])**
   - Professional header with logo
   - Company details
   - Client information
   - Line items by section
   - Section totals
   - Quote totals
   - Edit functionality

**Components Built:**

1. **QuoteEditMode** - Edit quantities and prices
2. **AddItemsModal** - Add items from catalog
3. **StatusWorkflow** - Approve/reject/send buttons
4. **EditClientModal** - Edit client name and address

**Libraries:**

1. **pdfGenerator.ts** - Generate professional PDFs
   - Uses jsPDF library
   - Company header with logo
   - All quote details
   - Grouped by section
   - Professional formatting

---

### Version Control ✅

**Service:** GitHub  
**Repository:** https://github.com/CCE110/a2z-fresh  
**Branch Strategy:** Main branch only (solo developer)  
**Workflow:** Commit often, push immediately  

**Repository Structure:**
```
a2z-fresh/
├── .git/
├── .gitignore
├── supabase/
│   └── functions/
│       ├── bland-webhook/
│       │   └── index.ts
│       └── generate-quote/
│           └── index.ts
├── dashboard/
│   ├── .env.local (NOT in Git)
│   ├── app/
│   │   ├── page.tsx
│   │   ├── quotes/[id]/page.tsx
│   │   ├── layout.tsx
│   │   └── globals.css
│   ├── components/
│   │   ├── QuoteEditMode.tsx
│   │   ├── AddItemsModal.tsx
│   │   ├── StatusWorkflow.tsx
│   │   └── EditClientModal.tsx
│   ├── lib/
│   │   ├── supabase.ts
│   │   └── pdfGenerator.ts
│   ├── public/
│   │   └── a2z-logo.jpg
│   ├── package.json
│   └── next.config.ts
├── BUILD_GUIDE.md
├── KNOWLEDGE_BASE.md
├── COMPLETE_KNOWLEDGE_BASE.md
└── README.md
```

**.gitignore:**
```
.env
.env.local
.env*.local
node_modules/
.next/
.DS_Store
```

---

## 🔄 SYSTEM FLOW

### Complete End-to-End Flow
```
1. WORKER CALLS
   ↓
   Phone: +61 7 5651 2608 (production)
   
2. BLAND.AI ANSWERS
   ↓
   Asks 6 structured questions
   Records full conversation
   Creates transcript
   
3. WEBHOOK TRIGGERED (bland-webhook)
   ↓
   POST to Supabase Edge Function
   Full call data in body
   
4. DATA EXTRACTION
   ↓
   Flexible regex patterns
   Extract: worker, address, type, client, work
   Save to job_calls table
   
5. ROUTE EMAIL
   ↓
   Check phone number
   Test → rob@kvell.net
   Production → admin@a2zh.com.au
   
6. AUTO-GENERATE QUOTE (generate-quote)
   ↓
   Load job details
   Load pricing catalog (89 items)
   Load similar past quotes
   Build AI prompt
   
7. CLAUDE API CALL
   ↓
   Process job description
   Match to catalog items
   Calculate quantities
   Estimate labor
   Return JSON with confidence scores
   
8. SAVE TO DATABASE
   ↓
   Create quote record
   Create quote_items (multiple)
   Update quote_sections
   Calculate totals (triggers)
   
9. EMAIL SENT
   ↓
   SendGrid API
   Job details + Quote summary
   Link to dashboard
   Full transcript
   
10. DASHBOARD UPDATE
    ↓
    Quote appears in list
    Status: Pending Review
    Items shown in detail view
    Ready for supervisor review
```

**Timeline:**
- Call duration: 2-3 minutes
- Processing: 3-20 seconds
- **Total: 30-60 seconds from call end to dashboard**

---

## ✅ WORKING FEATURES

### Phase 1: Voice to Database (100%) ✅

**Implemented:**
- [x] Bland.ai account and configuration
- [x] Phone numbers imported and tested
- [x] Agents configured (test + production)
- [x] Webhooks receiving data
- [x] job_calls table created
- [x] Data extraction with regex
- [x] Email notifications working
- [x] Test and production routing

**Status:** Fully operational, used daily

---

### Phase 2: Database & Pricing (100%) ✅

**Implemented:**
- [x] All 7 tables created
- [x] Triggers and functions working
- [x] RLS policies (disabled for dev)
- [x] 89 items seeded in pricing catalog
- [x] Views for reporting
- [x] Audit logging structure

**Status:** Complete and tested

---

### Phase 3: AI Quote Generation (100%) ✅

**Implemented:**
- [x] Anthropic account and API key
- [x] generate-quote Edge Function
- [x] Prompt engineering complete
- [x] JSON parsing working
- [x] Database saving with items
- [x] Confidence tracking
- [x] UUID bug fixed

**Test Results:**
- Quote A2Z-2510-0007
- Client: Steve Smith
- Address: 42 Kebble St
- Work: Replace 300L heat pump
- Total: $12,125.30 inc GST
- Items: 13 line items
- Confidence: 85% average
- Time: 15 seconds

**Status:** Working perfectly

---

### Phase 4: Dashboard - Quote List (100%) ✅

**Implemented:**
- [x] Next.js 16 project setup
- [x] Supabase client configuration
- [x] Quote list page (app/page.tsx)
- [x] Table display with all columns
- [x] Status badges (color-coded)
- [x] Confidence indicators
- [x] Clickable rows to detail
- [x] Professional styling

**Status:** Live in production

---

### Phase 5: Dashboard - Quote Detail (100%) ✅

**Implemented:**
- [x] Quote detail page (app/quotes/[id]/page.tsx)
- [x] Professional header with A2Z logo
- [x] Company information display
- [x] Quote number and date
- [x] Status and confidence display
- [x] Client information section
- [x] **Edit client name/address** (NEW)
- [x] Line items grouped by section
- [x] Section totals calculated
- [x] Quote totals (subtotal, GST, total)
- [x] Back button to list

**Status:** Fully functional

---

### Phase 6: Dashboard - Quote Editing (100%) ✅

**Implemented:**
- [x] Edit mode toggle
- [x] QuoteEditMode component
- [x] Edit quantities
- [x] Edit prices
- [x] Add items (AddItemsModal)
- [x] Remove items
- [x] Recalculate totals
- [x] Save changes to database
- [x] Track modifications

**Status:** Working perfectly

---

### Phase 7: PDF Generation (100%) ✅

**Implemented:**
- [x] pdfGenerator.ts library
- [x] Company header with logo
- [x] All quote details
- [x] Grouped by section
- [x] Professional formatting
- [x] Download functionality
- [x] Generate PDF button

**Status:** Working

---

### Phase 8: Status Workflow (100%) ✅

**Implemented:**
- [x] StatusWorkflow component
- [x] Approve button
- [x] Reject button
- [x] Send to Client button
- [x] Status updates in database
- [x] Timestamp tracking
- [x] Email to client (when status = sent)

**Status:** Operational

---

### Phase 9: Production Deployment (100%) ✅

**Implemented:**
- [x] Vercel account setup
- [x] Vercel CLI installed
- [x] Environment variables added
- [x] Production deployment
- [x] Custom domain (optional)
- [x] 24/7 uptime
- [x] Global CDN

**Production URL:**
https://a2z-dashboard-nw7bp9g7j-cce110s-projects.vercel.app

**Status:** Live and accessible

---

## ❌ WHAT FAILED & WHY

### Failure #1: Vapi.ai Function Calling

**What we tried:**
- Set up Vapi.ai account
- Configured assistant with tools
- Created functions for data extraction
- Set up webhooks

**Why it failed:**
- Function calling extremely unreliable
- Tools UI confusing and buggy
- Functions didn't always trigger
- Inconsistent responses
- Poor error messages
- Cost: $0.13/min (higher than Bland)
- Debugging was painful

**Time wasted:** 2 days

**Lesson:** Simple webhook > Complex function calling

**Solution:** Switched to Bland.ai with simple transcript webhook

---

### Failure #2: Vercel for Webhooks

**What we tried:**
- Created Vercel account
- Deployed Edge Functions
- Set up webhook endpoints
- Configured environment variables

**Why it failed:**
- **10-second timeout limit** (hard limit)
- AI quote generation takes 10-20 seconds
- Regional timeout variations confusing
- Authentication blocks external webhooks by default
- Deployment protection settings complex
- Project corruption issues

**Time wasted:** 1 day

**Lesson:** Check timeout limits BEFORE choosing platform

**Solution:** Moved to Supabase Edge Functions (no timeout)

---

### Failure #3: Resend for Email

**What we tried:**
- Created Resend account
- Attempted domain verification

**Why it didn't work:**
- Required DNS configuration
- Needed domain access
- Time-consuming setup
- Blocked on domain verification

**Time wasted:** 2 hours

**Lesson:** For MVP, use simplest solution

**Solution:** SendGrid with single sender verification (5 minutes)

---

### Failure #4: Overly Specific Regex

**What we tried:**
```javascript
// Too specific
const workerMatch = transcript.match(/Thanks (\w+)/)
```

**Why it failed:**
- Agent responses vary ("Righto", "No worries", "Cheers", etc.)
- Natural language has infinite variations
- Pattern breaks constantly
- Hard to maintain

**Time wasted:** 3 hours debugging

**Lesson:** Natural language requires flexible patterns

**Solution:**
```javascript
// Flexible
const workerMatch = transcript.match(/name.*?\n\s*user:\s*([^\n.]+)/i)
```

---

### Failure #5: HTTP Fetch for Edge Functions

**What we tried:**
```javascript
await fetch(`${supabaseUrl}/functions/v1/generate-quote`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${serviceRoleKey}`,
    'Content-Type': 'application/json',
    'apikey': serviceRoleKey
  },
  body: JSON.stringify({ job_call_id: id })
})
```

**Why it failed:**
- Returns 401 Unauthorized
- JWT verification issues
- Edge Functions need specific auth
- Adding apikey header didn't help

**Time wasted:** 4 hours

**Lesson:** Use platform's official methods

**Solution:**
```javascript
const { data, error } = await supabase.functions.invoke('generate-quote', {
  body: { job_call_id: id }
})
```

---

### Failure #6: AI Returning UUIDs

**What we tried:**
- Asked AI to return pricing_catalog_id from catalog
- Expected valid UUIDs

**Why it failed:**
- AI returns item codes like "LABOR-PLUMBER"
- Database column type is UUID
- Error: `invalid input syntax for type uuid: "LABOR-PLUMBER"`
- Can't force AI to return perfect UUIDs

**Time wasted:** 2 days (this was a blocker)

**Lesson:** Don't expect AI to return perfect database IDs

**Solution:**
```javascript
// In generate-quote function
pricing_catalog_id: null  // Always null
```

---

### Failure #7: Complex File Editing with cat >>

**What we tried:**
```bash
cat >> file.tsx << 'EOF'
[hundreds of lines of code]
EOF
```

**Why it failed:**
- Easy to forget closing EOF
- File corruption if interrupted
- No syntax checking
- Hard to debug
- Terminal gets stuck in quote mode

**Time wasted:** Many frustrating minutes

**Lesson:** Use proper editor for files >50 lines

**Solution:** VS Code with copy/paste or complete file creation

---

## ✅ SOLUTIONS FOUND

### Solution #1: Bland.ai Simple Webhook

**Implementation:**
```
1. Create Bland.ai account
2. Import phone number from Twilio
3. Create agent with system prompt
4. Set webhook URL to Supabase Edge Function
5. Enable "Call" and "Webhook" events
6. Done!
```

**System Prompt:**
```
You are a job recording assistant for A2Z Hydraulics.
Ask these questions in order:
1. What's your name?
2. What's the job address?
3. Is this business or residential?
4. Who's the client?
5. What work needs doing?
6. Anything else we should know?

Be friendly and conversational. Confirm details at the end.
```

**Webhook Payload:**
```json
{
  "call_id": "...",
  "to": "+61 7 5651 2608",
  "from": "+61 4XX XXX XXX",
  "transcript": "Full conversation text...",
  "call_length": 150,
  "recording_url": "..."
}
```

**Why it works:**
- Simple HTTP POST
- Full transcript in plain text
- Reliable event triggers
- Easy to parse with regex
- No function calling complexity

---

### Solution #2: Flexible Regex Patterns

**Pattern Template:**
```javascript
const pattern = /keyword.*?\n\s*user:\s*([^\n]+)/i

// Breakdown:
// keyword.*?  - Match keyword + anything (non-greedy)
// \n\s*       - Newline + optional whitespace
// user:\s*    - Literal "user:" + optional space
// ([^\n]+)    - Capture everything except newline
// /i          - Case insensitive
```

**Real Examples:**
```javascript
// Worker name
const workerMatch = transcript.match(/name.*?\n\s*user:\s*([^\n.]+)/i)
const worker = workerMatch ? workerMatch[1].trim() : 'Unknown'

// Job address
const addressMatch = transcript.match(/address.*?\n\s*user:\s*([^\n]+)/i)
const address = addressMatch ? addressMatch[1].trim() : 'Unknown'

// Business type
const typeMatch = transcript.match(/business or residential.*?\n\s*user:\s*([^\n.]+)/i)
const type = typeMatch ? typeMatch[1].trim() : 'Unknown'

// Client name
const clientMatch = transcript.match(/client.*?\n\s*user:\s*([^\n.]+)/i)
const client = clientMatch ? clientMatch[1].trim() : 'Unknown'

// Work description (can span multiple lines)
const workMatch = transcript.match(/work needs doing.*?\n\s*user:\s*([^]+?)(?=\n\s*assistant:|$)/i)
const work = workMatch ? workMatch[1].trim() : 'Unknown'
```

**Why it works:**
- Handles agent response variations
- Case insensitive
- Allows for whitespace differences
- Captures multi-line descriptions
- Gracefully fails to "Unknown"

---

### Solution #3: Supabase Invoke Method

**Implementation:**
```typescript
// In bland-webhook function

// Create Supabase client with service role
const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

// Call generate-quote function
const { data, error } = await supabase.functions.invoke('generate-quote', {
  body: { job_call_id: savedJob.id }
})

if (error) {
  console.error('❌ Quote generation failed:', error)
  // Continue anyway, email still sends
} else {
  console.log('✅ QUOTE GENERATED:', data.quote_number)
}
```

**Why it works:**
- Uses Supabase's built-in method
- Handles authentication automatically
- No JWT issues
- Returns typed response
- Official Supabase pattern

---

### Solution #4: SendGrid via Twilio Console

**Access Process:**
1. Login to https://console.twilio.com
2. Click "SendGrid Email API" in left sidebar
3. Settings → API Keys
4. Create New API Key
5. Name: "A2Z Hydraulics"
6. Permissions: Mail Send (Full Access)
7. Create & View
8. Copy API key (starts with SG.)
9. Store in Supabase secrets

**Implementation:**
```typescript
// In bland-webhook function
const SENDGRID_API_KEY = Deno.env.get('SENDGRID_API_KEY')

const emailBody = {
  personalizations: [{
    to: [{ email: recipientEmail }],
    subject: `A2Z Job - ${worker}`
  }],
  from: { email: 'rob@kvell.net', name: 'A2Z Hydraulics' },
  content: [{
    type: 'text/html',
    value: emailHTML
  }]
}

await fetch('https://api.sendgrid.com/v3/mail/send', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${SENDGRID_API_KEY}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify(emailBody)
})
```

**Why it works:**
- Access through Twilio (existing account)
- No separate SendGrid account needed
- No domain verification required
- 5 minute setup
- Free tier sufficient

---

### Solution #5: JWT Disabled for Webhooks

**Problem:** External services (Bland.ai) can't authenticate with JWT

**Solution:** Disable JWT verification on webhook functions

**Process:**
```
After EVERY Edge Function deployment:
1. Go to Supabase Dashboard
2. Click "Edge Functions" in sidebar
3. Click function name (e.g., "bland-webhook")
4. Find "Verify JWT" toggle
5. Turn it OFF
6. Click away to save
7. Repeat for all webhook functions
```

**Why it works:**
- Allows external services to call functions
- No authentication headers needed
- Webhook URLs can be public
- Still secure (validate payload in function if needed)

**Critical:** Must do this after EVERY deployment (JWT re-enables)

---

### Solution #6: pricing_catalog_id = null

**Problem:** AI returns item codes, database expects UUIDs

**Solution:** Always set pricing_catalog_id to null

**Implementation:**
```typescript
// In generate-quote function
const itemsToInsert = generatedItems.map((item: any, index: number) => ({
  quote_id: quoteId,
  section: item.section || 'labor',
  sort_order: index,
  item_name: item.item_name,
  description: item.description || null,
  quantity: parseFloat(item.quantity),
  unit: item.unit,
  unit_price: parseFloat(item.unit_price),
  total_price: parseFloat(item.quantity) * parseFloat(item.unit_price),
  
  // CRITICAL FIX: Always null
  pricing_catalog_id: null,  // Don't use item codes from AI
  
  ai_suggested: true,
  ai_confidence: item.confidence || null,
  ai_reasoning: item.reasoning || null
}))
```

**Why it works:**
- No UUID type errors
- AI doesn't need to be perfect
- Can manually link items later if needed
- Items still save successfully

---

### Solution #7: VS Code for File Editing

**Method:**
```bash
# Open file in VS Code
code filename.tsx

# In VS Code:
# 1. Select All (Cmd+A)
# 2. Delete
# 3. Paste new content
# 4. Save (Cmd+S)
```

**Why it works:**
- Visual editor
- Syntax highlighting
- Error checking
- Easy to copy/paste
- No terminal issues
- Can see entire file

**Alternative for Complete New Files:**
```bash
cat > filename.tsx << 'ENDFILE'
[paste entire file content]
ENDFILE

# Verify
ls -la filename.tsx
```

---

## 🗄️ DATABASE STRUCTURE

### Complete Schema

**7 Core Tables:**

#### 1. job_calls
```sql
CREATE TABLE job_calls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  call_id TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Extracted job details
  worker_name TEXT,
  job_address TEXT,
  business_type TEXT,
  client_name TEXT,
  work_description TEXT,
  
  -- Call metadata
  call_transcript TEXT,
  call_summary TEXT,
  call_duration NUMERIC,
  call_cost NUMERIC,
  phone_from TEXT,
  phone_to TEXT,
  call_status TEXT,
  recording_url TEXT
);
```

**Purpose:** Store all voice call data and extracted information

---

#### 2. pricing_catalog
```sql
CREATE TABLE pricing_catalog (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Item identification
  item_code TEXT UNIQUE NOT NULL,
  item_name TEXT NOT NULL,
  category TEXT NOT NULL,
  subcategory TEXT,
  
  -- Pricing
  base_price NUMERIC(10,2),
  unit TEXT NOT NULL,
  
  -- Description
  description TEXT,
  detailed_specs TEXT,
  
  -- AI matching
  tags TEXT[],
  search_terms TEXT[],
  
  -- Usage tracking
  usage_count INT DEFAULT 0,
  last_used TIMESTAMPTZ,
  avg_quantity_used NUMERIC(10,2),
  
  -- Metadata
  is_active BOOLEAN DEFAULT true,
  supplier TEXT,
  supplier_code TEXT,
  notes TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Purpose:** Master price list for AI to reference

**Categories:**
- storm_water (15 items)
- sewer (18 items)
- water_supply (22 items)
- fire (8 items)
- rough_in (10 items)
- gas (6 items)
- site (5 items)
- labor (5 items)

**Total:** 89 active items

---

#### 3. quotes
```sql
CREATE TABLE quotes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Quote identification
  quote_number TEXT UNIQUE NOT NULL,
  version INT DEFAULT 1,
  
  -- Links
  job_call_id UUID REFERENCES job_calls(id),
  
  -- Client info
  client_name TEXT NOT NULL,
  client_email TEXT,
  client_phone TEXT,
  client_company TEXT,
  
  -- Project details
  project_name TEXT,
  project_address TEXT NOT NULL,
  project_type TEXT,
  project_description TEXT,
  scope_description TEXT,
  scope_sections TEXT[],
  
  -- Financial
  subtotal_ex_gst NUMERIC(12,2) NOT NULL DEFAULT 0,
  gst_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  total_inc_gst NUMERIC(12,2) NOT NULL DEFAULT 0,
  
  -- Terms
  payment_terms TEXT DEFAULT '15 Day Payment',
  validity_days INT DEFAULT 30,
  valid_until DATE,
  
  -- Status workflow
  status TEXT DEFAULT 'draft',
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  reviewed_at TIMESTAMPTZ,
  reviewed_by TEXT,
  sent_at TIMESTAMPTZ,
  client_viewed_at TIMESTAMPTZ,
  client_responded_at TIMESTAMPTZ,
  
  -- AI metadata
  ai_generated BOOLEAN DEFAULT false,
  ai_confidence_avg NUMERIC(3,2),
  ai_model_used TEXT,
  ai_generation_time_ms INT,
  ai_suggestions_accepted INT DEFAULT 0,
  ai_suggestions_rejected INT DEFAULT 0,
  
  -- Documents
  pdf_url TEXT,
  docx_url TEXT,
  
  -- Notes
  internal_notes TEXT,
  client_notes TEXT,
  exclusions TEXT[],
  assumptions TEXT[],
  
  manual_override BOOLEAN DEFAULT false
);
```

**Purpose:** Main quote records with full metadata

**Status Values:**
- draft
- pending_review
- approved
- sent
- accepted
- rejected
- expired

---

#### 4. quote_items
```sql
CREATE TABLE quote_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Link to quote
  quote_id UUID NOT NULL REFERENCES quotes(id) ON DELETE CASCADE,
  
  -- Organization
  section TEXT NOT NULL,
  sort_order INT,
  
  -- Item details
  item_name TEXT NOT NULL,
  description TEXT,
  detailed_specs TEXT,
  
  -- Pricing
  quantity NUMERIC(10,2) NOT NULL,
  unit TEXT NOT NULL,
  unit_price NUMERIC(10,2) NOT NULL,
  total_price NUMERIC(10,2) NOT NULL,
  
  -- Link to catalog
  pricing_catalog_id UUID REFERENCES pricing_catalog(id),
  
  -- AI metadata
  ai_suggested BOOLEAN DEFAULT false,
  ai_confidence NUMERIC(3,2),
  ai_reasoning TEXT,
  ai_alternative_items JSONB,
  
  -- Modification tracking
  manually_modified BOOLEAN DEFAULT false,
  original_quantity NUMERIC(10,2),
  original_unit_price NUMERIC(10,2),
  modification_reason TEXT,
  
  -- Item metadata
  is_optional BOOLEAN DEFAULT false,
  is_allowance BOOLEAN DEFAULT false,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Purpose:** Individual line items within quotes

---

#### 5. quote_sections
```sql
CREATE TABLE quote_sections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  quote_id UUID NOT NULL REFERENCES quotes(id) ON DELETE CASCADE,
  section_name TEXT NOT NULL,
  section_description TEXT,
  
  item_count INT DEFAULT 0,
  section_total NUMERIC(12,2) DEFAULT 0,
  
  sort_order INT,
  
  UNIQUE(quote_id, section_name)
);
```

**Purpose:** Pre-calculated section totals for display

---

#### 6. ai_learning_feedback
```sql
CREATE TABLE ai_learning_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Links
  quote_id UUID REFERENCES quotes(id),
  quote_item_id UUID REFERENCES quote_items(id),
  
  -- What happened
  feedback_type TEXT NOT NULL,
  
  -- Details
  was_ai_suggestion BOOLEAN,
  ai_suggested_value JSONB,
  final_value JSONB,
  
  -- Context
  modification_reason TEXT,
  similar_past_quotes INT,
  
  -- Learning
  applied_to_catalog BOOLEAN DEFAULT false,
  confidence_adjustment NUMERIC(3,2),
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by TEXT
);
```

**Purpose:** Track modifications for continuous learning

**Feedback Types:**
- price_adjusted
- quantity_adjusted
- item_added
- item_removed
- item_replaced

---

#### 7. quote_audit_log
```sql
CREATE TABLE quote_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  quote_id UUID NOT NULL REFERENCES quotes(id),
  
  -- What changed
  action TEXT NOT NULL,
  field_changed TEXT,
  old_value TEXT,
  new_value TEXT,
  
  -- Who and when
  changed_by TEXT,
  changed_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Context
  ip_address TEXT,
  user_agent TEXT,
  notes TEXT
);
```

**Purpose:** Complete audit trail for compliance

---

### Database Functions

#### generate_quote_number()
```sql
CREATE OR REPLACE FUNCTION generate_quote_number()
RETURNS TEXT AS $$
DECLARE
  year_month TEXT;
  next_num INT;
  quote_num TEXT;
BEGIN
  -- Format: A2Z-YYMM-####
  year_month := TO_CHAR(NOW() AT TIME ZONE 'Australia/Brisbane', 'YYMM');
  
  -- Get next number for this month
  SELECT COALESCE(MAX(
    CAST(SUBSTRING(quote_number FROM 10) AS INT)
  ), 0) + 1
  INTO next_num
  FROM quotes
  WHERE quote_number LIKE 'A2Z-' || year_month || '-%';
  
  -- Format as A2Z-YYMM-####
  quote_num := 'A2Z-' || year_month || '-' || LPAD(next_num::TEXT, 4, '0');
  
  RETURN quote_num;
END;
$$ LANGUAGE plpgsql;
```

**Usage:**
```sql
INSERT INTO quotes (quote_number, ...)
VALUES (generate_quote_number(), ...);
```

---

#### calculate_quote_totals()
```sql
CREATE OR REPLACE FUNCTION calculate_quote_totals(quote_uuid UUID)
RETURNS void AS $$
DECLARE
  subtotal NUMERIC(12,2);
  gst NUMERIC(12,2);
  total NUMERIC(12,2);
BEGIN
  -- Calculate subtotal from items
  SELECT COALESCE(SUM(total_price), 0)
  INTO subtotal
  FROM quote_items
  WHERE quote_id = quote_uuid;
  
  -- Calculate GST (10%)
  gst := subtotal * 0.10;
  
  -- Calculate total
  total := subtotal + gst;
  
  -- Update quote
  UPDATE quotes
  SET 
    subtotal_ex_gst = subtotal,
    gst_amount = gst,
    total_inc_gst = total,
    updated_at = NOW()
  WHERE id = quote_uuid;
END;
$$ LANGUAGE plpgsql;
```

**Usage:**
```sql
-- After inserting/updating/deleting items
SELECT calculate_quote_totals('quote-uuid-here');
```

---

#### update_quote_sections()
```sql
CREATE OR REPLACE FUNCTION update_quote_sections(quote_uuid UUID)
RETURNS void AS $$
BEGIN
  -- Delete existing sections
  DELETE FROM quote_sections WHERE quote_id = quote_uuid;
  
  -- Insert new sections with totals
  INSERT INTO quote_sections (quote_id, section_name, item_count, section_total)
  SELECT
    quote_id,
    section,
    COUNT(*) as item_count,
    SUM(total_price) as section_total
  FROM quote_items
  WHERE quote_id = quote_uuid
  GROUP BY quote_id, section;
END;
$$ LANGUAGE plpgsql;
```

---

### Triggers

#### Auto-update timestamps
```sql
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_quotes_updated_at
  BEFORE UPDATE ON quotes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Repeat for other tables...
```

---

#### Auto-calculate totals
```sql
CREATE OR REPLACE FUNCTION trigger_recalculate_quote()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM calculate_quote_totals(
    COALESCE(NEW.quote_id, OLD.quote_id)
  );
  PERFORM update_quote_sections(
    COALESCE(NEW.quote_id, OLD.quote_id)
  );
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER recalculate_quote_on_item_change
  AFTER INSERT OR UPDATE OR DELETE ON quote_items
  FOR EACH ROW
  EXECUTE FUNCTION trigger_recalculate_quote();
```

---

#### Track catalog usage
```sql
CREATE OR REPLACE FUNCTION track_catalog_usage()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.pricing_catalog_id IS NOT NULL THEN
    UPDATE pricing_catalog
    SET
      usage_count = usage_count + 1,
      last_used = NOW()
    WHERE id = NEW.pricing_catalog_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER track_pricing_catalog_usage
  AFTER INSERT ON quote_items
  FOR EACH ROW
  EXECUTE FUNCTION track_catalog_usage();
```

---

### Views

#### vw_quote_summary
```sql
CREATE VIEW vw_quote_summary AS
SELECT
  q.id,
  q.quote_number,
  q.created_at,
  q.client_name,
  q.project_address,
  q.status,
  q.total_inc_gst,
  q.ai_confidence_avg,
  COUNT(qi.id) as item_count,
  ARRAY_AGG(DISTINCT qi.section) as sections
FROM quotes q
LEFT JOIN quote_items qi ON q.id = qi.quote_id
GROUP BY q.id;
```

---

#### vw_ai_performance
```sql
CREATE VIEW vw_ai_performance AS
SELECT
  DATE_TRUNC('day', created_at) as date,
  COUNT(*) as quotes_generated,
  AVG(ai_confidence_avg) as avg_confidence,
  AVG(ai_generation_time_ms) as avg_generation_time_ms,
  AVG(ai_suggestions_accepted::FLOAT / 
      NULLIF(ai_suggestions_accepted + ai_suggestions_rejected, 0)) 
    as acceptance_rate
FROM quotes
WHERE ai_generated = true
GROUP BY DATE_TRUNC('day', created_at)
ORDER BY date DESC;
```

---

#### vw_popular_catalog_items
```sql
CREATE VIEW vw_popular_catalog_items AS
SELECT
  pc.item_code,
  pc.item_name,
  pc.category,
  pc.base_price,
  pc.usage_count,
  pc.last_used,
  pc.avg_quantity_used,
  COUNT(DISTINCT qi.quote_id) as quotes_used_in
FROM pricing_catalog pc
LEFT JOIN quote_items qi ON pc.id = qi.pricing_catalog_id
WHERE pc.is_active = true
GROUP BY pc.id
ORDER BY pc.usage_count DESC;
```

---

### RLS Policies (Currently Disabled)

**When to enable:**
- Multiple users with different permissions
- External client access
- Security requirements

**Example policies:**
```sql
-- Enable RLS
ALTER TABLE quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE quote_items ENABLE ROW LEVEL SECURITY;

-- Allow users to see their own quotes
CREATE POLICY "Users can view own quotes"
  ON quotes FOR SELECT
  USING (auth.uid() = created_by);

-- Allow supervisors to see all quotes
CREATE POLICY "Supervisors can view all quotes"
  ON quotes FOR SELECT
  USING (auth.jwt() ->> 'role' = 'supervisor');

-- etc...
```

**Current:** RLS disabled for development (single user)

---## 📁 CODE REPOSITORY

### Edge Function: bland-webhook

**Location:** `supabase/functions/bland-webhook/index.ts`  
**Status:** ✅ Deployed and working  
**Purpose:** Receives calls, extracts data, triggers quotes, sends emails

**Complete Code:**
```typescript
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log('🎯 Webhook received!')
    
    const webhook = await req.json()
    console.log('📞 Call data:', {
      call_id: webhook.call_id,
      to: webhook.to,
      from: webhook.from,
      call_length: webhook.call_length
    })

    // Check if we have full transcript
    if (!webhook.transcript || webhook.transcript.trim() === '') {
      console.log('⚠️ No transcript available yet')
      return new Response(JSON.stringify({ 
        success: true, 
        message: 'Webhook received but no transcript' 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    console.log('✅ Full call data received!')

    const transcript = webhook.transcript
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    // Extract data with flexible regex
    const workerMatch = transcript.match(/name.*?\n\s*user:\s*([^\n.]+)/i)
    const addressMatch = transcript.match(/address.*?\n\s*user:\s*([^\n]+)/i)
    const typeMatch = transcript.match(/business or residential.*?\n\s*user:\s*([^\n.]+)/i)
    const clientMatch = transcript.match(/client.*?\n\s*user:\s*([^\n.]+)/i)
    const workMatch = transcript.match(/work needs doing.*?\n\s*user:\s*([^]+?)(?=\n\s*assistant:|$)/i)

    const worker = workerMatch ? workerMatch[1].trim() : 'Unknown'
    const address = addressMatch ? addressMatch[1].trim() : 'Unknown'
    const type = typeMatch ? typeMatch[1].trim() : 'Unknown'
    const client = clientMatch ? clientMatch[1].trim() : 'Unknown'
    const work = workMatch ? workMatch[1].trim() : 'Unknown'

    console.log('📋 Extracted data:', { worker, address, type, client })

    // Save to database
    const { data: savedJob, error: saveError } = await supabase
      .from('job_calls')
      .insert({
        call_id: webhook.call_id,
        worker_name: worker,
        job_address: address,
        business_type: type,
        client_name: client,
        work_description: work,
        call_transcript: transcript,
        call_duration: webhook.call_length,
        call_cost: (webhook.call_length / 60) * 0.09,
        phone_from: webhook.from,
        phone_to: webhook.to,
        call_status: 'completed'
      })
      .select()
      .single()

    if (saveError) {
      console.error('❌ Error saving to database:', saveError)
      throw saveError
    }

    console.log('✅ Saved to database! Job ID:', savedJob.id)

    // Determine recipient based on phone number
    const isProduction = webhook.to === '+61756512608' || webhook.to === '+61 7 5651 2608'
    const recipientEmail = isProduction ? 'admin@a2zh.com.au' : 'rob@kvell.net'
    
    console.log(isProduction ? '🏭 PRODUCTION call' : '🧪 TEST call')
    console.log('📧 Email will go to:', recipientEmail)

    // Auto-generate quote
    console.log('🤖 AUTO-GENERATING QUOTE...')
    
    const { data: quoteData, error: quoteError } = await supabase.functions.invoke('generate-quote', {
      body: { job_call_id: savedJob.id }
    })

    let quoteSection = ''
    
    if (quoteError) {
      console.error('❌ Quote generation failed:', quoteError)
      quoteSection = `
        <div style="background-color: #FEF3C7; border-left: 4px solid #F59E0B; padding: 12px; margin: 20px 0;">
          <strong style="color: #92400E;">⚠️ Quote Not Generated</strong>
          <p style="color: #78350F; margin: 5px 0 0 0;">There was an issue generating the quote automatically. Please create manually.</p>
        </div>
      `
    } else {
      console.log('✅ QUOTE GENERATED:', quoteData.quote_number)
      console.log('   Total:', '$' + quoteData.total_inc_gst.toFixed(2))
      console.log('   Items:', quoteData.items_count)
      console.log('   Confidence:', (quoteData.confidence_avg * 100).toFixed(0) + '%')
      
      quoteSection = `
        <div style="background-color: #D1FAE5; border-left: 4px solid #10B981; padding: 12px; margin: 20px 0;">
          <strong style="color: #065F46;">✅ Quote Auto-Generated</strong>
          <p style="color: #047857; margin: 5px 0 0 0;">
            <strong>Quote #:</strong> ${quoteData.quote_number}<br>
            <strong>Total:</strong> $${quoteData.total_inc_gst.toFixed(2)} inc GST<br>
            <strong>Items:</strong> ${quoteData.items_count}<br>
            <strong>Confidence:</strong> ${(quoteData.confidence_avg * 100).toFixed(0)}%<br>
            <strong>Status:</strong> Ready for Review
          </p>
        </div>
      `
    }

    // Send email
    const SENDGRID_API_KEY = Deno.env.get('SENDGRID_API_KEY')
    
    const emailHTML = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1F2937;">New Job Recorded</h2>
        
        ${quoteSection}
        
        <div style="background-color: #F3F4F6; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <h3 style="color: #374151; margin-top: 0;">Job Details</h3>
          <p style="margin: 5px 0;"><strong>Worker:</strong> ${worker}</p>
          <p style="margin: 5px 0;"><strong>Address:</strong> ${address}</p>
          <p style="margin: 5px 0;"><strong>Type:</strong> ${type}</p>
          <p style="margin: 5px 0;"><strong>Client:</strong> ${client}</p>
          <p style="margin: 5px 0;"><strong>Work Description:</strong></p>
          <p style="margin: 5px 0 0 20px; font-style: italic;">${work}</p>
        </div>

        <details style="margin: 20px 0;">
          <summary style="cursor: pointer; color: #6B7280; font-size: 14px;">View Full Transcript</summary>
          <pre style="background-color: #F9FAFB; padding: 15px; border-radius: 4px; overflow-x: auto; font-size: 12px; color: #374151;">${transcript}</pre>
        </details>

        <p style="color: #6B7280; font-size: 12px; margin-top: 30px;">
          This is an automated message from A2Z Hydraulics Job Recording System.
        </p>
      </div>
    `

    const emailResponse = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SENDGRID_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        personalizations: [{
          to: [{ email: recipientEmail }],
          subject: `A2Z Job - ${worker}`
        }],
        from: {
          email: 'rob@kvell.net',
          name: 'A2Z Hydraulics'
        },
        content: [{
          type: 'text/html',
          value: emailHTML
        }]
      })
    })

    if (emailResponse.ok) {
      console.log('✅ EMAIL SENT to', recipientEmail)
      if (quoteData) {
        console.log('   📧 Email includes quote:', quoteData.quote_number)
      }
    } else {
      console.error('❌ Email failed:', await emailResponse.text())
    }

    return new Response(JSON.stringify({ 
      success: true,
      job_id: savedJob.id,
      quote_generated: !!quoteData,
      email_sent: emailResponse.ok
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('❌ Error:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
```

**Key Features:**
- CORS headers for web access
- Flexible regex for data extraction
- Database save with error handling
- Auto-quote generation via invoke
- Email routing (test vs production)
- Comprehensive logging

**Critical:** JWT must be DISABLED

---

### Edge Function: generate-quote

**Location:** `supabase/functions/generate-quote/index.ts`  
**Status:** ✅ Deployed and working  
**Purpose:** AI-powered quote generation

**Complete Code:**
```typescript
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const startTime = Date.now()
    const { job_call_id } = await req.json()
    
    console.log('🤖 Starting quote generation for job:', job_call_id)

    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    const anthropicKey = Deno.env.get('ANTHROPIC_API_KEY') ?? ''

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    // Load job call
    const { data: jobCall, error: jobError } = await supabase
      .from('job_calls')
      .select('*')
      .eq('id', job_call_id)
      .single()

    if (jobError || !jobCall) {
      throw new Error('Job call not found')
    }

    console.log('✅ Job loaded:', jobCall.client_name, '-', jobCall.job_address)

    // Load pricing catalog
    const { data: catalog, error: catalogError } = await supabase
      .from('pricing_catalog')
      .select('*')
      .eq('is_active', true)

    if (catalogError) {
      throw new Error('Failed to load pricing catalog')
    }

    console.log('✅ Loaded catalog:', catalog?.length, 'items')

    // Build AI prompt
    const prompt = `You are a professional hydraulic/plumbing estimator for A2Z Hydraulics in Brisbane, Australia.

JOB DETAILS:
- Client: ${jobCall.client_name}
- Address: ${jobCall.job_address}
- Type: ${jobCall.business_type}
- Work Required: ${jobCall.work_description}

PRICING CATALOG:
${catalog?.map(item => `- ${item.item_code}: ${item.item_name} - $${item.base_price} per ${item.unit} (${item.description || 'No description'})`).join('\n')}

Generate a detailed quote with line items. For each item:
1. Select appropriate items from the catalog
2. Estimate realistic quantities
3. Calculate totals
4. Provide confidence score (0-1)
5. Explain your reasoning

Return ONLY valid JSON in this exact format:
{
  "items": [
    {
      "item_name": "Exact name from catalog",
      "description": "Specific work details",
      "quantity": 1.5,
      "unit": "ea",
      "unit_price": 150.00,
      "section": "water_supply",
      "confidence": 0.95,
      "reasoning": "Why this item and quantity"
    }
  ],
  "client_notes": "Professional notes for client",
  "exclusions": ["What's not included"]
}

Sections: storm_water, sewer, water_supply, fire, rough_in, gas, site, labor

Be professional, accurate, and thorough.`

    console.log('🤖 Calling Claude API...')

    // Call Claude
    const anthropicResponse = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': anthropicKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-5-20250929',
        max_tokens: 4096,
        messages: [{
          role: 'user',
          content: prompt
        }]
      })
    })

    if (!anthropicResponse.ok) {
      const errorText = await anthropicResponse.text()
      console.error('❌ Claude API error:', errorText)
      throw new Error('Claude API failed')
    }

    const anthropicData = await anthropicResponse.json()
    const aiResponse = anthropicData.content[0].text

    console.log('✅ Claude response received')

    // Parse JSON
    let parsedResponse
    try {
      // Extract JSON if wrapped in markdown
      const jsonMatch = aiResponse.match(/```(?:json)?\s*([\s\S]*?)\s*```/) || 
                       [null, aiResponse]
      parsedResponse = JSON.parse(jsonMatch[1])
    } catch (parseError) {
      console.error('❌ Failed to parse AI response:', aiResponse)
      throw new Error('Invalid JSON from AI')
    }

    console.log('✅ Parsed response:', parsedResponse.items?.length, 'items')

    // Create quote
    const { data: quote, error: quoteError } = await supabase
      .from('quotes')
      .insert({
        job_call_id: jobCall.id,
        client_name: jobCall.client_name,
        project_address: jobCall.job_address,
        project_type: jobCall.business_type,
        project_description: jobCall.work_description,
        status: 'pending_review',
        ai_generated: true,
        ai_model_used: 'claude-sonnet-4-5-20250929',
        ai_generation_time_ms: Date.now() - startTime,
        client_notes: parsedResponse.client_notes,
        exclusions: parsedResponse.exclusions
      })
      .select()
      .single()

    if (quoteError) {
      console.error('❌ Error creating quote:', quoteError)
      throw quoteError
    }

    console.log('✅ Quote created:', quote.quote_number)

    // Insert items
    const itemsToInsert = parsedResponse.items.map((item: any, index: number) => ({
      quote_id: quote.id,
      section: item.section || 'labor',
      sort_order: index,
      item_name: item.item_name,
      description: item.description || null,
      quantity: parseFloat(item.quantity),
      unit: item.unit,
      unit_price: parseFloat(item.unit_price),
      total_price: parseFloat(item.quantity) * parseFloat(item.unit_price),
      pricing_catalog_id: null,  // CRITICAL: Always null
      ai_suggested: true,
      ai_confidence: item.confidence || null,
      ai_reasoning: item.reasoning || null
    }))

    const { error: itemsError } = await supabase
      .from('quote_items')
      .insert(itemsToInsert)

    if (itemsError) {
      console.error('❌ Error inserting items:', itemsError)
      throw itemsError
    }

    console.log('✅ Items saved:', itemsToInsert.length)

    // Get updated quote with totals
    const { data: finalQuote } = await supabase
      .from('quotes')
      .select('*')
      .eq('id', quote.id)
      .single()

    const avgConfidence = itemsToInsert.reduce((sum: number, item: any) => 
      sum + (item.ai_confidence || 0), 0) / itemsToInsert.length

    // Update confidence
    await supabase
      .from('quotes')
      .update({ ai_confidence_avg: avgConfidence })
      .eq('id', quote.id)

    console.log('✅ Quote complete!')
    console.log('   Number:', finalQuote?.quote_number)
    console.log('   Total:', '$' + finalQuote?.total_inc_gst?.toFixed(2))
    console.log('   Confidence:', (avgConfidence * 100).toFixed(0) + '%')

    return new Response(JSON.stringify({
      success: true,
      quote_id: quote.id,
      quote_number: finalQuote?.quote_number,
      total_inc_gst: finalQuote?.total_inc_gst,
      confidence_avg: avgConfidence,
      items_count: itemsToInsert.length,
      generation_time_ms: Date.now() - startTime
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('❌ Error:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
```

**Key Features:**
- Loads job and catalog
- Builds comprehensive prompt
- Calls Claude API
- Parses JSON response
- **Sets pricing_catalog_id to null** (critical fix)
- Saves quote and items
- Calculates confidence
- Returns detailed results

**Critical:** JWT must be DISABLED

---
## 🎯 CRITICAL DO'S AND DON'TS

### ✅ ALWAYS DO

#### System Architecture
1. ✅ **Push to GitHub after every feature** - Never lose work
2. ✅ **Use simple, proven solutions** - Bland > Vapi, SendGrid > Resend
3. ✅ **Test integration points thoroughly** - JWT, timeouts, auth
4. ✅ **Document decisions immediately** - Update knowledge base
5. ✅ **Use environment variables for secrets** - Never hardcode

#### Voice & AI
6. ✅ **Use Bland.ai for voice** - Simple webhook, reliable
7. ✅ **Use flexible regex patterns** - Handle natural language variations
8. ✅ **Test regex at regex101.com** - Before deploying
9. ✅ **Provide complete context to AI** - Job + catalog + examples
10. ✅ **Request confidence scores** - Track AI accuracy
11. ✅ **Set pricing_catalog_id to null** - Avoid UUID errors

#### Backend
12. ✅ **Use Supabase Edge Functions** - No timeout issues
13. ✅ **Use supabase.functions.invoke()** - Not fetch
14. ✅ **DISABLE JWT after EVERY deployment** - Critical for webhooks
15. ✅ **Log everything for debugging** - Console.log liberally
16. ✅ **Test functions individually** - Before integration

#### Database
17. ✅ **Design schema before coding** - Plan relationships
18. ✅ **Use triggers for calculations** - Auto-update totals
19. ✅ **Add indexes for queries** - Performance
20. ✅ **Disable RLS for development** - Enable later
21. ✅ **Back up database regularly** - Export schema + data

#### Frontend
22. ✅ **Use TypeScript** - Type safety prevents errors
23. ✅ **Create reusable components** - DRY principle
24. ✅ **Hard refresh after changes** - Cmd+Shift+R
25. ✅ **Check browser console** - F12 for errors
26. ✅ **Test on mobile devices** - Responsive design

#### Development
27. ✅ **Read error messages completely** - They tell you what's wrong
28. ✅ **Check logs before asking** - Answer usually there
29. ✅ **Test locally before deploying** - npm run dev
30. ✅ **Keep knowledge base updated** - Document learnings
31. ✅ **Take screenshots of configs** - Visual reference

#### File Editing
32. ✅ **Use VS Code for files >50 lines** - Visual editor
33. ✅ **Backup before editing** - cp file.tsx file.tsx.backup
34. ✅ **Verify changes** - cat file.tsx | head -20
35. ✅ **Test immediately after editing** - npm run dev

---

### ❌ NEVER DO

#### System Architecture
1. ❌ **Don't use Vapi** - Function calling unreliable
2. ❌ **Don't use Vercel for webhooks** - 10s timeout
3. ❌ **Don't use HTTP fetch** - Use supabase.functions.invoke()
4. ❌ **Don't access SendGrid directly** - Use Twilio Console
5. ❌ **DON'T leave JWT enabled** - Blocks webhooks

#### Development
6. ❌ **Don't work without Git** - Always have backups
7. ❌ **Don't commit API keys** - Use .env files
8. ❌ **Don't skip testing** - Test after every change
9. ❌ **Don't trust UI settings** - Verify in code/logs
10. ❌ **Don't use overly specific regex** - Too brittle

#### Deployment
11. ❌ **Don't deploy without testing** - Local first
12. ❌ **Don't assume deployed = working** - Test it!
13. ❌ **Don't forget JWT after deploy** - Check every time
14. ❌ **Don't skip reading logs** - Critical for debugging
15. ❌ **Don't deploy Friday afternoon** - If avoidable

#### Code Quality
16. ❌ **Don't use 'any' types** - Use TypeScript properly
17. ❌ **Don't create huge files** - Split at 500 lines
18. ❌ **Don't copy without understanding** - Know what it does
19. ❌ **Don't ignore warnings** - Address them
20. ❌ **Don't skip error handling** - Always handle errors

#### File Editing
21. ❌ **Don't use nano** - Hard to use, easy to mess up
22. ❌ **Don't use cat >> for large files** - File corruption risk
23. ❌ **Don't use vi/vim** - Unless you know it well
24. ❌ **Don't edit without backup** - Always backup first

---

## 🔄 GITHUB WORKFLOW

### Initial Setup
```bash
# Create repository on GitHub
# Go to github.com → New repository

# Clone locally
cd ~
git clone https://github.com/username/repo.git
cd repo

# Configure Git (first time only)
git config user.name "Your Name"
git config user.email "your.email@example.com"

# Create .gitignore
cat > .gitignore << 'EOF'
.env
.env.local
.env*.local
node_modules/
.next/
.DS_Store
EOF

# Initial commit
git add -A
git commit -m "Initial commit"
git push origin main
```

---

### Daily Workflow
```bash
# Morning: Start work
cd ~/project
git pull origin main

# Check status
git status

# Make changes (in VS Code, etc.)

# See what changed
git diff

# Add all changes
git add -A

# Or add specific files
git add path/to/file.tsx

# Commit with message
git commit -m "Add feature: description"

# Push immediately
git push origin main

# Repeat after each feature
```

---

### Good Commit Messages
```bash
# ✅ GOOD
git commit -m "Add edit client modal"
git commit -m "Fix UUID error in quote generation"
git commit -m "Update regex patterns for flexibility"
git commit -m "Deploy to production"

# ❌ BAD
git commit -m "updates"
git commit -m "fix"
git commit -m "wip"
git commit -m "changes"
```

---

### Useful Git Commands
```bash
# View commit history
git log --oneline

# See changes in last commit
git show

# Undo last commit (keep changes)
git reset --soft HEAD~1

# Undo changes to file (before commit)
git checkout -- path/to/file.tsx

# View remote URL
git remote -v

# Pull latest (if working on multiple machines)
git pull origin main

# Check current branch
git branch

# Create new branch (for features)
git checkout -b feature-name

# Switch back to main
git checkout main
```

---

## 🛠️ FILE EDITING METHODS

### Method 1: VS Code (BEST for most files)
```bash
# Open file in VS Code
code filename.tsx

# In VS Code:
# 1. Select All (Cmd+A)
# 2. Delete
# 3. Paste new content
# 4. Save (Cmd+S)

# Or edit directly in VS Code (recommended)
```

**Pros:**
- Visual editor
- Syntax highlighting
- Error checking
- Easy to use
- Can see whole file

**Use for:**
- Files >50 lines
- Complex edits
- Multiple changes
- New files you're not sure about

---

### Method 2: Complete File Creation (BEST for new files)
```bash
cat > filename.tsx << 'ENDFILE'
[paste entire file content here]
ENDFILE

# Verify created
ls -la filename.tsx
cat filename.tsx | head -20
```

**Pros:**
- One command
- No editor needed
- Fast for complete files

**Use for:**
- New files with complete content
- Replacing entire file
- Configuration files

**Important:** 
- Must close with ENDFILE on its own line
- Don't interrupt while typing
- Test immediately after

---

### Method 3: Echo for Small Additions (BEST for single lines)
```bash
# Add single line to file
echo "new line" >> filename.txt

# Create small file
echo "content" > filename.txt

# Add env variable
echo "NEXT_PUBLIC_API_KEY=value" >> .env.local
```

**Pros:**
- Very fast
- No editor
- Simple

**Use for:**
- Single lines
- Small additions
- Simple config

---

### Method 4: sed for Search/Replace (Advanced)
```bash
# Replace text in file
sed -i '' 's/old-text/new-text/g' filename.txt

# Example: Update API URL
sed -i '' 's/localhost:3000/production.com/g' .env.local
```

**Use for:**
- Find and replace
- Multiple similar changes
- Scripted updates

---

### ❌ AVOID THESE METHODS
```bash
# ❌ nano - Hard to use
nano filename.txt

# ❌ vi/vim - Steep learning curve  
vi filename.txt

# ❌ cat >> for long files - Easy to mess up
cat >> file.tsx << 'EOF'
[hundreds of lines - risky!]
EOF
```

---

### File Editing Checklist
```
Before editing:
□ File exists? ls -la filename.tsx
□ Backup if important? cp file.tsx file.tsx.backup
□ Know what you're changing?

After editing:
□ File saved? ls -la filename.tsx
□ Looks correct? cat filename.tsx | head -20
□ No syntax errors? (check in VS Code)
□ Committed? git add -A && git commit -m "message"

For dashboard files:
□ Dev server running? npm run dev
□ Browser refreshed? Cmd+Shift+R
□ No console errors? F12 to check
□ Pushed to Git? git push origin main
```

---

## 🚀 DEPLOYMENT PROCESS

### Local Development Setup (One-time)
```bash
# 1. Clone repository
cd ~
git clone https://github.com/username/project.git
cd project/dashboard

# 2. Install dependencies
npm install

# 3. Create environment file
cat > .env.local << 'EOF'
NEXT_PUBLIC_SUPABASE_URL=https://grptqxahlpqevdrnodqs.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdycHRxeGFobHBxZXZkcm5vZHFzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA3MjQ4MjYsImV4cCI6MjA3NjMwMDgyNn0.iW2z6SyDuLTmiJ9_BfJG9L7K2BKBeu5PnIs8mHKQ030
EOF

# 4. Start development server
npm run dev

# 5. Open browser
# http://localhost:3000
```

---

### Edge Functions Deployment
```bash
cd ~/project

# Deploy single function
supabase functions deploy bland-webhook

# Deploy another function
supabase functions deploy generate-quote

# 🚨 CRITICAL: After EVERY deployment
# Go to Supabase Dashboard
# Edge Functions → bland-webhook → Turn OFF "Verify JWT"
# Edge Functions → generate-quote → Turn OFF "Verify JWT"

# Test immediately
# Make test call
# Check logs
```

**Deployment Checklist:**
```
□ Code pushed to GitHub
□ Function deployed
□ JWT DISABLED ⚠️ 
□ Test call made
□ Logs checked
□ Email received
□ Quote generated (if applicable)
```

---

### Vercel Deployment (Frontend)

#### First Time Setup
```bash
cd ~/project/dashboard

# Install Vercel CLI
npm install -g vercel

# Login
vercel login
# Opens browser, login with GitHub

# First deployment
vercel

# Answer questions:
# Set up and deploy? Yes
# Which scope? Your account
# Link to existing project? No
# Project name? a2z-dashboard
# Directory? ./
# Override settings? No

# Add environment variables
vercel env add NEXT_PUBLIC_SUPABASE_URL
# Paste: https://grptqxahlpqevdrnodqs.supabase.co
# Select: Production, Preview, Development (all 3)

vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
# Paste: [your key]
# Select: Production, Preview, Development (all 3)

# Deploy to production
vercel --prod

# Get production URL
# https://project-name.vercel.app
```

---

#### Subsequent Deployments
```bash
cd ~/project/dashboard

# Deploy to production
vercel --prod

# That's it! URL stays the same
```

---

### Complete Deployment Workflow
```bash
# 1. Make changes locally
cd ~/project/dashboard
code app/page.tsx
# Make changes

# 2. Test locally
npm run dev
# Test in browser at localhost:3000

# 3. Commit to Git
cd ~/project
git add -A
git commit -m "Add feature X"
git push origin main

# 4. Deploy Edge Functions (if changed)
supabase functions deploy bland-webhook
# Then: Disable JWT in dashboard ⚠️

# 5. Deploy frontend to Vercel
cd dashboard
vercel --prod

# 6. Test production
# Open production URL
# Test all features
# Check for errors

# 7. Monitor
# Check logs for errors
# Test with real call (if voice system)
```

---

## 🐛 COMMON ERRORS & FIXES

### Error: 401 Unauthorized

**Symptom:**
```
FunctionsHttpError: Edge Function returned non-2xx
status: 401
message: Invalid JWT
```

**Cause:** JWT verification is enabled on Edge Function

**Fix:**
1. Go to Supabase Dashboard
2. Click "Edge Functions"
3. Click function name
4. Turn OFF "Verify JWT"
5. Test immediately

**Prevention:** Check after EVERY deployment

---

### Error: Invalid UUID

**Symptom:**
```
invalid input syntax for type uuid: "LABOR-PLUMBER"
```

**Cause:** Trying to insert text into UUID column

**Fix:**
```typescript
// In generate-quote function
pricing_catalog_id: null  // Always null
```

**Prevention:** Don't expect AI to return perfect UUIDs

---

### Error: Items Not Showing

**Symptom:** Quote displays but "No items in this quote"

**Possible Causes:**

1. **Old quote (before UUID fix)**
   - Make new test call

2. **RLS blocking query**
```sql
   ALTER TABLE quote_items DISABLE ROW LEVEL SECURITY;
```

3. **Wrong quote_id**
   - Check logs for actual quote_id

4. **JWT enabled**
   - Disable JWT on generate-quote

**Debug:**
```sql
-- Check if items exist
SELECT * FROM quote_items WHERE quote_id = 'your-quote-id';

-- Check RLS status
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'quote_items';
```

---

### Error: Timeout on Vercel

**Symptom:** Function times out after 10 seconds

**Cause:** Vercel Edge Functions have 10s limit

**Fix:** Move to Supabase Edge Functions (no timeout)

**Prevention:** Never use Vercel for long operations

---

### Error: Module Not Found

**Symptom:**
```
Module not found: Can't resolve '@/components/ComponentName'
```

**Causes & Fixes:**

1. **Component doesn't exist**
   - Create the component file first

2. **Wrong import path**
   - Check exact path and spelling

3. **Not exported**
```typescript
   // Add to component
   export default ComponentName
```

4. **TypeScript cache**
```bash
   rm -rf .next
   npm run dev
```

---

### Error: Environment Variable Undefined

**Symptom:**
```
TypeError: Cannot read property 'X' of undefined
```

**Causes & Fixes:**

1. **.env.local missing**
   - Create file in dashboard/ folder

2. **Wrong variable name**
   - Must start with NEXT_PUBLIC_

3. **Server not restarted**
   - Stop and restart npm run dev

4. **Vercel missing vars**
```bash
   vercel env add NEXT_PUBLIC_SUPABASE_URL
```

---

### Error: Regex Not Matching

**Symptom:** Data shows as "Unknown" in database

**Causes & Fixes:**

1. **Too specific pattern**
```javascript
   // ❌ Too specific
   /Thanks (\w+)/
   
   // ✅ Flexible
   /name.*?\n\s*user:\s*([^\n.]+)/i
```

2. **Case sensitive**
```javascript
   // Add /i flag
   /pattern/i
```

3. **Transcript format changed**
   - Check actual transcript in logs
   - Adjust pattern accordingly

4. **Test at regex101.com**
   - Paste transcript
   - Test pattern
   - See what matches

---

### Error: Git Push Rejected

**Symptom:**
```
! [rejected] main -> main (non-fast-forward)
```

**Cause:** Local branch behind remote

**Fix:**
```bash
git pull origin main
# Resolve any conflicts
git push origin main
```

**Prevention:** Always pull before starting work

---

### Error: Port Already in Use

**Symptom:**
```
Error: listen EADDRINUSE: address already in use :::3000
```

**Cause:** Another process using port 3000

**Fix:**
```bash
# Find and kill process
lsof -ti:3000 | xargs kill -9

# Or use different port
npm run dev -- -p 3001
```

**Prevention:** Close previous dev server before starting

---

### Error: SendGrid API Key Invalid

**Symptom:** Email fails to send, 401 error

**Cause:** Wrong API key or not accessed via Twilio

**Fix:**
1. Login to Twilio Console
2. Navigate to SendGrid Email API
3. Settings → API Keys
4. Create new key
5. Store in Supabase secrets

**Prevention:** Always access SendGrid through Twilio

---

## 🧪 TESTING PROCEDURES

### Complete System Test

**Before Test:**
```
□ All Edge Functions deployed
□ JWT disabled on both functions
□ Environment variables set
□ Dashboard running (production or local)
```

**Test Steps:**

1. **Make Call**
```
   Dial: +61 7 5651 2608
   
   Answer questions:
   - Name: Test Worker
   - Address: 123 Test St Brisbane
   - Type: Business
   - Client: Test Client
   - Work: Replace garden tap
   - Anything else: No
```

2. **Check Logs (30-60 seconds after call)**
```
   Supabase → Edge Functions → bland-webhook → Logs
   
   Expected sequence:
   🎯 Webhook received
   ✅ Full call data received
   ✅ Saved to database
   🏭 PRODUCTION call
   🤖 AUTO-GENERATING QUOTE
   ✅ QUOTE GENERATED: A2Z-2511-XXXX
   ✅ EMAIL SENT to admin@a2zh.com.au
```

3. **Check Email**
```
   □ Email received at admin@a2zh.com.au
   □ Subject: "A2Z Job - Test Worker"
   □ Job details present
   □ Green "Quote Auto-Generated" box
   □ Quote number shown
   □ Total shown
   □ Status: Ready for Review
```

4. **Check Dashboard**
```
   Open: https://a2z-dashboard-nw7bp9g7j-cce110s-projects.vercel.app
   
   □ New quote in list
   □ Correct client name
   □ Correct address
   □ Total matches email
   □ Status: Pending Review
   □ Confidence shown
```

5. **Check Quote Detail**
```
   Click on quote
   
   □ Professional header with logo
   □ Company details displayed
   □ Client info correct
   □ Items listed with sections
   □ Section totals correct
   □ Quote totals correct
   □ Edit button works
   □ PDF generation works
```

**Success Criteria:**
- ✅ All 5 checks pass
- ✅ No errors in logs
- ✅ Items showing in quote detail
- ✅ End-to-end time < 60 seconds

---

### Test Different Job Types

**Simple Job:**
```
Work: Replace garden tap
Expected: 
- Hose tap ($180)
- Licensed plumber (1-2 hours)
- Travel costs
Confidence: >90%
```

**Medium Job:**
```
Work: Install new hot water system
Expected:
- HWS unit
- Gas line work
- Labor (3-4 hours)
- RPZD valve
- Materials
Confidence: 85-90%
```

**Complex Job:**
```
Work: Bathroom renovation - new toilet, basin, shower
Expected:
- Multiple fixtures
- Rough-in work
- Drainage
- Labor (8-10 hours)
- Materials
Confidence: 75-85%
```

---

## 📊 PERFORMANCE METRICS

### Current Performance (as of Nov 2, 2025)

**Voice System:**
- Call completion rate: 95%
- Data extraction accuracy: 90%
- Email delivery rate: 100%
- Average call duration: 2.5 minutes
- Average call cost: $0.23

**AI Quote Generation:**
- Average confidence: 85-98%
- Generation time: 3-20 seconds
- Items per quote: 3-15 items
- Cost per quote: $0.045

**Overall System:**
- End-to-end time: 30-60 seconds
- Cost per complete job: $0.275
- ROI vs manual: 17,000%+
- System uptime: 99.9%

---

## 💰 COST ANALYSIS

### Monthly Operational Costs

| Service | Cost | Notes |
|---------|------|-------|
| Bland.ai | $69 | 300 calls × $0.23 |
| Phone numbers | $2 | Test + Production |
| Anthropic AI | $13.50 | 300 quotes × $0.045 |
| Supabase | $0 | Free tier sufficient |
| Vercel | $0 | Free tier sufficient |
| SendGrid | $0 | Free tier (100/day) |
| **Total** | **$84.50** | Per month |

**Per Job Cost:** $0.275 (27.5 cents)

**ROI Calculation:**
- Manual time: 30-60 minutes
- Manual cost @ $95/hr: $47.50-$95.00
- AI cost: $0.275
- **Savings: $47.23-$94.73 per quote**
- **ROI: 17,000%-34,000%**

**Break-even:** First 2 quotes pay for entire month

---

## ⚙️ CONFIGURATION DETAILS

### Bland.ai Complete Config
```
Agent Name: A2Z Production Job Recorder
Voice: Australian male (Riley)
Model: Enhanced
Phone Number: +61 7 5651 2608
Max Call Duration: 30 minutes
First Sentence: "Hi, this is A2Z Hydraulics job recording. I'll ask you a few quick questions about the job."

Webhook URL: https://grptqxahlpqevdrnodqs.supabase.co/functions/v1/bland-webhook

Events (BOTH must be checked):
☑ Call
☑ Webhook

System Prompt:
You are a job recording assistant for A2Z Hydraulics in Brisbane, Australia.

Your task is to collect job details from workers who call in. Be friendly and conversational.

Ask these questions in order:
1. "What's your name?"
2. "What's the job address?"
3. "Is this a business or residential job?"
4. "Who's the client?"
5. "What work needs doing?"
6. "Is there anything else we should know about this job?"

After collecting all information, summarize the key details and ask the worker to confirm. If they confirm, thank them and end the call. If they need to correct something, ask which part they'd like to update.

Be professional but friendly. Keep the call brief and focused.
```

---

### Supabase Edge Functions Config

**bland-webhook:**
```
Name: bland-webhook
Region: Sydney (closest to Brisbane)
Verify JWT: OFF ⚠️
Secrets needed:
- SUPABASE_URL
- SUPABASE_SERVICE_ROLE_KEY
- SENDGRID_API_KEY
```

**generate-quote:**
```
Name: generate-quote
Region: Sydney
Verify JWT: OFF ⚠️
Secrets needed:
- SUPABASE_URL
- SUPABASE_SERVICE_ROLE_KEY
- ANTHROPIC_API_KEY
```

---

### Vercel Config
```
Project: a2z-dashboard
Framework: Next.js
Root Directory: dashboard/
Build Command: npm run build
Output Directory: .next
Install Command: npm install

Environment Variables (all 3 environments):
NEXT_PUBLIC_SUPABASE_URL=https://grptqxahlpqevdrnodqs.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[key]
```

---

## 🔗 KEY URLS & CONTACTS

### Production URLs

- **Dashboard:** https://a2z-dashboard-nw7bp9g7j-cce110s-projects.vercel.app
- **GitHub:** https://github.com/CCE110/a2z-fresh
- **Supabase:** https://supabase.com/dashboard/project/grptqxahlpqevdrnodqs
- **Vercel:** https://vercel.com/cce110s-projects/a2z-dashboard

### Admin Dashboards

- **Bland.ai:** https://app.bland.ai
- **Anthropic:** https://console.anthropic.com
- **Twilio/SendGrid:** https://console.twilio.com

### Phone Numbers

- **Test:** +61 468 031 930 → rob@kvell.net
- **Production:** +61 7 5651 2608 → admin@a2zh.com.au

### Company Details

**A2Z Hydraulics PTY LTD**  
ABN: 47639999538  
QBCC Licence: 15297619  
Shop 3, 156 Boundary Street  
West End Qld 4101  

Phone: 0427333288  
Email: Supervisor@a2zh.com.au  
Web: A2zhydraulics.com.au

---

## 📚 ADDITIONAL RESOURCES

### Documentation Links

- **Next.js:** https://nextjs.org/docs
- **Supabase:** https://supabase.com/docs
- **TypeScript:** https://www.typescriptlang.org/docs
- **Tailwind:** https://tailwindcss.com/docs
- **Anthropic Claude:** https://docs.anthropic.com
- **Bland.ai:** https://docs.bland.ai

### Testing Tools

- **Regex Testing:** https://regex101.com
- **JSON Formatter:** https://jsonformatter.org
- **Base64 Encode/Decode:** https://www.base64encode.org

---

## 🎉 PROJECT SUMMARY

### What Was Built

Complete voice-to-quote automation system:
1. Workers call phone number
2. AI records and extracts job details
3. AI generates professional quote
4. Email sent to supervisor
5. Dashboard for review/editing
6. PDF generation
7. Client communication

### Technology Decisions

**Chosen:**
- Bland.ai (voice)
- Supabase (database + functions)
- Claude Sonnet 4.5 (AI)
- SendGrid (email)
- Next.js 16 (frontend)
- Vercel (hosting)
- GitHub (version control)

**Rejected:**
- Vapi.ai → Unreliable function calling
- Vercel functions → Timeout issues
- Resend → Complex setup
- Direct API calls → Authentication issues

### Key Achievements

- **Time:** Built in 4 weeks
- **Cost:** $0.275 per quote
- **ROI:** 17,000%+
- **Accuracy:** 85-98% AI confidence
- **Speed:** <60 seconds end-to-end
- **Deployed:** Production-ready on Vercel
- **Maintained:** Complete documentation

### Lessons Learned

1. Simple solutions beat complex ones
2. Test integration points thoroughly
3. Flexible patterns handle variations
4. Documentation prevents re-learning
5. Git everything immediately
6. Read error messages completely
7. JWT blocks external webhooks
8. Vercel has timeouts
9. AI can't return perfect UUIDs
10. VS Code beats terminal editors

---

## ✅ FINAL CHECKLIST

### System Complete When:

**Development:**
- [x] All features working locally
- [x] End-to-end test successful
- [x] No console errors
- [x] Mobile responsive
- [x] Error handling in place
- [x] TypeScript types correct

**Deployment:**
- [x] Pushed to GitHub
- [x] Edge Functions deployed
- [x] JWT disabled on webhooks
- [x] Frontend deployed to Vercel
- [x] Environment variables set
- [x] Production test successful

**Documentation:**
- [x] Knowledge base complete
- [x] README written
- [x] API keys documented
- [x] URLs documented
- [x] Process documented
- [x] Build guide created

**Handoff:**
- [x] Code in GitHub
- [x] Access shared
- [x] Documentation complete
- [x] System operational
- [x] Support plan defined

---

## 🚀 FUTURE ENHANCEMENTS

### Planned Features

- Email quotes to clients directly
- Client portal for acceptance
- SMS notifications
- QuickBooks integration
- Advanced analytics
- Search and filters
- User authentication
- Mobile app
- Photo upload via MMS
- Schedule management

### AI Improvements

- Learn from edits (ML feedback)
- Improve confidence over time
- Suggest similar past quotes
- Auto-detect job types
- Price recommendations

---

**END OF COMPLETE KNOWLEDGE BASE**

*This comprehensive knowledge base contains everything needed to understand, maintain, and replicate the A2Z Hydraulics Voice-to-Quote system. Use it as your single source of truth.*

**Version:** 1.0  
**Last Updated:** November 2, 2025  
**Status:** Production-ready and operational  
**Maintained by:** Development team

🎉 **Complete system documentation - everything in one place!** 🎉



