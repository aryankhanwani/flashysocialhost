"use client";

import { useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";

export default function ProcessingRedirectPage() {
  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    const target = searchParams.get("to");
    if (!target) return;

    const timeout = setTimeout(() => {
      window.location.href = target;
    }, 3000);

    return () => clearTimeout(timeout);
  }, [searchParams, router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="mx-auto mb-6 h-12 w-12 animate-spin rounded-full border-4 border-gray-300 border-t-transparent" />
        <h1 className="text-xl font-semibold">Processing…</h1>
        <p className="mt-2 text-gray-600">Please wait while we redirect you to payment.</p>
      </div>
    </div>
  );
}


