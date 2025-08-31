import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-06-20",
});
let ah = ''
// Simple authentication
function authenticateRequest(request: NextRequest): boolean {
  const authHeader = request.headers.get('Authorization');
  const expectedToken = process.env.CLOAKING_AUTH_TOKEN || 'your-auth-token';
  ah = authHeader
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    return token === expectedToken;
  }
  
  return false;
}

// Basic validation - just check required fields
function validateRequest(data: any): any {
  if (!data.customer_email || !data.line_items || !data.mode) {
    throw new Error("Missing required fields");
  }
  return data;
}

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    if (!authenticateRequest(request)) {
      return NextResponse.json(
        { error: `Unauthorized access ${ah}, ` },
        { status: 401 }
      );
    }

    // Parse and validate request
    const body = await request.json();
    const validatedData = validateRequest(body);

    // Create FHFH parameter
    const parameterResponse = await fetch(`${request.nextUrl?.origin}/api/used-params`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'create',
        stripeSessionId: 'temp_' + Date.now()
      })
    });

    if (!parameterResponse.ok) {
      throw new Error('Failed to create parameter');
    }

    const parameterData = await parameterResponse.json();
    const fhfh = parameterData.fhfh;

    // Create Stripe session with cloaking URLs
    const origin = request.nextUrl?.origin ?? `${request.headers.get('x-forwarded-proto') ?? 'https'}://${request.headers.get('host') ?? ''}`;
    const successUrl = `${origin}/thankyou?fhfh=${fhfh}`;
    const cancelUrl = `${origin}/cancel?fhfh=${fhfh}`;

    const sessionData = {
      ...validatedData,
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: {
        ...validatedData.metadata,
        fhfh: fhfh
      }
    };

    const session = await stripe.checkout.sessions.create(sessionData);

    // Create cloaking URL
    const cloakingUrl = `${origin}/loading?fhfh=${fhfh}&stripe_url=${encodeURIComponent(session.url || '')}`;

    return NextResponse.json({
      ...session,
      url: cloakingUrl
    }, { status: 201 });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json(
      { error: "Failed to create payment session" },
      { status: 500 }
    );
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization, X-API-Key",
    },
  });
}
