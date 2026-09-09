"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Sparkles,
  Send,
  ArrowLeft,
  RotateCcw,
  Bot,
  User,
  Copy,
  Check,
  AlertCircle,
  Mic,
  Sprout,
  Waves,
  Store,
  Wrench,
  ShieldCheck,
  HelpCircle,
} from "lucide-react";
import { AIMessageContent } from "./ai-message-content";
import { Badge } from "@/components/ui/badge";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

interface AIChatViewProps {
  userRole?: string | null;
  userName?: string | null;
}

export function AIChatView({ userRole, userName }: AIChatViewProps) {
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string>("");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [voiceNotice, setVoiceNotice] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Initialize or restore session ID on mount
  useEffect(() => {
    setSessionId(crypto.randomUUID());
  }, []);

  const scrollToBottom = useCallback(() => {
    if (typeof messagesEndRef.current?.scrollIntoView === "function") {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading, error, scrollToBottom]);

  // Quick Action Prompts tailored by role, including all key core prompts
  const getRoleQuickPrompts = (): string[] => {
    const role = (userRole || "").toUpperCase();
    if (role === "FARMER") {
      return [
        "What are common causes of yellow leaves in paddy?",
        "How can I improve fish pond water quality?",
        "How can demand forecasting help farmers?",
        "How can I find bulk buyers?",
      ];
    }
    if (role === "BUYER") {
      return [
        "How can I find bulk buyers?",
        "How does MOQ work?",
        "How can demand forecasting help farmers?",
        "What can route optimization improve?",
      ];
    }
    if (role === "SERVICE_PROVIDER" || role === "PROVIDER") {
      return [
        "What can route optimization improve?",
        "How can demand forecasting help farmers?",
        "How to price tractor and equipment rentals regionally?",
        "Cold storage temperature standards for freshwater fish",
      ];
    }
    if (role === "ADMIN") {
      return [
        "Marketplace supply and demand cluster insights",
        "Verification guidelines for new agricultural producers",
        "How can demand forecasting help farmers?",
        "What can route optimization improve?",
      ];
    }
    return [
      "What are common causes of yellow leaves in paddy?",
      "How can I improve fish pond water quality?",
      "How can I find bulk buyers?",
      "How does MOQ work?",
      "How can demand forecasting help farmers?",
      "What can route optimization improve?",
    ];
  };

  const handleSendMessage = async (textToSend?: string, isRetry = false) => {
    const question = (textToSend !== undefined ? textToSend : input).trim();
    if (!question || isLoading) return;

    setError(null);
    setInput("");

    if (!isRetry) {
      const userMessage: Message = {
        id: crypto.randomUUID(),
        role: "user",
        content: question,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, userMessage]);
    }
    setIsLoading(true);

    try {
      const activeSessionId = sessionId || crypto.randomUUID();
      if (!sessionId) setSessionId(activeSessionId);

      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: question,
          sessionId: activeSessionId,
        }),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok || !data?.success) {
        throw new Error(data?.message || data?.error || "AI Assistant is temporarily unavailable. Please try again.");
      }

      const answerContent = data?.data?.answer || data?.message || "";
      if (!answerContent) {
        throw new Error("AI Assistant is temporarily unavailable. Please try again.");
      }

      const assistantMessage: Message = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: answerContent,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err: any) {
      console.error("[AIChatView] Error sending message:", err);
      setError(err?.message || "AI Assistant is temporarily unavailable. Please try again.");
    } finally {
      setIsLoading(false);
      setTimeout(() => textareaRef.current?.focus(), 100);
    }
  };

  const handleRetry = () => {
    const lastUserMessage = [...messages].reverse().find((m) => m.role === "user");
    if (lastUserMessage) {
      handleSendMessage(lastUserMessage.content, true);
    }
  };

  const handleNewChat = () => {
    setMessages([]);
    setError(null);
    setInput("");
    setSessionId(crypto.randomUUID());
    setTimeout(() => textareaRef.current?.focus(), 100);
  };

  const handleCopyText = (id: string, text: string) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    }
  };

  const handleVoicePlaceholder = () => {
    setVoiceNotice(true);
    setTimeout(() => setVoiceNotice(false), 3000);
  };

  const quickPrompts = getRoleQuickPrompts();
  const roleLabel = userRole ? userRole.replace("_", " ") : "Guest";

  return (
    <div className="flex flex-col h-[100dvh] max-h-[100dvh] bg-[#f8f9ff] font-body text-left select-text">
      {/* 1. TOP APP BAR */}
      <header className="sticky top-0 z-30 flex items-center justify-between px-3 sm:px-6 h-14 sm:h-16 bg-white/95 backdrop-blur-md border-b border-surface-dim shadow-xs shrink-0">
        <div className="flex items-center gap-2.5 min-w-0">
          <button
            type="button"
            onClick={() => router.back()}
            className="flex items-center justify-center h-9 w-9 rounded-lg text-slate-neutral hover:text-brand-primary hover:bg-surface-low transition-colors"
            aria-label="Go back"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>

          <div className="flex items-center gap-2 min-w-0">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-brand-primary to-emerald-700 text-white shadow-xs shrink-0">
              <Sparkles className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <h1 className="font-heading font-extrabold text-sm sm:text-base text-on-surface truncate">
                  EcoFarm AI
                </h1>
                <span className="flex items-center gap-1 px-1.5 py-0.2 rounded-full bg-status-success/15 text-emerald-800 text-[10px] font-bold">
                  <span className="h-1.5 w-1.5 rounded-full bg-status-success animate-pulse" />
                  <span>Online</span>
                </span>
              </div>
              <p className="text-[10px] sm:text-[11px] text-slate-neutral truncate hidden xs:block">
                Smart assistance for agriculture & business
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1 sm:gap-2">
          {messages.length > 0 && (
            <button
              type="button"
              onClick={handleNewChat}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-slate-neutral hover:text-brand-primary hover:bg-surface-low border border-surface-dim transition-all"
              title="Clear conversation and start fresh"
              aria-label="Clear conversation"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>Clear conversation</span>
            </button>
          )}

          <Link
            href="/"
            className="text-xs font-semibold text-brand-primary hover:underline px-2 py-1 rounded"
          >
            Home
          </Link>
        </div>
      </header>

      {/* 2. CHAT SCROLL AREA */}
      <main className="flex-1 overflow-y-auto px-3 sm:px-6 py-4 sm:py-6 space-y-4 max-w-3xl w-full mx-auto">
        {/* Welcome State when no messages exist */}
        {messages.length === 0 && (
          <div className="py-6 sm:py-10 space-y-6 text-center animate-in fade-in duration-300">
            <div className="h-16 w-16 mx-auto rounded-2xl bg-gradient-to-br from-brand-primary/15 via-brand-secondary/15 to-emerald-500/15 border border-brand-primary/20 flex items-center justify-center text-brand-primary shadow-xs">
              <Sparkles className="h-8 w-8 text-brand-primary" />
            </div>

            <div className="space-y-1.5 max-w-md mx-auto px-4">
              <h2 className="font-heading font-extrabold text-lg sm:text-xl text-on-surface">
                Welcome to EcoFarm AI
              </h2>
              <p className="text-xs sm:text-sm text-slate-neutral leading-relaxed">
                Your specialized assistant for crop health, aquaculture pond management, wholesale market planning, procurement, and platform assistance.
              </p>
              <div className="pt-1 flex items-center justify-center gap-2 text-[11px] text-slate-neutral/80">
                <Badge variant="outline" size="sm" className="bg-white text-[10px]">
                  Role: {roleLabel}
                </Badge>
                <span>•</span>
                <span>Powered by Gemini Intelligence</span>
              </div>
            </div>

            {/* Quick Action Prompt Chips */}
            <div className="space-y-2.5 max-w-lg mx-auto text-left pt-2 px-2">
              <div className="flex items-center gap-1.5 text-xs font-heading font-bold uppercase tracking-wider text-slate-neutral px-1">
                <HelpCircle className="h-3.5 w-3.5 text-brand-primary" />
                <span>Suggested Questions</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {quickPrompts.map((prompt, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSendMessage(prompt)}
                    className="p-3 rounded-xl bg-white border border-surface-dim/80 hover:border-brand-primary/50 hover:bg-brand-primary/5 shadow-xs text-left text-xs font-medium text-on-surface transition-all active:scale-[0.98] group flex items-start justify-between gap-2"
                  >
                    <span>{prompt}</span>
                    <Sparkles className="h-3.5 w-3.5 text-brand-primary/40 group-hover:text-brand-primary shrink-0 mt-0.5" />
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Message Thread */}
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex items-start gap-2 sm:gap-3 ${
              msg.role === "user" ? "justify-end" : "justify-start"
            } animate-in fade-in duration-200`}
          >
            {/* Assistant Avatar */}
            {msg.role === "assistant" && (
              <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-brand-primary to-emerald-700 text-white flex items-center justify-center shrink-0 shadow-xs mt-0.5">
                <Sparkles className="h-4 w-4" />
              </div>
            )}

            {/* Message Bubble */}
            <div
              className={`relative max-w-[85%] sm:max-w-[75%] rounded-2xl p-3.5 sm:p-4 text-left shadow-xs ${
                msg.role === "user"
                  ? "bg-brand-primary text-white rounded-br-xs"
                  : "bg-white border border-surface-dim/90 text-on-surface rounded-bl-xs"
              }`}
            >
              {msg.role === "user" ? (
                <p className="text-xs sm:text-sm whitespace-pre-wrap leading-relaxed font-medium">
                  {msg.content}
                </p>
              ) : (
                <AIMessageContent content={msg.content} />
              )}

              {/* Timestamp & Copy Action (for assistant messages) */}
              <div
                className={`flex items-center justify-between gap-3 pt-2 mt-2 border-t text-[10px] ${
                  msg.role === "user"
                    ? "border-white/15 text-white/70"
                    : "border-surface-dim text-slate-neutral/70"
                }`}
              >
                <span>
                  {new Date(msg.timestamp).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>

                {msg.role === "assistant" && (
                  <button
                    type="button"
                    onClick={() => handleCopyText(msg.id, msg.content)}
                    className="flex items-center gap-1 hover:text-brand-primary transition-colors p-0.5"
                    title="Copy answer to clipboard"
                  >
                    {copiedId === msg.id ? (
                      <>
                        <Check className="h-3 w-3 text-status-success" />
                        <span className="text-status-success font-semibold">Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="h-3 w-3" />
                        <span>Copy</span>
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>

            {/* User Avatar */}
            {msg.role === "user" && (
              <div className="h-8 w-8 rounded-xl bg-surface-container text-brand-primary border border-surface-dim flex items-center justify-center shrink-0 shadow-xs mt-0.5">
                <User className="h-4 w-4" />
              </div>
            )}
          </div>
        ))}

        {/* Thinking / Loading Animation */}
        {isLoading && (
          <div className="flex items-start gap-2.5 justify-start animate-in fade-in duration-200">
            <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-brand-primary to-emerald-700 text-white flex items-center justify-center shrink-0 shadow-xs mt-0.5">
              <Sparkles className="h-4 w-4 animate-spin" />
            </div>

            <div className="rounded-2xl rounded-bl-xs p-3.5 bg-white border border-surface-dim shadow-xs space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-brand-primary">EcoFarm AI is thinking</span>
                <span className="flex gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-brand-primary animate-bounce" style={{ animationDelay: "0ms" }} />
                  <span className="h-1.5 w-1.5 rounded-full bg-brand-primary animate-bounce" style={{ animationDelay: "150ms" }} />
                  <span className="h-1.5 w-1.5 rounded-full bg-brand-primary animate-bounce" style={{ animationDelay: "300ms" }} />
                </span>
              </div>
              <p className="text-[11px] text-slate-neutral">
                Analyzing agriculture, aquaculture, and marketplace knowledge...
              </p>
            </div>
          </div>
        )}

        {/* Error State Banner with Retry */}
        {error && (
          <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center justify-between gap-3 animate-in fade-in duration-200">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />
              <span>{error}</span>
            </div>
            <button
              type="button"
              onClick={handleRetry}
              className="px-3 py-1 bg-rose-600 hover:bg-rose-700 text-white font-semibold rounded-lg shrink-0 transition-colors"
            >
              Retry
            </button>
          </div>
        )}

        {/* Voice Feature Notice Toast */}
        {voiceNotice && (
          <div className="p-2.5 rounded-lg bg-slate-900/90 backdrop-blur-md text-white text-xs text-center fixed bottom-20 left-1/2 -translate-x-1/2 z-50 shadow-lg animate-in fade-in duration-200">
            🎙️ Voice input assistant is in preparation for the upcoming mobile update.
          </div>
        )}

        <div ref={messagesEndRef} className="h-2" />
      </main>

      {/* 3. STICKY COMPOSER BAR */}
      <footer className="sticky bottom-0 z-30 bg-white/95 backdrop-blur-md border-t border-surface-dim p-2.5 sm:p-4 pb-[calc(0.75rem+env(safe-area-inset-bottom))] shadow-stitch-modal shrink-0">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="max-w-3xl mx-auto flex items-end gap-2"
        >
          {/* Voice Input Placeholder */}
          <button
            type="button"
            onClick={handleVoicePlaceholder}
            className="flex items-center justify-center h-10 w-10 sm:h-11 sm:w-11 rounded-xl text-slate-neutral hover:text-brand-primary hover:bg-surface-low border border-surface-dim/80 shrink-0 transition-colors mb-0.5"
            aria-label="Voice input (coming soon)"
            title="Voice input (coming soon)"
          >
            <Mic className="h-4 w-4 sm:h-5 sm:w-5" />
          </button>

          {/* Text Area with Enter to Send / Shift+Enter for Newline */}
          <div className="relative flex-1">
            <textarea
              ref={textareaRef}
              rows={1}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
              placeholder="Ask EcoFarm AI about crops, fish, procurement, logistics... (Press Enter to send, Shift+Enter for newline)"
              disabled={isLoading}
              className="w-full resize-none py-2.5 pl-3.5 pr-3 rounded-xl border border-surface-dim bg-surface-low/60 text-xs sm:text-sm text-on-surface placeholder:text-slate-neutral/60 focus:outline-none focus:ring-2 focus:ring-brand-primary focus:bg-white transition-all disabled:opacity-50 min-h-[42px] max-h-32"
            />
          </div>

          {/* Send Button */}
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="flex items-center justify-center h-10 w-10 sm:h-11 sm:w-11 rounded-xl bg-brand-primary text-white shadow-sm hover:bg-brand-primary-hover disabled:opacity-40 disabled:cursor-not-allowed shrink-0 active:scale-95 transition-all mb-0.5"
            aria-label="Send question to EcoFarm AI"
          >
            <Send className="h-4 w-4" />
          </button>
        </form>
      </footer>
    </div>
  );
}
