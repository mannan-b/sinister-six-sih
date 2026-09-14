"use client";

import React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface MarkdownRendererProps {
  content?: string | null;
  className?: string;
  compact?: boolean;
}

export function MarkdownRenderer({ content, className = "", compact = false }: MarkdownRendererProps) {
  if (!content) return null;

  return (
    <div className={`markdown-content text-zinc-200 text-xs ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1({ children }) {
            return (
              <h1 className="text-base font-bold text-white mt-3 mb-1.5 first:mt-0 tracking-tight">
                {children}
              </h1>
            );
          },
          h2({ children }) {
            return (
              <h2 className="text-sm font-bold text-white mt-2.5 mb-1 first:mt-0 tracking-tight">
                {children}
              </h2>
            );
          },
          h3({ children }) {
            return (
              <h3 className="text-xs font-bold text-white mt-2 mb-1 first:mt-0 tracking-tight">
                {children}
              </h3>
            );
          },
          h4({ children }) {
            return (
              <h4 className="text-xs font-semibold text-zinc-100 mt-2 mb-0.5 first:mt-0">
                {children}
              </h4>
            );
          },
          h5({ children }) {
            return (
              <h5 className="text-[11px] font-semibold text-zinc-200 mt-1.5 mb-0.5 first:mt-0">
                {children}
              </h5>
            );
          },
          h6({ children }) {
            return (
              <h6 className="text-[10px] font-semibold text-zinc-300 mt-1 mb-0.5 first:mt-0 uppercase tracking-wider">
                {children}
              </h6>
            );
          },
          p({ children }) {
            if (compact) {
              return <span className="inline">{children}</span>;
            }
            return <p className="mb-2.5 last:mb-0 leading-relaxed break-words">{children}</p>;
          },
          strong({ children }) {
            return <strong className="font-bold text-white">{children}</strong>;
          },
          em({ children }) {
            return <em className="italic text-zinc-200">{children}</em>;
          },
          ul({ children }) {
            return (
              <ul className="list-disc list-outside space-y-1 my-2 pl-4 text-zinc-300 leading-relaxed">
                {children}
              </ul>
            );
          },
          ol({ children }) {
            return (
              <ol className="list-decimal list-outside space-y-1 my-2 pl-4 text-zinc-300 leading-relaxed">
                {children}
              </ol>
            );
          },
          li({ children }) {
            return <li className="pl-0.5">{children}</li>;
          },
          code({ node, inline, className, children, ...props }: any) {
            const isSingleLine = typeof children === "string" && !children.includes("\n");
            const isInlineCode = inline || (isSingleLine && !className);

            if (isInlineCode) {
              return (
                <code
                  className="px-1.5 py-0.5 rounded bg-zinc-900 border border-zinc-800 font-mono text-[0.85em] text-zinc-200 break-all"
                  {...props}
                >
                  {children}
                </code>
              );
            }
            return (
              <pre className="p-3 my-2 bg-zinc-950 border border-zinc-800 font-mono text-xs text-zinc-200 rounded-md overflow-x-auto leading-normal">
                <code {...props}>{children}</code>
              </pre>
            );
          },
          a({ href, children }) {
            return (
              <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sky-400 hover:text-sky-300 underline font-medium break-all transition-colors"
              >
                {children}
              </a>
            );
          },
          blockquote({ children }) {
            return (
              <blockquote className="border-l-2 border-zinc-600 pl-3 my-2 text-zinc-400 italic bg-zinc-950/60 py-1.5 rounded-r">
                {children}
              </blockquote>
            );
          },
          table({ children }) {
            return (
              <div className="overflow-x-auto my-2.5">
                <table className="w-full border-collapse border border-zinc-800 text-xs">
                  {children}
                </table>
              </div>
            );
          },
          thead({ children }) {
            return <thead className="bg-zinc-900 text-white border-b border-zinc-800">{children}</thead>;
          },
          tbody({ children }) {
            return <tbody className="divide-y divide-zinc-800/70 text-zinc-300">{children}</tbody>;
          },
          tr({ children }) {
            return <tr className="hover:bg-zinc-900/40 transition-colors">{children}</tr>;
          },
          th({ children }) {
            return <th className="px-3 py-1.5 text-left font-semibold border border-zinc-800">{children}</th>;
          },
          td({ children }) {
            return <td className="px-3 py-1.5 border border-zinc-800/80">{children}</td>;
          },
          hr() {
            return <hr className="border-t border-zinc-800 my-3" />;
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
