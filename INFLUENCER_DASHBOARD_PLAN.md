# NedaPay Influencer Dashboard Implementation Plan

## Overview
This document outlines the implementation plan for adding an influencer dashboard with referral tracking to the NedaPay merchant application. The system will allow influencers to track user signups and potentially earn rewards for bringing in new users.

## Current System Analysis

### Key Components
- **Authentication**: Privy for wallet and email authentication
- **Database**: Prisma ORM with SQLite (dev.db)
- **Existing User Flow**:
  - Users sign up with email or wallet
  - User data syncs to database via `/api/user/sync`
  - Basic user data is stored including wallet addresses and emails

## Proposed Solution

### 1. Database Schema Updates
```prisma
model Referral {
  id          String   @id @default(cuid())
  referrerId  String   // ID of the user who referred
  refereeId   String   @unique // ID of the user who was referred
  referralCode String  // Unique code for sharing
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  rewardsEarned Decimal @default(0) // Optional: track rewards
  
  referrer   User     @relation("Referrer", fields: [referrerId], references: [id])
  referee    User     @relation("Referee", fields: [refereeId], references: [id], onDelete: Cascade)
}

model User {
  // ... existing fields ...
  referralCode     String?   @unique
  referredByCode   String?   // Code used during signup
  referrals        Referral[] @relation("Referrer")
  wasReferredBy    Referral? @relation("Referee")
}
```

### 2. API Endpoints
- `POST /api/referral/generate-code`: Generate unique referral code
- `GET /api/referral/stats`: Get referral statistics
- `GET /api/referral/referrals`: List all referred users
- `POST /api/referral/apply`: Apply a referral code

### 3. Frontend Components

#### Influencer Dashboard
- Total referrals count
- Active users count
- Earnings/rewards summary
- Referral link generator
- Performance graphs

#### Referral Components
- Shareable referral link
- Social sharing buttons
- Referral code input during signup
- Dashboard widget for referrers

### 4. Tracking & Analytics
- Referral link clicks
- Signups from referrals
- First transactions from referrals
- Conversion rates
- UTM parameter tracking
- Cookie-based tracking
- Wallet address tracking

## Implementation Timeline

### Week 1: Core Infrastructure
1. Update database schema
2. Implement referral code generation
3. Create basic API endpoints
4. Add referral tracking to signup flow

### Week 2: Dashboard & UI
1. Build influencer dashboard
2. Create referral sharing components
3. Implement analytics tracking
4. Add admin views for monitoring

### Week 3: Testing & Optimization
1. Test referral flows
2. Optimize performance
3. Add error handling
4. Implement security measures

### Week 4: Launch & Monitor
1. Soft launch to test group
2. Monitor performance
3. Gather feedback
4. Iterate and improve

## Technical Considerations

### Privy Integration
- Use Privy's authentication hooks
- Store Privy user ID in referral relationships
- Handle both wallet and email-based referrals

### Security
- Prevent self-referrals
- Rate limiting on API endpoints
- Input validation

### Performance
- Cache referral stats
- Optimize database queries
- Paginate large datasets

## Next Steps
1. Review and finalize the database schema
2. Begin implementing the core infrastructure
3. Set up tracking for the first phase of implementation

## Notes
- Ensure all user data is handled in compliance with privacy regulations
- Consider implementing rate limiting to prevent abuse
- Plan for database migrations in production
