"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

export default function ThankYouPage() {
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'redirecting' | 'already-used' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const fhfh = searchParams.get("fhfh");
    
    if (!fhfh) {
      setStatus('error');
      setMessage('Missing required parameter');
      return;
    }

    const checkAndRedirect = async () => {
      try {
        // Check if parameter is valid and not used
        const checkResponse = await fetch(`/api/used-params?fhfh=${fhfh}`);
        const checkData = await checkResponse.json();
        if (!checkData.isValid) {
          if (checkData.isUsed) {
            // Parameter already used
            setStatus('already-used');
            setMessage('This payment link has already been processed.');
          } else if (checkData.isExpired) {
            // Parameter expired or not found
            setStatus('error');
            setMessage('This payment link has expired or is invalid.');
          } else {
            setStatus('error');
            setMessage('Invalid payment link.');
          }
          return;
        }

        // Mark payment as completed and expire the parameter
        const markResponse = await fetch('/api/used-params', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            fhfh, 
            action: 'complete'
          })
        });

        if (!markResponse.ok) {
          const errorData = await markResponse.json();
          if (errorData.error === "Parameter not found or expired") {
            setStatus('error');
            setMessage('This payment link has expired.');
            return;
          }
          throw new Error('Failed to process payment completion');
        }

        // Redirect to main site
        setStatus('redirecting');
        setMessage('Payment successful! Redirecting to main site...');
        
        // Redirect to localhost:3000 (main project)
        setTimeout(() => {
          window.location.href = `https://flashysocial.vercel.app//dashboard?order_result=completed&fhfh=${fhfh}`;
        }, 2000);

      } catch (error) {
        setStatus('error');
        setMessage('An error occurred while processing your payment.');
        console.error('Error:', error);
      }
    };

    checkAndRedirect();
  }, [searchParams]);

  const getStatusContent = () => {
    switch (status) {
      case 'loading':
        return (
          <div className="text-center">
            <div className="mx-auto mb-6 h-12 w-12 animate-spin rounded-full border-4 border-gray-300 border-t-transparent" />
            <h1 className="text-xl font-semibold">Processing Payment...</h1>
            <p className="mt-2 text-gray-600">Please wait while we verify your payment.</p>
          </div>
        );
      
      case 'redirecting':
        return (
          <div className="text-center">
            <div className="mx-auto mb-6 h-12 w-12 text-green-500">
              <svg fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            </div>
            <h1 className="text-xl font-semibold text-green-600">Payment Successful!</h1>
            <p className="mt-2 text-gray-600">{message}</p>
          </div>
        );
      
      case 'already-used':
        return (
          <div className="text-center">
            <div className="mx-auto mb-6 h-12 w-12 text-yellow-500">
              <svg fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <h1 className="text-xl font-semibold text-yellow-600">Already Processed</h1>
            <p className="mt-2 text-gray-600">{message}</p>
            <button 
              onClick={() => window.location.href = 'http://flashysocialhost.vercel.app'}
              className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Go to Main Site
            </button>
          </div>
        );
      
      case 'error':
        return (
          <div className="text-center">
            <div className="mx-auto mb-6 h-12 w-12 text-red-500">
              <svg fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <h1 className="text-xl font-semibold text-red-600">Error</h1>
            <p className="mt-2 text-gray-600">{message}</p>
            <button 
              onClick={() => window.location.href = 'http://flashysocialhost.vercel.app'}
              className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Go to Main Site
            </button>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center">
      {getStatusContent()}
    </div>
  );
}
