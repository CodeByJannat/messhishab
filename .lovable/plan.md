

# MessHishab - Mess Management Application

A comprehensive full-stack web application for managing student messes (shared living spaces) in Bangladesh with modern UI, robust security, and Bengali/English language support.

---

## 🎯 Core Features Overview

### Authentication & User Management
- **Manager Registration** with email, password, and CAPTCHA verification
- **Manager Login** with JWT-based sessions and subscription validation
- **Member Login** using MessID + MessPassword (no personal email needed)
- **Password Reset** via email link
- **Auto-logout** on inactivity for security

### Manager Dashboard
- **Mess Setup**: Auto-generated MessID and editable MessPassword on first login
- **Member Management**: Add/edit members with name, email, phone, room number, and unique PIN (4-6 digits)
- **PIN Records**: Secure section to view all member PINs (manager-only access)
- **Eye Icon Privacy**: Click to enter PIN before viewing any member's personal details
- **Meal Tracking**: Add daily meals per member (breakfast/lunch/dinner counts)
- **Bazar Management**: Record shopping with person, items, notes, and cost
- **Deposit Tracking**: Record payments per member
- **Notifications**: Send messages to individual members or all
- **Balance Overview**: Color-coded table (red = negative, green = positive, neutral = zero)
- **Auto-calculation**: Meal rate = Total Bazar ÷ Total Meals

### Member Dashboard
- **View-Only Access**: Own deposits, meals, total cost, and balance
- **No Access** to other members' data or personal details
- **View Total Bazar**: All shopping records (who, when, cost)
- **View Meal Rate**: Current calculated rate
- **Notify Manager**: Send messages directly
- **Receive Notifications**: View manager announcements

### Subscription System
- **Monthly Plan**: 20 BDT
- **Yearly Plan**: 200 BDT (Best Value)
- **Coupon Support**: Apply discount codes
- **Subscription Check**: Members can't access if manager's subscription expired
- **Payment Integration**: bKash integration (to be added when credentials available)

### Monthly Reset (Automated)
- Archive previous month's data
- Start fresh month with clean totals
- Maintain historical records for reference

---

## 🔐 Privacy & Security Features

1. **PIN-Protected Personal Details**
   - Manager sets unique 4-6 digit PIN per member
   - Eye icon click requires PIN entry
   - 3 wrong attempts = temporary lock
   - All attempts logged

2. **Data Encryption**
   - Email, phone, room numbers encrypted in database
   - PINs hashed with bcrypt
   - Row-level security enforcing member isolation

3. **Role-Based Access**
   - Managers: Full access to their mess only
   - Members: Own data only, no cross-access
   - One mess per manager email
   - One mess per member at a time

---

## 🎨 Design & User Experience

### Visual Style
- **Glass Morphism** with frosted glass effects
- **Rounded Corners** throughout
- **Light/Dark Theme Toggle**
- **Font**: Noto Sans Bangla for Bengali text

### Landing Page Sections
1. **Hero Section**: Emotional headline "মেসের হিসাব নিয়ে আর কোনো ঝামেলা নয়" with yellow CTA
2. **Trust Badges**: Security, mobile-friendly, Bangladesh-specific
3. **Pricing**: Monthly/Yearly toggle with coupon field
4. **Manual vs Our System**: Comparison with pain points vs solutions
5. **X-Factor**: Unique features with icons
6. **3 Easy Steps**: Simple onboarding flow
7. **Testimonial**: Social proof quote
8. **FAQ Accordion**: Common questions
9. **Final CTA**: "আজই রেজিস্ট্রেশন করুন"
10. **Footer**: Links, social icons, legal pages

### Mobile Responsive
- Works seamlessly on phones and desktops
- Touch-friendly controls
- Optimized data tables for small screens

### Language Toggle
- Switch between English and Bengali
- All UI elements translated
- Bengali as default

---

## 🔔 Real-Time Features

- **Instant Notifications**: Using Supabase Realtime
- **Low Balance Alerts**: Automatic when balance goes negative
- **Manager Messages**: Appear immediately for members
- **Live Updates**: No page refresh needed

---

## 📊 Technical Architecture

### Frontend
- React with TypeScript
- Tailwind CSS with glass morphism effects
- Noto Sans Bangla font integration
- Real-time updates via Supabase Realtime

### Backend (Supabase)
- PostgreSQL database with encrypted fields
- Row-level security policies
- Edge functions for PIN verification and sensitive operations
- Scheduled functions for monthly reset

### Database Tables
- **users**: Authentication with roles
- **messes**: Manager's mess data
- **members**: Member details with encrypted PII
- **meals**: Daily meal records
- **bazars**: Shopping records
- **deposits**: Payment records
- **notifications**: In-app messaging
- **subscriptions**: Plan and payment status
- **monthly_archives**: Historical data

---

## 🚀 Implementation Phases

**Phase 1: Foundation**
- Landing page with all sections
- Registration and login flows
- Database schema setup

**Phase 2: Core Dashboards**
- Manager dashboard with all features
- Member dashboard with view-only access
- Real-time notifications

**Phase 3: Security & Privacy**
- PIN system implementation
- Data encryption
- Access logging

**Phase 4: Subscriptions**
- Subscription management
- Coupon system
- Payment placeholder (bKash integration ready)

**Phase 5: Polish**
- Monthly auto-reset
- Language toggle
- Theme toggle
- Mobile optimization

