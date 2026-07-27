"use client";

import { useState } from "react";

type Props = {
  value: string;
  label?: string;
  className?: string;
};

export function CopyButton({ value, label = "Copier", className = "" }: Props) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  return (
    <button
      type="button"
      onClick={copy}
      className={`btn-secondary text-xs ${className}`.trim()}
    >
      {copied ? "Copié !" : label}
    </button>
  );
}
