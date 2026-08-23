"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAppStore } from "@/lib/store";

export function RoleGuard({ 
  children, 
  roles, 
  redirectTo = "/auth/login" 
}: { 
  children: React.ReactNode; 
  roles: string[]; 
  redirectTo?: string;
}) {
  const currentUser = useAppStore((state) => state.currentUser);
  const router = useRouter();

  const userRole = (currentUser?.role || "learner").toLowerCase();
  const normalizedRoles = roles.map((r) => r.toLowerCase());

  useEffect(() => {
    if (!currentUser) {
      router.replace(redirectTo);
      return;
    }
    if (!normalizedRoles.includes(userRole)) {
      router.replace("/dashboard");
    }
  }, [currentUser, userRole, normalizedRoles, redirectTo, router]);

  if (!currentUser) return null;
  if (!normalizedRoles.includes(userRole)) return null;

  return <>{children}</>;
}

