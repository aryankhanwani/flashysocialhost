# Cloaking Flow Implementation

## Overview
This cloaking project implements a payment flow that hides the actual destination from Stripe while ensuring users end up on the main site.

## Flow Description

1. **Main Project (localhost:3000)** → User initiates payment
2. **Cloaking Project (localhost:3001)** → Receives payment request via API
3. **Cloaking Project** → Creates unique FHFH parameter and Stripe session with cloaking URLs
4. **Stripe** → Payment processing (sees cloaking domain)
5. **Cloaking Project Thankyou Page** → Validates parameter and one-time redirect to main site
6. **Main Project** → User lands on dashboard

## Key Features

### One-Time Redirect Protection
- Each unique `fhfh` parameter can only redirect once
- Subsequent visits to the same thankyou URL show "Already Processed" message
- Uses in-memory storage (can be upgraded to database for production)

### URL Structure
- **Loading Page**: `localhost:3001/loading?fhfh=1294&stripe_url=...`
- **Thankyou Page**: `localhost:3001/thankyou?fhfh=1294`
- **Cancel Page**: `localhost:3001/cancel?fhfh=1294`

## API Endpoints

### `/api/stripe/create-session`
- Creates Stripe checkout session
- Generates unique `fhfh` parameter
- Returns cloaking URL instead of direct Stripe URL

### `/api/used-params`
- **GET**: Check parameter status (valid, expired, used)
- **POST action='create'**: Create new parameter for Stripe session
- **POST action='update_session'**: Update parameter with actual Stripe session ID
- **POST action='complete'**: Mark payment as completed
- **DELETE**: Reset parameters

## Pages

### `/loading`
- Accepts `fhfh` and `stripe_url` parameters
- Shows loading animation
- Redirects to actual Stripe checkout

### `/thankyou`
- Accepts `fhfh` parameter
- Checks if parameter already used
- Redirects to main site only once per parameter
- Shows appropriate status messages

### `/cancel`
- Handles payment cancellations
- Redirects to main site after delay



## Environment Variables

```env
STRIPE_SECRET_KEY=your_stripe_secret_key
CLOAKING_AUTH_TOKEN=your_auth_token_min_32_chars
NODE_ENV=development
```

## Usage

1. Start both projects:
   ```bash
   # Main project
   cd flashy-master && npm run dev
   
   # Cloaking project  
   cd cloaking-project && npm run dev
   ```

2. The cloaking flow will automatically handle payment redirections

## Security Notes

- Uses authentication token for API access
- In-memory storage for used parameters (upgrade to database for production)
- Random parameter generation for each session
- Proper error handling and validation
