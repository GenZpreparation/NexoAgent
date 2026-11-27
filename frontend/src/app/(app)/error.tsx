"use client";

import { AlertTriangle, RotateCw } from "lucide-react";
import { Button, LinkButton } from "@/components/ui/Button";

/** Catches unexpected render errors in any app page. Details are never shown to users. */
export default function AppError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="card flex flex-col items-center px-6 py-16 text-center">
      <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-danger-soft text-danger">
        <AlertTriangle className="h-5 w-5" />
      </div>
      <h1 className="text-base font-semibold text-ink">This page ran into a problem</h1>
      <p className="mt-1 max-w-sm text-[13px] text-ink-2">Something unexpected happened while showing this page. Try again, or head back home.</p>
      <div className="mt-5 flex gap-2">
        <Button onClick={reset} icon={<RotateCw className="h-4 w-4" />}>Try again</Button>
        <LinkButton href="/" variant="primary">Go home</LinkButton>
      </div>
    </div>
  );
}
