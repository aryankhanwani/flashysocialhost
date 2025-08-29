import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from 'fs';
import path from 'path';

// Parameter storage with metadata
interface ParameterData {
  stripeSessionId: string;
  createdAt: number;
  expiresAt: number;
  isCompleted: boolean;
}

// File-based storage for parameters (persists across server restarts)
const STORAGE_FILE = path.join(process.cwd(), 'parameters.json');

// Load parameters from file
async function loadParameters(): Promise<Map<string, ParameterData>> {
  try {
    const data = await fs.readFile(STORAGE_FILE, 'utf8');
    const params = JSON.parse(data);
    return new Map(Object.entries(params));
  } catch (error) {
    // File doesn't exist or is invalid, start with empty map
    return new Map();
  }
}

// Save parameters to file
async function saveParameters(parameters: Map<string, ParameterData>): Promise<void> {
  try {
    const data = Object.fromEntries(parameters);
    await fs.writeFile(STORAGE_FILE, JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('Failed to save parameters:', error);
  }
}

// Generate unique FHFH parameter
function generateFhfh(): string {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

// Clean up expired parameters
async function cleanupExpiredParameters(parameters: Map<string, ParameterData>): Promise<void> {
  const now = Date.now();
  let cleanedCount = 0;
  
  parameters.forEach((data, fhfh) => {
    if (now > data.expiresAt) {
      parameters.delete(fhfh);
      cleanedCount++;
    }
  });
  
  if (cleanedCount > 0) {
    await saveParameters(parameters);
  }
}

export async function POST(request: NextRequest) {
  try {
    const { fhfh, stripeSessionId, action, paymentCompleted } = await request.json();
    
    // Load parameters from file
    const parameters = await loadParameters();
    
    // Clean up expired parameters first
    await cleanupExpiredParameters(parameters);
    
    if (action === 'create') {
      // Create new parameter for Stripe session
      if (!stripeSessionId) {
        return NextResponse.json({ error: "Missing stripeSessionId" }, { status: 400 });
      }
      
      // Generate unique FHFH parameter
      const newFhfh = generateFhfh();
      const now = Date.now();
      const expiresAt = now + (30 * 60 * 1000); // 30 minutes expiration
      
      parameters.set(newFhfh, {
        stripeSessionId,
        createdAt: now,
        expiresAt,
        isCompleted: false
      });
      
      // Save to file
      await saveParameters(parameters);
      
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
      
      const parameter = parameters.get(fhfh);
      
      if (!parameter) {
        return NextResponse.json({ error: "Parameter not found" }, { status: 404 });
      }
      
      // Update the session ID
      parameter.stripeSessionId = stripeSessionId;
      
      // Save to file
      await saveParameters(parameters);
      
      return NextResponse.json({ 
        message: "Session ID updated successfully"
      });
    }
    
    if (action === 'complete' || paymentCompleted) {
      // Mark payment as completed and expire the parameter
      if (!fhfh) {
        return NextResponse.json({ error: "Missing fhfh parameter" }, { status: 400 });
      }
      
      const parameter = parameters.get(fhfh);
      
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
      
      // Save to file
      await saveParameters(parameters);
      
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
      
      const parameter = parameters.get(fhfh);
      
      if (!parameter) {
        return NextResponse.json({ 
          error: "Parameter not found or expired",
          isUsed: false,
          isExpired: true
        }, { status: 404 });
      }
      
      // Expire immediately
      parameter.expiresAt = Date.now();
      
      // Save to file
      await saveParameters(parameters);
      
      return NextResponse.json({ 
        message: "Parameter expired successfully"
      });
    }
    
    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
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
    
    // Load parameters from file
    const parameters = await loadParameters();
    
    // Clean up expired parameters first
    await cleanupExpiredParameters(parameters);
    
    const parameter = parameters.get(fhfh);
    
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
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const fhfh = searchParams.get("fhfh");
    
    // Load parameters from file
    const parameters = await loadParameters();
    
    if (fhfh) {
      // Remove specific parameter
      const deleted = parameters.delete(fhfh);
      
      // Save to file
      await saveParameters(parameters);
      
      return NextResponse.json({ 
        message: deleted ? "Parameter reset successfully" : "Parameter not found"
      });
    } else {
      // Clear all parameters
      parameters.clear();
      
      // Save to file
      await saveParameters(parameters);
      
      return NextResponse.json({ message: "All parameters reset successfully" });
    }
  } catch (error) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
