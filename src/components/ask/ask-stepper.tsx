"use client";

import { useState } from "react";
import { Check, Loader2, AlertCircle, Circle, ChevronDown, ChevronUp } from "lucide-react";
import type { AskStep } from "@/types/ask";

interface AskStepperProps {
  steps: AskStep[];
  collapsible?: boolean;
}

const STATUS_ICON: Record<AskStep["status"], React.ReactNode> = {
  pending: <Circle className="h-4 w-4 text-muted-foreground/30" />,
  active: <Loader2 className="h-4 w-4 text-blue-600 animate-spin" />,
  done: <Check className="h-4 w-4 text-green-600" />,
  error: <AlertCircle className="h-4 w-4 text-destructive" />,
};

export function AskStepper({ steps, collapsible = false }: AskStepperProps) {
  const [collapsed, setCollapsed] = useState(false);

  if (steps.length === 0) return null;

  return (
    <div className="space-y-1 rounded-lg border border-border bg-muted/30 p-3" aria-live="polite" aria-label="Progression du pipeline">
      {collapsible && (
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors mb-1"
        >
          {collapsed ? <ChevronDown className="h-3 w-3" /> : <ChevronUp className="h-3 w-3" />}
          {collapsed ? "Voir le détail du pipeline" : "Masquer le détail"}
        </button>
      )}

      {!collapsed &&
        steps.map((step) => (
          <div key={step.id} className="flex items-start gap-2.5 py-0.5">
            <div className="mt-0.5 shrink-0">{STATUS_ICON[step.status]}</div>
            <div className="min-w-0 flex-1">
              <p
                className={`text-sm ${
                  step.status === "active"
                    ? "text-foreground font-medium"
                    : step.status === "done"
                      ? "text-muted-foreground"
                      : step.status === "error"
                        ? "text-destructive"
                        : "text-muted-foreground/40"
                }`}
              >
                {step.label}
              </p>
              {step.detail && step.status !== "pending" && (
                <p className="text-xs text-muted-foreground/60 mt-0.5 truncate">{step.detail}</p>
              )}
            </div>
          </div>
        ))}
    </div>
  );
}
