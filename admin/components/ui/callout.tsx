import * as React from "react";

import { X } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import {
  getCalloutVariant,
  type CalloutSize,
  type CalloutTone,
  type CalloutVariant,
} from "@/components/ui/callout-registry";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

type CalloutAction = {
  label: string;
  href?: string;
  onClick?: () => void;
};

export interface CalloutProps {
  variant: CalloutVariant;
  subject?: string;
  message?: string;
  description?: React.ReactNode;
  size?: CalloutSize;
  tone?: CalloutTone;
  action?: CalloutAction;
  secondaryAction?: CalloutAction;
  dismissible?: boolean;
  disabled?: boolean;
  loading?: boolean;
  id?: string;
  className?: string;
  /** Rich description passed as children (e.g. from MDX/Astro slots). */
  children?: React.ReactNode;
}

// All geometry comes from --callout-* tokens (src/styles/global.css), which
// derive from the Button/--radius/--spacing tokens: md = CTA height (h-10).
const SIZE = {
  sm: {
    box: "rounded-[var(--callout-radius-sm)]",
    pad: "px-[var(--callout-padding-sm-x)] py-[var(--callout-padding-sm-y)]",
    gap: "gap-[var(--callout-gap-sm)]",
    glyph: "size-[var(--callout-glyph-sm)]",
    minH: "min-h-[calc(var(--callout-height-sm)-2*var(--callout-padding-sm-y)-2*var(--callout-border-width))]",
    headline: "text-sm/5",
  },
  md: {
    box: "rounded-[var(--callout-radius-md)]",
    pad: "px-[var(--callout-padding-md-x)] py-[var(--callout-padding-md-y)]",
    gap: "gap-[var(--callout-gap-md)]",
    glyph: "size-[var(--callout-glyph-md)]",
    minH: "min-h-[calc(var(--callout-height-md)-2*var(--callout-padding-md-y)-2*var(--callout-border-width))]",
    headline: "text-base/6",
  },
  lg: {
    box: "rounded-[var(--callout-radius-lg)]",
    pad: "px-[var(--callout-padding-lg-x)] py-[var(--callout-padding-lg-y)]",
    gap: "gap-[var(--callout-gap-lg)]",
    glyph: "size-[var(--callout-glyph-lg)]",
    minH: "min-h-[calc(var(--callout-height-lg)-2*var(--callout-padding-lg-y)-2*var(--callout-border-width))]",
    headline: "text-lg/7",
  },
} as const;

// Full anatomy (header / body / footer) tokens — Material X reference, v1.2.
const FULL_TITLE = {
  sm: "text-base/6",
  md: "text-lg/7 md:text-xl/7",
  lg: "text-xl/7 md:text-2xl/8",
} as const;

function ActionButtons({
  actions,
  disabled,
}: {
  actions: CalloutAction[];
  disabled: boolean;
}) {
  // Primary is rendered last (right-most), as in the reference.
  const ordered = actions.map((a, i) => ({ a, primary: i === 0 })).reverse();
  return (
    <>
      {ordered.map(({ a, primary }) => {
        const cls = cn(
          buttonVariants({ variant: primary ? "default" : "outline" }),
          primary &&
            "bg-[var(--callout-action-surface)] text-[var(--callout-action-text)] hover:bg-[var(--callout-action-surface)] hover:opacity-90",
        );
        return a.href && !disabled ? (
          <a key={a.label} href={a.href} className={cls}>
            {a.label}
          </a>
        ) : (
          <button
            key={a.label}
            type="button"
            className={cls}
            onClick={a.onClick}
            disabled={disabled}
          >
            {a.label}
          </button>
        );
      })}
    </>
  );
}

