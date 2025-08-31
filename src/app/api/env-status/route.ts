import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    return NextResponse.json({
      status: 'success',
      environment: {
        nodeEnv: process.env.NODE_ENV,
        cloakingAuthTokenExists: !!process.env.CLOAKING_AUTH_TOKEN,
        cloakingAuthTokenLength: process.env.CLOAKING_AUTH_TOKEN?.length || 0,
        stripeSecretKeyExists: !!process.env.STRIPE_SECRET_KEY,
        stripeSecretKeyLength: process.env.STRIPE_SECRET_KEY?.length || 0,
        allEnvVars: Object.keys(process.env).filter(key => 
          key.includes('CLOAKING') || key.includes('STRIPE')
        )
      }
    });
  } catch (error) {
    return NextResponse.json({
      status: 'error',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
