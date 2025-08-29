"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

export default function LoadingPage() {
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fhfh = searchParams.get("fhfh");
    
    if (!fhfh) {
      setError("Missing required parameter");
      setIsLoading(false);
      return;
    }

        // Check if parameter is still valid before proceeding
    const checkParameter = async () => {
      try {
        const response = await fetch(`/api/used-params?fhfh=${fhfh}`);
        const data = await response.json();
        
        if (!data.isValid) {
          setError('This payment link has expired or is invalid');
          setIsLoading(false);
          return;
        }
        
        // Get the Stripe session URL from the current URL
        const urlParams = new URLSearchParams(window.location.search);
        const stripeUrl = urlParams.get('stripe_url');
        
        if (!stripeUrl) {
          setError('Missing Stripe URL');
          setIsLoading(false);
          return;
        }
        
        // Simulate a delay then redirect to Stripe
        setTimeout(() => {
          window.location.href = stripeUrl;
        }, 2000);
      } catch (error) {
        setError('Failed to validate payment link');
        setIsLoading(false);
      }
    };
    
    checkParameter();
  }, [searchParams]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-xl font-semibold text-red-600">Error</h1>
          <p className="mt-2 text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="mx-auto mb-6 h-12 w-12 animate-spin rounded-full border-4 border-gray-300 border-t-transparent" />
        <h1 className="text-xl font-semibold">Redirecting to Payment...</h1>
        <p className="mt-2 text-gray-600">Please wait while we redirect you to the payment gateway.</p>
      </div>
    </div>
  );
}
