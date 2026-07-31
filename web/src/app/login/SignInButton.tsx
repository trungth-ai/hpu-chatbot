"use client";

import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { GoogleIcon } from "@/components/GoogleIcon";

export function SignInButton() {
  return (
    <Button
      variant="outline"
      size="lg"
      className="w-full shadow-sm"
      onClick={() => signIn("google", { callbackUrl: "/" })}
    >
      <GoogleIcon className="h-5 w-5" />
      Đăng nhập với Google
    </Button>
  );
}
