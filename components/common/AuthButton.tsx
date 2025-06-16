// components/common/AuthButton.tsx
'use client';

import { Button } from '@/components/ui/button';
import { useWalletAuth } from '@/context/appkit';
import { Loader2, Shield, ShieldCheck, Lock } from 'lucide-react';
import { cn } from '@/lib/utils';

export function AuthButton() {
  const {
    isConnected,
    isAuthenticated,
    isAuthenticating,
    authenticate
  } = useWalletAuth();

  if (!isConnected) {
    return null;
  }

  return (
    <Button
      onClick={authenticate}
      disabled={isAuthenticating || isAuthenticated}
      size="sm"
      className={cn(
        "ml-2 transition-all duration-200 font-medium",
        isAuthenticated 
          ? "bg-green-600 hover:bg-green-700 text-white shadow-md" 
          : "border-orange-200 hover:border-orange-300 hover:bg-orange-50",
        isAuthenticating && "cursor-not-allowed opacity-70"
      )}
      variant={isAuthenticated ? "default" : "outline"}
    >
      {isAuthenticating ? (
        <div className="flex items-center gap-1.5">
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
          <span className="text-xs">Verifying</span>
        </div>
      ) : isAuthenticated ? (
        <div className="flex items-center gap-1.5">
          <ShieldCheck className="h-3.5 w-3.5" />
          {/* <span className="text-xs font-semibold">Secure</span> */}
        </div>
      ) : (
        <div className="flex items-center gap-1.5">
          <Lock className="h-3.5 w-3.5" />
          <span className="text-xs">Verify</span>
        </div>
      )}
    </Button>
  );
}