"use client";

import React from "react";

interface AIMessageContentProps {
  content: string;
}

/**
 * Safely parses and renders standard AI markdown (paragraphs, bold, bullet points, numbered lists)
 * without requiring heavy external dependencies.
 */
export function AIMessageContent({ content }: AIMessageContentProps) {
  if (!content) return null;

  // Split content by double newlines into blocks
  const blocks = content.split(/\n\n+/);

  return (
    <div className="space-y-3 text-xs sm:text-sm leading-relaxed text-on-surface">
      {blocks.map((block, bIdx) => {
        const lines = block.split(/\n/).map((l) => l.trim()).filter(Boolean);

        // Check if block is a bulleted list
        const isBulletList = lines.length > 0 && lines.every((l) => /^[-*•]\s+/.test(l));
        if (isBulletList) {
          return (
            <ul key={bIdx} className="space-y-1.5 pl-4 list-disc marker:text-brand-primary">
              {lines.map((line, lIdx) => {
                const text = line.replace(/^[-*•]\s+/, "");
                return <li key={lIdx}>{formatInlineText(text)}</li>;
              })}
            </ul>
          );
        }

        // Check if block is a numbered list
        const isNumberedList = lines.length > 0 && lines.every((l) => /^\d+\.\s+/.test(l));
        if (isNumberedList) {
          return (
            <ol key={bIdx} className="space-y-1.5 pl-4 list-decimal marker:text-brand-primary font-medium">
              {lines.map((line, lIdx) => {
                const text = line.replace(/^\d+\.\s+/, "");
                return (
                  <li key={lIdx} className="font-normal">
                    {formatInlineText(text)}
                  </li>
                );
              })}
            </ol>
          );
        }

        // Standard paragraph (handle single-line breaks within block)
        return (
          <p key={bIdx} className="whitespace-pre-line">
            {lines.map((line, lIdx) => (
              <React.Fragment key={lIdx}>
                {formatInlineText(line)}
                {lIdx < lines.length - 1 && <br />}
              </React.Fragment>
            ))}
          </p>
        );
      })}
    </div>
  );
}

/**
 * Parses bold (**text** or __text__) and code (`code`) inline markdown syntax
 */
function formatInlineText(text: string): React.ReactNode {
  // Regex splitting by bold (**...**) and inline code (`...`)
  const parts = text.split(/(\*\*.*?\*\*|__.*?__|`.*?`)/g);

  return parts.map((part, idx) => {
    if ((part.startsWith("**") && part.endsWith("**")) || (part.startsWith("__") && part.endsWith("__"))) {
      return (
        <strong key={idx} className="font-bold text-on-surface">
          {part.slice(2, -2)}
        </strong>
      );
    }
    if (part.startsWith("`") && part.endsWith("`")) {
      return (
        <code key={idx} className="px-1.5 py-0.5 rounded bg-surface-low border border-surface-dim font-mono text-[11px] text-brand-primary">
          {part.slice(1, -1)}
        </code>
      );
    }
    return part;
  });
}
