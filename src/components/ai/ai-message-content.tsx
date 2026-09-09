"use client";

import React from "react";

interface AIMessageContentProps {
  content: string;
}

/**
 * Safely parses and renders standard AI markdown (headings, bold, bullet points, numbered lists, links, code)
 * without requiring heavy external dependencies.
 */
export function AIMessageContent({ content }: AIMessageContentProps) {
  if (!content) return null;

  // Split content by double newlines into blocks
  const blocks = content.split(/\n\n+/);

  return (
    <div className="space-y-3 text-xs sm:text-sm leading-relaxed text-on-surface">
      {blocks.map((block, bIdx) => {
        const rawLines = block.split(/\n/).map((l) => l.trim()).filter(Boolean);
        if (rawLines.length === 0) return null;

        // Group consecutive lines into typed items
        type BlockItem =
          | { type: "h1" | "h2" | "h3" | "h4"; text: string }
          | { type: "bullet"; text: string }
          | { type: "number"; num: string; text: string }
          | { type: "p"; text: string };

        const items: BlockItem[] = rawLines.map((line) => {
          if (/^####\s+/.test(line)) return { type: "h4", text: line.replace(/^####\s+/, "") };
          if (/^###\s+/.test(line)) return { type: "h3", text: line.replace(/^###\s+/, "") };
          if (/^##\s+/.test(line)) return { type: "h2", text: line.replace(/^##\s+/, "") };
          if (/^#\s+/.test(line)) return { type: "h1", text: line.replace(/^#\s+/, "") };
          if (/^[-*•]\s+/.test(line)) return { type: "bullet", text: line.replace(/^[-*•]\s+/, "") };
          const numMatch = line.match(/^(\d+)\.\s+(.*)/);
          if (numMatch) return { type: "number", num: numMatch[1], text: numMatch[2] };
          return { type: "p", text: line };
        });

        // Group into rendered sections
        const renderedElements: React.ReactNode[] = [];
        let currentBullets: string[] = [];
        let currentNumbers: { num: string; text: string }[] = [];

        const flushBullets = (keyPrefix: string) => {
          if (currentBullets.length > 0) {
            renderedElements.push(
              <ul key={`${keyPrefix}-ul`} className="space-y-1.5 pl-4 list-disc marker:text-brand-primary my-1.5">
                {currentBullets.map((itemText, i) => (
                  <li key={i}>{formatInlineText(itemText)}</li>
                ))}
              </ul>
            );
            currentBullets = [];
          }
        };

        const flushNumbers = (keyPrefix: string) => {
          if (currentNumbers.length > 0) {
            renderedElements.push(
              <ol key={`${keyPrefix}-ol`} className="space-y-1.5 pl-4 list-decimal marker:text-brand-primary font-medium my-1.5">
                {currentNumbers.map((item, i) => (
                  <li key={i} className="font-normal">
                    {formatInlineText(item.text)}
                  </li>
                ))}
              </ol>
            );
            currentNumbers = [];
          }
        };

        items.forEach((item, idx) => {
          if (item.type === "bullet") {
            flushNumbers(`${bIdx}-${idx}`);
            currentBullets.push(item.text);
          } else if (item.type === "number") {
            flushBullets(`${bIdx}-${idx}`);
            currentNumbers.push({ num: item.num, text: item.text });
          } else {
            flushBullets(`${bIdx}-${idx}`);
            flushNumbers(`${bIdx}-${idx}`);

            if (item.type === "h1") {
              renderedElements.push(
                <h1 key={`${bIdx}-${idx}`} className="font-black text-lg sm:text-xl text-on-surface mt-2 mb-1">
                  {formatInlineText(item.text)}
                </h1>
              );
            } else if (item.type === "h2") {
              renderedElements.push(
                <h2 key={`${bIdx}-${idx}`} className="font-extrabold text-base sm:text-lg text-on-surface mt-2 mb-1">
                  {formatInlineText(item.text)}
                </h2>
              );
            } else if (item.type === "h3") {
              renderedElements.push(
                <h3 key={`${bIdx}-${idx}`} className="font-bold text-sm sm:text-base text-slate-900 mt-1.5 mb-0.5">
                  {formatInlineText(item.text)}
                </h3>
              );
            } else if (item.type === "h4") {
              renderedElements.push(
                <h4 key={`${bIdx}-${idx}`} className="font-bold text-xs sm:text-sm text-brand-primary mt-1 mb-0.5">
                  {formatInlineText(item.text)}
                </h4>
              );
            } else {
              renderedElements.push(
                <p key={`${bIdx}-${idx}`} className="my-1">
                  {formatInlineText(item.text)}
                </p>
              );
            }
          }
        });

        flushBullets(`${bIdx}-end`);
        flushNumbers(`${bIdx}-end`);

        return <div key={bIdx}>{renderedElements}</div>;
      })}
    </div>
  );
}

/**
 * Parses markdown inline elements: links ([title](href)), bold (**text** or __text__), code (`code`)
 */
function formatInlineText(text: string): React.ReactNode {
  // Regex splitting by markdown link [title](url), bold (**...** / __...__), and inline code (`...`)
  const parts = text.split(/(\[.*?\]\(.*?\)|\*\*.*?\*\*|__.*?__|`.*?`)/g);

  return parts.map((part, idx) => {
    // Markdown link: [Title](/url)
    const linkMatch = part.match(/^\[(.*?)\]\((.*?)\)$/);
    if (linkMatch) {
      const linkText = linkMatch[1];
      const linkHref = linkMatch[2];
      const isExternal = linkHref.startsWith("http");
      return (
        <a
          key={idx}
          href={linkHref}
          target={isExternal ? "_blank" : undefined}
          rel={isExternal ? "noopener noreferrer" : undefined}
          className="text-brand-primary font-semibold underline underline-offset-2 hover:text-emerald-700 transition-colors"
        >
          {linkText}
        </a>
      );
    }

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
