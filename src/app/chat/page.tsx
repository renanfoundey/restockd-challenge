"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { suggestedPrompts, chatResponses } from "@/data/chat-responses";
import { SparklesIcon, SendIcon, ArrowUpRightIcon } from "lucide-react";

interface Message {
  role: "user" | "assistant";
  content: string;
}

function findResponse(userMessage: string): string {
  const lower = userMessage.toLowerCase();
  for (const entry of chatResponses) {
    if (entry.keywords.some((kw) => lower.includes(kw))) {
      return entry.response;
    }
  }
  return chatResponses[chatResponses.length - 1].response;
}

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [messages, isTyping]);

  const handleSend = (text?: string) => {
    const message = text || input.trim();
    if (!message) return;

    const userMsg: Message = { role: "user", content: message };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsTyping(true);

    setTimeout(() => {
      const response = findResponse(message);
      setMessages((prev) => [...prev, { role: "assistant", content: response }]);
      setIsTyping(false);
    }, 800 + Math.random() * 1200);
  };

  return (
    <div className="flex flex-col h-screen">
      <div className="sticky top-0 z-10 border-b border-border bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/70">
        <div className="px-6 py-4 flex items-center gap-3">
          <div className="size-9 rounded-full bg-primary/10 text-primary flex items-center justify-center">
            <SparklesIcon className="size-4" />
          </div>
          <div>
            <h1 className="text-base font-semibold tracking-tight">
              AI Assistant
            </h1>
            <p className="text-xs text-muted-foreground">
              Ask about inventory, demand forecasts, and reorder timing
            </p>
          </div>
        </div>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto px-6 py-6">
        {messages.length === 0 && !isTyping ? (
          <div className="max-w-2xl mx-auto h-full flex flex-col justify-center gap-8">
            <div className="text-center space-y-2">
              <div className="size-12 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto">
                <SparklesIcon className="size-5" />
              </div>
              <h2 className="text-xl font-semibold tracking-tight">
                What would you like to know?
              </h2>
              <p className="text-sm text-muted-foreground">
                Pick a starter or type a question below.
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {suggestedPrompts.map((prompt) => (
                <button
                  key={prompt}
                  onClick={() => handleSend(prompt)}
                  className="group rounded-xl border border-border bg-card px-4 py-3 text-left text-sm hover:border-primary/40 hover:shadow-sm transition-all"
                >
                  <div className="flex items-start justify-between gap-3">
                    <span className="text-foreground">{prompt}</span>
                    <ArrowUpRightIcon className="size-4 text-muted-foreground group-hover:text-primary shrink-0 transition-colors" />
                  </div>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="max-w-2xl mx-auto space-y-5">
            {messages.map((msg, i) => (
              <div
                key={i}
                className={
                  msg.role === "user"
                    ? "flex justify-end"
                    : "flex items-start gap-3"
                }
              >
                {msg.role === "assistant" && (
                  <div className="size-7 shrink-0 rounded-full bg-primary/10 text-primary flex items-center justify-center mt-0.5">
                    <SparklesIcon className="size-3.5" />
                  </div>
                )}
                <div
                  className={
                    msg.role === "user"
                      ? "bg-primary text-primary-foreground px-4 py-2.5 rounded-2xl rounded-br-md max-w-md text-sm shadow-xs"
                      : "bg-card border border-border rounded-2xl rounded-tl-md px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap shadow-xs flex-1"
                  }
                >
                  {msg.content}
                </div>
              </div>
            ))}
            {isTyping && (
              <div className="flex items-start gap-3">
                <div className="size-7 shrink-0 rounded-full bg-primary/10 text-primary flex items-center justify-center mt-0.5">
                  <SparklesIcon className="size-3.5" />
                </div>
                <div className="bg-card border border-border rounded-2xl rounded-tl-md px-4 py-3 shadow-xs">
                  <div className="flex items-center gap-1">
                    <span className="typing-dot size-1.5 rounded-full bg-muted-foreground" />
                    <span className="typing-dot size-1.5 rounded-full bg-muted-foreground" />
                    <span className="typing-dot size-1.5 rounded-full bg-muted-foreground" />
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="border-t border-border bg-background px-6 py-4">
        <div className="max-w-2xl mx-auto">
          <div className="relative rounded-2xl border border-border bg-card shadow-xs focus-within:border-primary/40 focus-within:ring-2 focus-within:ring-ring/20 transition-all">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder="Ask about inventory, forecasts, or reorder timing..."
              className="min-h-[52px] max-h-40 resize-none border-0 bg-transparent shadow-none focus-visible:ring-0 pr-14"
              rows={1}
            />
            <Button
              onClick={() => handleSend()}
              disabled={!input.trim() || isTyping}
              size="icon-sm"
              className="absolute right-2 bottom-2"
              aria-label="Send"
            >
              <SendIcon className="size-3.5" />
            </Button>
          </div>
          <p className="text-[11px] text-muted-foreground/80 text-center mt-2">
            Press Enter to send · Shift + Enter for new line
          </p>
        </div>
      </div>
    </div>
  );
}
