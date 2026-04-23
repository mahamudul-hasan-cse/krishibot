"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { v4 as uuidv4 } from "uuid";
import { Send, Trash2, Loader2, Leaf, Cpu } from "lucide-react";
import MessageBubble from "@/components/MessageBubble";
import {
  sendChatMessage,
  getChatHistory,
  clearChatSession,
  type ChatMessage,
} from "@/lib/api";

const SUGGESTED_QUESTIONS = [
  "My rice leaves are turning yellow, what should I do?",
  "How often should I water tomato plants?",
  "What fertilizer is best for potato crops?",
  "How do I prevent pest damage on my crops?",
] as const;

interface Props {
  sessionId: string;
  onFirstUserMessage?: (sessionId: string, text: string) => void;
  onActivity?: (sessionId: string) => void;
}

export default function ChatInterface({
  sessionId,
  onFirstUserMessage,
  onActivity,
}: Props) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [language, setLanguage] = useState<"en" | "bn">("en");
  const [streamingId, setStreamingId] = useState<string | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);
  const hasFirstMessageRef = useRef(false);

  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const recognitionRef = useRef<any>(null);

  // Load history whenever sessionId changes
  useEffect(() => {
    hasFirstMessageRef.current = false;
    setMessages([]);
    if (!sessionId) return;

    getChatHistory(sessionId)
      .then((history) => {
        if (history.length > 0) {
          setMessages(history);
          hasFirstMessageRef.current = history.some((m) => m.role === "user");
        }
      })
      .catch(() => {});
  }, [sessionId]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const SpeechRecognition =
        (window as any).SpeechRecognition ||
        (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) setSpeechSupported(true);
    }
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
  }, [inputText]);

  useEffect(() => {
    return () => {
      if (recognitionRef.current) recognitionRef.current.stop();
    };
  }, []);

  const startListening = () => {
    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    const recognition = new SpeechRecognition();
    recognitionRef.current = recognition;
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;
    recognition.lang = language === "bn" ? "bn-BD" : "en-US";

    recognition.onstart = () => setIsListening(true);
    recognition.onresult = (event: any) => {
      const transcript = Array.from(event.results)
        .map((result: any) => result[0].transcript)
        .join("");
      setInputText(transcript);
    };
    recognition.onerror = () => setIsListening(false);
    recognition.onend = () => setIsListening(false);

    recognition.start();
  };

  const stopListening = () => {
    if (recognitionRef.current) recognitionRef.current.stop();
    setIsListening(false);
  };

  const toggleListening = () => {
    if (isListening) stopListening();
    else startListening();
  };

  const handleSend = useCallback(
    async (overrideText?: string) => {
      const text = (overrideText ?? inputText).trim();
      if (!text || isLoading) return;

      setInputText("");

      if (!hasFirstMessageRef.current) {
        hasFirstMessageRef.current = true;
        onFirstUserMessage?.(sessionId, text);
      }
      onActivity?.(sessionId);

      const userMsg: ChatMessage = {
        role: "user",
        content: text,
        timestamp: new Date().toISOString(),
      };

      const assistantId = uuidv4();
      const assistantMsg: ChatMessage = {
        id: assistantId as unknown as number,
        role: "assistant",
        content: "",
        timestamp: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, userMsg, assistantMsg]);
      setIsLoading(true);
      setStreamingId(assistantId);

      try {
        await sendChatMessage(
          sessionId,
          text,
          language,
          (token) => {
            setMessages((prev) =>
              prev.map((m) =>
                (m.id as unknown as string) === assistantId
                  ? { ...m, content: m.content + token }
                  : m,
              ),
            );
          },
          () => {
            setStreamingId(null);
            setIsLoading(false);
          },
        );
      } catch (err) {
        const errorText =
          err instanceof Error ? err.message : "Something went wrong. Please try again.";
        setMessages((prev) =>
          prev.map((m) =>
            (m.id as unknown as string) === assistantId
              ? { ...m, content: `⚠️ ${errorText}` }
              : m,
          ),
        );
        setStreamingId(null);
        setIsLoading(false);
      }
    },
    [inputText, isLoading, sessionId, language, onFirstUserMessage, onActivity],
  );

  const handleClear = useCallback(async () => {
    if (isLoading) return;
    try {
      await clearChatSession(sessionId);
    } catch {}
    setMessages([]);
    hasFirstMessageRef.current = false;
  }, [sessionId, isLoading]);

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  return (
    <div className="flex flex-col h-full bg-gray-50 dark:bg-soil-900 transition-colors">

      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-white dark:bg-soil-800 border-b border-gray-200 dark:border-soil-700 shrink-0 transition-colors">
        <div className="flex items-center gap-2 text-primary-700 dark:text-primary-300">
          <Leaf size={18} strokeWidth={2} />
          <span className="text-sm font-semibold">KrishiBot Chat</span>
          {sessionId && (
            <span className="hidden sm:inline text-xs text-gray-400 dark:text-soil-400 font-mono">
              #{sessionId.slice(0, 8)}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setLanguage((l) => (l === "en" ? "bn" : "en"))}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold border border-primary-200 text-primary-700 hover:bg-primary-50 dark:border-soil-600 dark:text-soil-100 dark:hover:bg-soil-700 transition-colors"
            title="Toggle language"
          >
            {language === "en" ? "EN" : "বাংলা"}
          </button>

          <button
            type="button"
            onClick={handleClear}
            disabled={isLoading || messages.length === 0}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-gray-500 dark:text-soil-300 hover:text-red-600 hover:bg-red-50 dark:hover:text-red-400 dark:hover:bg-red-900/20 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            title="Clear conversation"
          >
            <Trash2 size={14} />
            <span className="hidden sm:inline">Clear</span>
          </button>
        </div>
      </div>

      {/* Message list */}
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-4">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-8 text-center">
            <div>
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary-100 dark:bg-soil-700 border border-primary-200 dark:border-soil-600 mb-4">
                <Leaf size={32} className="text-primary-600 dark:text-primary-300" strokeWidth={1.75} />
              </div>
              <h3 className="text-xl font-bold text-primary-800 dark:text-soil-100 mb-1">
                {language === "bn" ? "আমি কীভাবে সাহায্য করতে পারি?" : "How can I help you?"}
              </h3>
              <p className="text-gray-400 dark:text-soil-400 text-sm">
                {language === "bn"
                  ? "নিচের প্রশ্নগুলো থেকে বেছে নিন বা নিজে লিখুন"
                  : "Choose a question below or type your own"}
              </p>
            </div>

            <div className="flex flex-wrap justify-center gap-2 w-full max-w-2xl">
              {SUGGESTED_QUESTIONS.map((q) => (
                <button
                  key={q}
                  type="button"
                  onClick={() => handleSend(q)}
                  className="px-4 py-2 rounded-full bg-primary-50 dark:bg-soil-700 border border-primary-200 dark:border-soil-600 text-sm text-primary-800 dark:text-soil-100 hover:bg-primary-100 hover:border-primary-300 dark:hover:bg-soil-600 transition-colors"
                >
                  {q}
                </button>
              ))}
            </div>

            <p className="text-xs text-gray-400 dark:text-soil-400 text-center mt-4">
              KrishiBot knows about rice, tomato, potato, wheat and jute diseases — ask in English or বাংলা
            </p>
          </div>
        ) : (
          <>
            {messages.map((msg, i) => (
              <MessageBubble
                key={msg.id ?? `msg-${i}`}
                message={msg}
                isStreaming={
                  msg.role === "assistant" &&
                  (msg.id as unknown as string) === streamingId
                }
              />
            ))}

            {isLoading && streamingId !== null && messages.at(-1)?.content === "" && (
              <div className="flex items-center gap-2 text-gray-400 dark:text-soil-400 text-sm pl-11">
                <Loader2 size={15} className="animate-spin" />
                KrishiBot is thinking…
              </div>
            )}
          </>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input area */}
      <div className="shrink-0 bg-white dark:bg-soil-800 border-t border-gray-200 dark:border-soil-700 px-4 py-3 transition-colors">
        <div className="max-w-4xl mx-auto">
          {isListening && (
            <div className="flex items-center gap-2 px-1 mb-1">
              <div className="flex gap-0.5">
                <span className="w-1 h-3 bg-red-500 rounded-full animate-bounce" style={{animationDelay:'0ms'}}/>
                <span className="w-1 h-3 bg-red-500 rounded-full animate-bounce" style={{animationDelay:'150ms'}}/>
                <span className="w-1 h-3 bg-red-500 rounded-full animate-bounce" style={{animationDelay:'300ms'}}/>
              </div>
              <span className="text-xs text-red-500 font-medium">
                Listening... speak now
              </span>
              <span className="text-xs text-gray-400 dark:text-soil-400">
                ({language === "bn" ? "বাংলায় বলুন" : "speak in English"})
              </span>
            </div>
          )}

          <div className="flex items-end gap-3">
            <textarea
              ref={textareaRef}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isLoading}
              placeholder={
                language === "bn"
                  ? "আপনার প্রশ্ন লিখুন… (Enter পাঠাতে, Shift+Enter নতুন লাইন)"
                  : "Type your question… (Enter to send, Shift+Enter for newline)"
              }
              rows={1}
              className="flex-1 resize-none rounded-xl border border-gray-300 dark:border-soil-600 bg-gray-50 dark:bg-soil-700 px-4 py-3 text-sm text-gray-900 dark:text-soil-100 placeholder-gray-400 dark:placeholder-soil-400 focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-transparent disabled:opacity-60 transition-colors overflow-hidden"
            />

            {speechSupported && (
              <button
                onClick={toggleListening}
                type="button"
                title={isListening ? "Stop recording" : "Speak your question"}
                className={`p-2.5 rounded-xl transition-all duration-200 border flex items-center justify-center ${
                  isListening
                    ? "bg-red-500 border-red-500 text-white animate-pulse"
                    : "bg-white dark:bg-soil-700 border-gray-200 dark:border-soil-600 text-gray-500 dark:text-soil-300 hover:border-primary-400 hover:text-primary-600 dark:hover:text-primary-300"
                }`}
              >
                {isListening ? (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                    <rect x="6" y="6" width="12" height="12" rx="2"/>
                  </svg>
                ) : (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
                    <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
                    <line x1="12" y1="19" x2="12" y2="23"/>
                    <line x1="8" y1="23" x2="16" y2="23"/>
                  </svg>
                )}
              </button>
            )}

            <button
              type="button"
              onClick={() => handleSend()}
              disabled={isLoading || !inputText.trim()}
              className="shrink-0 inline-flex items-center justify-center w-11 h-11 rounded-xl bg-primary-600 text-white hover:bg-primary-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors shadow-sm"
              aria-label="Send message"
            >
              {isLoading
                ? <Loader2 size={18} className="animate-spin" />
                : <Send size={18} />
              }
            </button>
          </div>
        </div>

        <div className="flex flex-col items-center gap-1.5 mt-2">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-primary-50 dark:bg-soil-700 border border-primary-100 dark:border-soil-600 text-[10px] font-medium text-primary-700 dark:text-primary-300">
            <Cpu size={10} strokeWidth={2.5} />
            Powered by Qwen2.5 3B
          </span>
          <p className="text-center text-xs text-gray-400 dark:text-soil-400">
            KrishiBot can make mistakes — always verify advice with a local agricultural officer.
          </p>
        </div>
      </div>
    </div>
  );
}