function Callout({
  variant,
  subject,
  message,
  description,
  size = "md",
  tone = "outline",
  action,
  secondaryAction,
  dismissible = false,
  disabled = false,
  loading = false,
  id,
  className,
  children,
}: CalloutProps) {
  description ??= children;
  const [dismissed, setDismissed] = React.useState(false);
  const entry = getCalloutVariant(variant);
  const Icon = entry.icon;
  const text = message ?? entry.label;
  const s = SIZE[size];

  if (dismissed) return null;
  if (!subject && !text && !description) return null;

  const tinted = tone === "tinted";
  const actions = [action, secondaryAction].filter(Boolean) as CalloutAction[];
  // Compact bar when there is only a headline; full anatomy otherwise.
  const full = Boolean(description || actions.length > 0 || loading);

  const dismiss = dismissible && (
    <button
      type="button"
      aria-label="Fechar aviso"
      onClick={() => setDismissed(true)}
      className={cn(
        buttonVariants({ variant: "ghost", size: "icon-sm" }),
        "shrink-0 text-[var(--callout-heading)] transition-colors duration-[var(--callout-motion-fast)] ease-[var(--callout-easing)] hover:bg-black/5 focus-visible:outline-[length:var(--callout-focus-width)] focus-visible:outline-offset-[var(--callout-focus-offset)] focus-visible:outline-current dark:hover:bg-white/10",
      )}
    >
      <X aria-hidden="true" />
    </button>
  );

  const rootProps = {
    id,
    "data-callout": "",
    "data-variant": variant,
    "data-family": entry.family,
    "data-tone": tone,
    "data-size": size,
    "data-layout": full ? "full" : "compact",
    "aria-label": [subject ?? entry.label, text].filter(Boolean).join(" "),
    "aria-busy": loading || undefined,
  };
  const rootBase =
    "not-prose w-[var(--callout-width)] max-w-[var(--callout-max-width)] overflow-hidden border-[length:var(--callout-border-width)] border-[color:var(--callout-border)] bg-[var(--callout-surface)] font-[family-name:var(--callout-font-family)] text-[var(--callout-heading)]";

  if (!full) {
    return (
      <aside {...rootProps} className={cn(rootBase, s.box, className)}>
        <div className={cn("flex items-start", s.pad, s.gap)}>
          <span aria-hidden="true" className={cn("flex shrink-0 items-center", s.minH)}>
            <Icon className={cn(s.glyph, "text-[var(--callout-icon)]")} strokeWidth={2} />
          </span>
          <div className={cn("flex min-w-0 flex-1 items-center", s.minH)}>
            <p className={cn("m-0", s.headline)}>
              {subject && (
                <strong className="leading-none font-[family-name:var(--callout-label-family)] font-[number:var(--callout-label-weight)]">
                  {subject}
                </strong>
              )}
              {subject && text ? " " : null}
              {text && (
                <span className="leading-none font-[family-name:var(--callout-message-family)] font-[number:var(--callout-message-weight)]">
                  {text}
                </span>
              )}
            </p>
          </div>
          {dismiss}
        </div>
      </aside>
    );
  }

  const label = subject ?? entry.label;
  const title = message ?? (subject ? undefined : entry.label);
  const emblem = !tinted && size !== "sm";

  return (
    <aside
      {...rootProps}
      className={cn(
        rootBase,
        "rounded-[var(--callout-card-radius)] shadow-[var(--callout-shadow)]",
        className,
      )}
    >
      <div
        data-callout-header=""
        className="flex min-h-[var(--callout-header-height)] items-center gap-2 bg-[var(--callout-header-surface)] py-1 pr-2 pl-[var(--callout-header-padding-x)]"
      >
        <p className="m-0 min-w-0 flex-1 text-base font-[family-name:var(--callout-header-family)] font-[number:var(--callout-header-weight)] text-[var(--callout-header-text)]">
          {label}
        </p>
        {dismiss}
      </div>

      <div
        data-callout-body=""
        className="flex items-start gap-[var(--callout-body-gap)] p-[var(--callout-body-padding)] md:p-[var(--callout-body-padding-wide)]"
      >
        {emblem && (
          <span
            aria-hidden="true"
            data-callout-emblem=""
            className="grid size-[var(--callout-emblem-size-narrow)] shrink-0 place-items-center rounded-full border-[length:var(--callout-emblem-border)] border-[color:var(--callout-emblem-ring)] bg-[var(--callout-emblem-surface)] text-[var(--callout-icon)] min-[480px]:size-[var(--callout-emblem-size)]"
          >
            <Icon
              className="size-[var(--callout-emblem-glyph-narrow)] min-[480px]:size-[var(--callout-emblem-glyph)]"
              strokeWidth={2}
            />
          </span>
        )}
        <div className="min-w-0 flex-1">
          {loading ? (
            <div className="flex flex-col gap-2">
              <Skeleton className="h-6 w-2/5" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-4/5" />
            </div>
          ) : (
            <>
              {title && (
                <p
                  className={cn(
                    "m-0 font-[family-name:var(--callout-message-family)] font-[number:var(--callout-message-weight)] text-[var(--callout-title)]",
                    FULL_TITLE[size],
                  )}
                >
                  {title}
                </p>
              )}
              {description && (
                <div
                  className={cn(
                    "text-base/7 text-[var(--callout-body)] font-[family-name:var(--callout-body-family)] font-[number:var(--callout-body-weight)] [&_a]:text-[var(--callout-link)] [&_a]:underline [&_ol]:list-decimal [&_ol]:pl-5 [&_p]:m-0 [&_ul]:list-disc [&_ul]:pl-5",
                    title && "mt-2",
                  )}
                >
                  {description}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {actions.length > 0 && !loading && (
        <div
          data-callout-footer=""
          className="flex flex-wrap justify-end gap-[var(--callout-footer-gap)] border-t-[length:var(--callout-border-width)] border-[color:var(--callout-divider)] px-[var(--callout-footer-padding-x)] py-[var(--callout-footer-padding-y)]"
        >
          <ActionButtons actions={actions} disabled={disabled} />
        </div>
      )}
    </aside>
  );
}

export { Callout };
export type { CalloutVariant, CalloutSize, CalloutTone };
