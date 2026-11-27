"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { HireWizard } from "@/features/employees/wizard/Wizard";

export default function HirePage() {
  return (
    <Suspense>
      <HirePageInner />
    </Suspense>
  );
}

function HirePageInner() {
  const params = useSearchParams();
  const template = params.get("template");
  // key resets the wizard when arriving with a different template
  return <HireWizard key={template ?? "blank"} initialTemplate={template} />;
}
