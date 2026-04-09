"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { suggestedPrompts, chatResponses } from "@/data/chat-responses";

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
      <div className="border-b border-border px-6 py-4">
        <h1 className="text-lg font-semibold">AI Forecasting Assistant</h1>
        <p className="text-sm text-muted-foreground">Ask questions about inventory, demand forecasts, and reorder timing</p>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto px-6 py-4">
        {messages.length === 0 && !isTyping && (
          <div className="flex flex-col items-center justify-center h-full gap-6">
            <p className="text-muted-foreground text-sm">Start a conversation or try one of these prompts:</p>
            <div className="flex flex-wrap gap-2 max-w-lg justify-center">
              {suggestedPrompts.map((prompt) => (
                <button
                  key={prompt}
                  onClick={() => handleSend(prompt)}
                  className="px-3 py-2 text-sm border border-border rounded-md hover:bg-accent text-left"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="max-w-2xl mx-auto space-y-4">
          {messages.map((msg, i) => (
            <div key={i} className={msg.role === "user" ? "flex justify-end" : ""}>
              <div
                className={
                  msg.role === "user"
                    ? "bg-primary text-primary-foreground px-4 py-2 rounded-lg max-w-md text-sm"
                    : "text-sm leading-relaxed whitespace-pre-wrap"
                }
              >
                {msg.content}
              </div>
            </div>
          ))}
          {isTyping && (
            <div className="text-sm text-muted-foreground">Analyzing...</div>
          )}
        </div>
      </div>

      <div className="border-t border-border px-6 py-4">
        <div className="max-w-2xl mx-auto flex gap-2">
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
            className="min-h-[44px] max-h-32 resize-none"
            rows={1}
          />
          <Button onClick={() => handleSend()} disabled={!input.trim() || isTyping}>
            Send
          </Button>
        </div>
      </div>
    </div>
  );
}
