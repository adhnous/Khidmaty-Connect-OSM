"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getClientLocale, tr } from "@/lib/i18n";
import { useAuth } from "@/hooks/use-auth";
import { sendVerificationEmail, reloadCurrentUser } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

export default function VerifyPage() {
  const locale = getClientLocale();
  const { user, userProfile } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const [sending, setSending] = useState(false);
  const [checking, setChecking] = useState(false);

  const onResend = async () => {
    try {
      if (!user) {
        router.push("/login");
        return;
      }
      setSending(true);
      await sendVerificationEmail(user);
      toast({
        title: tr(locale, "login.toasts.verifyEmailSentTitle"),
        description: tr(locale, "login.toasts.verifyEmailSentDesc"),
      });
    } catch (e: any) {
      toast({ variant: "destructive", title: "Error", description: e?.message });
    } finally {
      setSending(false);
    }
  };

  const onRefresh = async () => {
    try {
      setChecking(true);
      await reloadCurrentUser();
      if (user?.emailVerified) {
        toast({
          title: tr(locale, "verify.verifiedTitle"),
          description: tr(locale, "verify.verifiedDesc"),
        });
        if (userProfile?.role === "provider") router.replace("/dashboard");
        else router.replace("/");
        return;
      }
      toast({
        variant: "destructive",
        title: tr(locale, "verify.notVerifiedTitle"),
        description: tr(locale, "verify.notVerifiedDesc"),
      });
    } catch (e: any) {
      toast({ variant: "destructive", title: "Error", description: e?.message });
    } finally {
      setChecking(false);
    }
  };

  return (
    <div className="container py-10">
      <Card className="mx-auto max-w-xl">
        <CardHeader>
          <CardTitle>{tr(locale, "verify.title")}</CardTitle>
          <CardDescription>
            {tr(locale, "verify.description")}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {user ? (
            <p className="text-sm text-muted-foreground">
              {user.email}
            </p>
          ) : (
            <p className="text-sm text-muted-foreground">
              <Link href="/login" className="underline">
                Login
              </Link>
            </p>
          )}
          <div className="flex flex-wrap gap-3">
            <Button onClick={onResend} disabled={sending || !user} variant="secondary">
              {sending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {tr(locale, "verify.resend")}
            </Button>
            <Button onClick={onRefresh} disabled={checking || !user}>
              {checking && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {tr(locale, "verify.check")}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
