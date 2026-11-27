import { Compass } from "lucide-react";
import { LinkButton } from "@/components/ui/Button";

export default function NotFound() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center px-6 text-center">
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl border border-line bg-surface text-ink-2">
        <Compass className="h-5 w-5" />
      </div>
      <h1 className="text-lg font-semibold text-ink">Page not found</h1>
      <p className="mt-1 max-w-sm text-sm text-ink-2">The page you&apos;re looking for doesn&apos;t exist or has moved.</p>
      <LinkButton href="/" variant="primary" className="mt-5">
        Back to home
      </LinkButton>
    </div>
  );
}
