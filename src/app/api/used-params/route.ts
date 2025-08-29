import { NextRequest, NextResponse } from "next/server";
import { getRedisClient } from '@/lib/redis';

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
    const redis = await getRedisClient();
    
    // Get all parameter keys
    const keys = await redis.keys('param:*');
    const now = Date.now();
    
    for (const key of keys) {
      const data = await redis.get(key);
      if (data) {
        const parameter: ParameterData = JSON.parse(data);
        if (now > parameter.expiresAt) {
          await redis.del(key);
        }
      }
    }
  } catch (error) {
    console.error('Failed to cleanup expired parameters:', error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const { fhfh, stripeSessionId, action, paymentCompleted } = await request.json();
    const redis = await getRedisClient();
    
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
      
      // Store in Redis with TTL
      await redis.setEx(`param:${newFhfh}`, 1800, JSON.stringify(parameterData)); // 30 minutes TTL
      
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
      
      const data = await redis.get(`param:${fhfh}`);
      if (!data) {
        return NextResponse.json({ error: "Parameter not found" }, { status: 404 });
      }
      
      const parameter: ParameterData = JSON.parse(data);
      
      // Update the session ID
      parameter.stripeSessionId = stripeSessionId;
      
      // Update in Redis
      await redis.setEx(`param:${fhfh}`, 1800, JSON.stringify(parameter));
      
      return NextResponse.json({ 
        message: "Session ID updated successfully"
      });
    }
    
    if (action === 'complete' || paymentCompleted) {
      // Mark payment as completed and expire the parameter
      if (!fhfh) {
        return NextResponse.json({ error: "Missing fhfh parameter" }, { status: 400 });
      }
      
      const data = await redis.get(`param:${fhfh}`);
      if (!data) {
        return NextResponse.json({ 
          error: "Parameter not found or expired",
          isUsed: false,
          isExpired: true
        }, { status: 404 });
      }
      
      const parameter: ParameterData = JSON.parse(data);
      
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
      
      // Update in Redis with immediate expiration
      await redis.setEx(`param:${fhfh}`, 1, JSON.stringify(parameter)); // 1 second TTL
      
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
      
      const data = await redis.get(`param:${fhfh}`);
      if (!data) {
        return NextResponse.json({ 
          error: "Parameter not found or expired",
          isUsed: false,
          isExpired: true
        }, { status: 404 });
      }
      
      const parameter: ParameterData = JSON.parse(data);
      
      // Expire immediately
      parameter.expiresAt = Date.now();
      
      // Update in Redis with immediate expiration
      await redis.setEx(`param:${fhfh}`, 1, JSON.stringify(parameter)); // 1 second TTL
      
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
    
    const redis = await getRedisClient();
    
    // Clean up expired parameters first
    await cleanupExpiredParameters();
    
    const data = await redis.get(`param:${fhfh}`);
    
    if (!data) {
      return NextResponse.json({ 
        isUsed: false,
        isExpired: true,
        isValid: false,
        message: "Parameter not found or expired"
      });
    }
    
    const parameter: ParameterData = JSON.parse(data);
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
    const redis = await getRedisClient();
    
    if (fhfh) {
      // Remove specific parameter
      const deleted = await redis.del(`param:${fhfh}`);
      
      return NextResponse.json({ 
        message: deleted ? "Parameter reset successfully" : "Parameter not found"
      });
    } else {
      // Clear all parameters
      const keys = await redis.keys('param:*');
      if (keys.length > 0) {
        await redis.del(keys);
      }
      
      return NextResponse.json({ message: "All parameters reset successfully" });
    }
  } catch (error) {
    console.error('DELETE error:', error);
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
