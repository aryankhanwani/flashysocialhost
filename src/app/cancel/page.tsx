"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

export default function CancelPage() {
  const searchParams = useSearchParams();
  const [isRedirecting, setIsRedirecting] = useState(false);

  useEffect(() => {
    const fhfh = searchParams.get("fhfh");
    
    // Expire the parameter immediately when cancel page is visited
    const expireParameter = async () => {
      if (fhfh) {
        try {
          await fetch('/api/used-params', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              fhfh, 
              action: 'expire'
            })
          });
        } catch (error) {
          console.error('Failed to expire parameter:', error);
        }
      }
    };

    expireParameter();
    
    // Don't redirect to main site - just show the cancellation message
    // The user can manually go back to the main site if they want
    const timeout = setTimeout(() => {
      setIsRedirecting(true);
    }, 3000);

    return () => clearTimeout(timeout);
  }, [searchParams]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="mx-auto mb-6 h-12 w-12 text-red-500">
          <svg fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
        </div>
        <h1 className="text-xl font-semibold text-red-600">Payment Cancelled</h1>
        <p className="mt-2 text-gray-600">
          {isRedirecting 
            ? "Payment was cancelled." 
            : "Your payment was cancelled."
          }
        </p>
        {isRedirecting && (
          <button 
            onClick={() => window.location.href = 'https://flashysocialhosts.com/'}
            className="mt-4 px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            Return to Main Site
          </button>
        )}
        {!isRedirecting && (
          <div className="mt-4">
            <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-transparent" />
          </div>
        )}
      </div>
    </div>
  );
}
