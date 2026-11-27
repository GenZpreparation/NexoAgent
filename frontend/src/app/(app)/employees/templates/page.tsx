"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PenLine } from "lucide-react";
import { cn } from "@/lib/utils";
import { PageHeader } from "@/components/ui/Misc";
import { LinkButton } from "@/components/ui/Button";
import { TEMPLATES } from "@/features/employees/templates";
import { TemplateCard } from "@/features/employees/TemplateCard";

export default function TemplatesPage() {
  const router = useRouter();
  const categories = ["All", ...TEMPLATES.map((t) => t.category)];
  const [category, setCategory] = useState("All");
  const shown = category === "All" ? TEMPLATES : TEMPLATES.filter((t) => t.category === category);

  return (
    <>
      <PageHeader
        title="AI employee templates"
        description="Start from a proven setup for your industry. Everything is editable in the next step."
        actions={
          <LinkButton href="/employees/new" icon={<PenLine className="h-4 w-4" />}>
            Start from scratch
          </LinkButton>
        }
      />
      <div className="scrollbar-thin -mx-1 mb-5 flex gap-1.5 overflow-x-auto px-1 pb-1" role="tablist" aria-label="Industry">
        {categories.map((c) => (
          <button
            key={c}
            type="button"
            role="tab"
            aria-selected={c === category}
            onClick={() => setCategory(c)}
            className={cn(
              "h-8 shrink-0 rounded-full border px-3 text-[13px] font-medium transition-colors",
              c === category ? "border-ink bg-ink text-canvas" : "border-line bg-surface text-ink-2 hover:border-line-strong hover:text-ink",
            )}
          >
            {c}
          </button>
        ))}
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {shown.map((t) => (
          <TemplateCard key={t.id} template={t} onSelect={() => router.push(`/employees/new?template=${t.id}`)} />
        ))}
      </div>
    </>
  );
}
