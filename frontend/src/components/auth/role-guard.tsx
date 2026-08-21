"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAppStore } from "@/lib/store";

export function RoleGuard({ children, roles, redirectTo = "/auth/login" }: { children: React.ReactNode; roles: string[]; redirectTo?: string }) {
  const currentUser = useAppStore((state) => state.currentUser);
  const router = useRouter();

  useEffect(() => {
    if (!currentUser) {
      router.replace(redirectTo);
      return;
    }
    if (!roles.includes(currentUser.role)) {
      router.replace("/dashboard");
    }
  }, [currentUser, roles, redirectTo, router]);

  if (!currentUser || !roles.includes(currentUser.role)) return null;
  return <>{children}</>;
}
