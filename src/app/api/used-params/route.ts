import { NextRequest, NextResponse } from "next/server";
import { kv } from '@vercel/kv';

// Parameter storage with metadata
interface ParameterData {
  stripeSessionId: string;
  createdAt: number;
  expiresAt: number;
  isCompleted: boolean;
}

// Generate unique FHFH parameter
function generateFhfh(): string {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

// Clean up expired parameters
async function cleanupExpiredParameters(): Promise<void> {
  try {
    // Get all parameter keys
    const keys = await kv.keys('param:*');
    const now = Date.now();
    
    for (const key of keys) {
      const data = await kv.get<ParameterData>(key);
      if (data && now > data.expiresAt) {
        await kv.del(key);
      }
    }
  } catch (error) {
    console.error('Failed to cleanup expired parameters:', error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const { fhfh, stripeSessionId, action, paymentCompleted } = await request.json();
    
    // Clean up expired parameters first
    await cleanupExpiredParameters();
    
    if (action === 'create') {
      // Create new parameter for Stripe session
      if (!stripeSessionId) {
        return NextResponse.json({ error: "Missing stripeSessionId" }, { status: 400 });
      }
      
      // Generate unique FHFH parameter
      const newFhfh = generateFhfh();
      const now = Date.now();
      const expiresAt = now + (30 * 60 * 1000); // 30 minutes expiration
      
      const parameterData: ParameterData = {
        stripeSessionId,
        createdAt: now,
        expiresAt,
        isCompleted: false
      };
      
      // Store in KV with TTL
      await kv.set(`param:${newFhfh}`, parameterData, { ex: 1800 }); // 30 minutes TTL
      
      return NextResponse.json({ 
        fhfh: newFhfh,
        expiresAt: new Date(expiresAt).toISOString(),
        message: "Parameter created successfully"
      });
    }
    
    if (action === 'update_session') {
      // Update parameter with actual Stripe session ID
      if (!fhfh || !stripeSessionId) {
        return NextResponse.json({ error: "Missing fhfh or stripeSessionId" }, { status: 400 });
      }
      
      const parameter = await kv.get<ParameterData>(`param:${fhfh}`);
      
      if (!parameter) {
        return NextResponse.json({ error: "Parameter not found" }, { status: 404 });
      }
      
      // Update the session ID
      parameter.stripeSessionId = stripeSessionId;
      
      // Update in KV
      await kv.set(`param:${fhfh}`, parameter, { ex: 1800 });
      
      return NextResponse.json({ 
        message: "Session ID updated successfully"
      });
    }
    
    if (action === 'complete' || paymentCompleted) {
      // Mark payment as completed and expire the parameter
      if (!fhfh) {
        return NextResponse.json({ error: "Missing fhfh parameter" }, { status: 400 });
      }
      
      const parameter = await kv.get<ParameterData>(`param:${fhfh}`);
      
      if (!parameter) {
        return NextResponse.json({ 
          error: "Parameter not found or expired",
          isUsed: false,
          isExpired: true
        }, { status: 404 });
      }
      
      if (parameter.isCompleted) {
        return NextResponse.json({ 
          error: "Payment already completed",
          isUsed: true,
          isExpired: false
        }, { status: 409 });
      }
      
      if (Date.now() > parameter.expiresAt) {
        return NextResponse.json({ 
          error: "Parameter expired",
          isUsed: false,
          isExpired: true
        }, { status: 410 });
      }
      
      // Mark as completed AND expire immediately
      parameter.isCompleted = true;
      parameter.expiresAt = Date.now(); // Expire immediately
      
      // Update in KV with immediate expiration
      await kv.set(`param:${fhfh}`, parameter, { ex: 1 }); // 1 second TTL
      
      return NextResponse.json({ 
        isUsed: false,
        isExpired: false,
        message: "Payment completed successfully"
      });
    }
    
    if (action === 'expire') {
      // Expire parameter immediately (for cancel page)
      if (!fhfh) {
        return NextResponse.json({ error: "Missing fhfh parameter" }, { status: 400 });
      }
      
      const parameter = await kv.get<ParameterData>(`param:${fhfh}`);
      
      if (!parameter) {
        return NextResponse.json({ 
          error: "Parameter not found or expired",
          isUsed: false,
          isExpired: true
        }, { status: 404 });
      }
      
      // Expire immediately
      parameter.expiresAt = Date.now();
      
      // Update in KV with immediate expiration
      await kv.set(`param:${fhfh}`, parameter, { ex: 1 }); // 1 second TTL
      
      return NextResponse.json({ 
        message: "Parameter expired successfully"
      });
    }
    
    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error('POST error:', error);
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const fhfh = searchParams.get("fhfh");
    
    if (!fhfh) {
      return NextResponse.json({ error: "Missing fhfh parameter" }, { status: 400 });
    }
    
    // Clean up expired parameters first
    await cleanupExpiredParameters();
    
    const parameter = await kv.get<ParameterData>(`param:${fhfh}`);
    
    if (!parameter) {
      return NextResponse.json({ 
        isUsed: false,
        isExpired: true,
        isValid: false,
        message: "Parameter not found or expired"
      });
    }
    
    const now = Date.now();
    const isExpired = now > parameter.expiresAt;
    
    return NextResponse.json({
      isUsed: parameter.isCompleted,
      isExpired,
      isValid: !isExpired && !parameter.isCompleted,
      stripeSessionId: parameter.stripeSessionId,
      createdAt: new Date(parameter.createdAt).toISOString(),
      expiresAt: new Date(parameter.expiresAt).toISOString(),
      timeRemaining: Math.max(0, parameter.expiresAt - now)
    });
  } catch (error) {
    console.error('GET error:', error);
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const fhfh = searchParams.get("fhfh");
    
    if (fhfh) {
      // Remove specific parameter
      const deleted = await kv.del(`param:${fhfh}`);
      
      return NextResponse.json({ 
        message: deleted ? "Parameter reset successfully" : "Parameter not found"
      });
    } else {
      // Clear all parameters
      const keys = await kv.keys('param:*');
      if (keys.length > 0) {
        await kv.del(...keys);
      }
      
      return NextResponse.json({ message: "All parameters reset successfully" });
    }
  } catch (error) {
    console.error('DELETE error:', error);
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
