# Payment Gateway

Secure payment processing service running on port 3001.

## Setup

1. Install dependencies: `npm install`
2. Add your Stripe secret key to `.env.local`
3. Run: `npm run dev`

## Environment Variables

```
STRIPE_SECRET_KEY=your_stripe_secret_key
CLOAKING_AUTH_TOKEN=your_auth_token
NODE_ENV=development
```
