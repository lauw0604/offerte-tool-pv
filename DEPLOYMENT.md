# Deployment Guide - Plus Min Energie Offertetool

## ✅ Phase 6, 7, 8 Checklist

### Phase 6: Detail Page
- [x] Create `/offerte/[id]` detail page
- [x] Show customer, system spec, offer lines
- [x] Display totals and status
- [x] Back button navigation

### Phase 7: User Management & Teams
- [x] Create `teams` table in Supabase
- [x] Create `team_members` table with roles
- [x] Add team_id to offertes
- [x] Implement RLS policies for team access
- [x] Build team management UI
- [x] Create settings/team page

### Phase 8: Vercel Deployment
- [ ] Prepare Vercel configuration
- [ ] Set up environment variables
- [ ] Deploy production build
- [ ] Configure custom domain (optional)

---

## 🚀 Deployment to Vercel

### Prerequisites
1. Vercel account (free tier works)
2. GitHub repository linked
3. Supabase project setup with all tables

### Environment Variables on Vercel

Go to Vercel Project Settings > Environment Variables and add:

```
NEXT_PUBLIC_SUPABASE_URL = https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY = your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY = your-service-role-key-here
```

### Deployment Steps

1. **Push to GitHub:**
   ```bash
   git add .
   git commit -m "Phase 6-8: Detail pages, teams, deployment ready"
   git push origin main
   ```

2. **Deploy on Vercel:**
   - Go to vercel.com
   - Import project from GitHub
   - Select this repository
   - Add environment variables from list above
   - Click "Deploy"

3. **Database Schema (Supabase):**
   Run the updated `supabase/schema.sql` in Supabase SQL editor to:
   - Create `teams` table
   - Create `team_members` table
   - Add team-based RLS policies

### Post-Deployment

1. Test all routes:
   - ✓ `/login` - Authentication
   - ✓ `/dashboard` - Team navigation
   - ✓ `/offerte` - Create offer
   - ✓ `/prijslijst` - Product catalog
   - ✓ `/overzicht` - Offer overview
   - ✓ `/offerte/[id]` - Offer details
   - ✓ `/settings` - Team management

2. Create a test user and team in Supabase Auth

3. Generate test offers and verify PDF/Email generation

### Custom Domain (Optional)

1. Go to Project Settings > Domains
2. Add your custom domain
3. Update DNS records as shown by Vercel

### Monitoring

- Monitor logs in Vercel Dashboard
- Check Supabase database activity
- Review auth logs in Supabase Auth

---

## 🔄 Future Phases

**Phase 9:** Email delivery integration (SendGrid)
**Phase 10:** Advanced reporting & analytics
**Phase 11:** Mobile app (React Native)
**Phase 12:** API for third-party integrations

---

## Support

- Supabase Docs: https://supabase.com/docs
- Next.js Docs: https://nextjs.org/docs
- Vercel Docs: https://vercel.com/docs
