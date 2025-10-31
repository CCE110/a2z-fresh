# A2Z Hydraulics - Complete Knowledge Base

**Last Updated:** October 31, 2025  
**Status:** PRODUCTION - FULLY OPERATIONAL  
**GitHub:** https://github.com/CCE110/a2z-fresh

## SYSTEM STATUS: 100% WORKING ✅

Workers call +61 7 5651 2608 → AI generates quote → Email to admin@a2zh.com.au

**Latest Test:** Steve Smith, 42 Kebble St, IVC6 Shop, Replace 300L heat pump  
**Quote:** A2Z-2510-0007, $12,125.30 inc GST, 85% confidence, 15 seconds

**Cost:** $0.275 per job | **ROI:** 17,000%+

---

## PHONE NUMBERS
- Test: +61 468 031 930 → rob@kvell.net
- Production: +61 7 5651 2608 → admin@a2zh.com.au

## SERVICES
- Supabase: https://supabase.com/dashboard/project/grptqxahlpqevdrnodqs
- Bland: https://app.bland.ai
- Anthropic: https://console.anthropic.com
- Twilio: https://console.twilio.com
- GitHub: https://github.com/CCE110/a2z-fresh

## TECH STACK
- Voice: Bland.ai ($0.09/min)
- Database: Supabase PostgreSQL
- AI: Claude Sonnet 4.5 ($0.045/quote)
- Email: SendGrid via Twilio
- Backend: Supabase Edge Functions

## WHAT FAILED & WHY
1. Vapi → Use Bland.ai
2. Vercel → Use Supabase Edge Functions
3. HTTP fetch → Use supabase.functions.invoke()
4. Resend → Use SendGrid via Twilio
5. Specific regex → Use flexible patterns
6. JWT ON → MUST disable after deploy

## CRITICAL: JWT VERIFICATION
**AFTER EVERY DEPLOYMENT:**
- Disable JWT in both functions
- Supabase Dashboard → Edge Functions → Turn OFF "Verify JWT"
- Check: bland-webhook AND generate-quote

## SENDGRID ACCESS
**MUST use Twilio Console:** https://console.twilio.com
- Navigate to SendGrid Email API
- Create API key with Mail Send permission
- Keys stored in Supabase secrets (not in git)

## API KEYS
**Location:** Supabase Dashboard → Project Settings → Edge Functions → Secrets
- ANTHROPIC_API_KEY
- SENDGRID_API_KEY
- SUPABASE_SERVICE_ROLE_KEY

**Set via CLI:**
```bash
supabase secrets set ANTHROPIC_API_KEY="your_key"
supabase secrets set SENDGRID_API_KEY="your_key"
```

## WORKING REGEX PATTERNS
```typescript
const workerMatch = transcript.match(/name.*?\n\s*user:\s*([^\n.]+)/i)
const addressMatch = transcript.match(/address.*?\n\s*user:\s*([^\n]+)/i)
const typeMatch = transcript.match(/business or residential.*?\n\s*user:\s*([^\n.]+)/i)
const clientMatch = transcript.match(/client.*?\n\s*user:\s*([^\n.]+)/i)
const workMatch = transcript.match(/work needs doing.*?\n\s*user:\s*([^]+?)(?=\n\s*assistant:|$)/i)
```

## DATABASE
- URL: https://grptqxahlpqevdrnodqs.supabase.co
- 7 Tables: job_calls, pricing_catalog, quotes, quote_items, quote_sections, ai_learning_feedback, quote_audit_log
- 89 active pricing items

## GITHUB WORKFLOW
```bash
cd ~/a2z-fresh/supabase/functions/[function]
# Edit code
git add -A && git commit -m "msg" && git push
supabase functions deploy [function]
# CRITICAL: Disable JWT in Dashboard
# Test immediately
```

## NEXT: DASHBOARD (3 weeks)
- Tech: Next.js + TypeScript + Tailwind
- Features: View quotes, Edit items, Approve/reject
- Start: `cd ~/a2z-fresh && npx create-next-app@latest dashboard`

---

**System is 100% operational. Ready for dashboard development.**
