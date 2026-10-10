
"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import {
  ArrowUp,
  BrainCircuit,
  Check,
  Eye,
  EyeOff,
  FileText,
  KeyRound,
  LoaderCircle,
  MessageSquare,
  Plus,
  Settings2,
  ShieldCheck,
  Sparkles,
  UserRound,
  X,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
};

type LLMConfig = {
  apiUrl: string;
  apiKey: string;
  model: string;
};

const API_URL =
  process.env.NEXT_PUBLIC_RETRIEVAL_API_URL ?? "http://localhost:8000";

const LLM_CONFIG_KEY = "feedgpt_llm_config";

export default function ChatPage() {
  const router = useRouter();

  const [documentId, setDocumentId] = useState("");
  const [config, setConfig] = useState<LLMConfig>({
    apiUrl: "",
    apiKey: "",
    model: "",
  });

  const [credentialsSubmitted, setCredentialsSubmitted] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState("");


  const abortRef = useRef<AbortController | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Read the document ID after mounting in the browser.
  useEffect(() => {
  try {
    const storedDocumentId = localStorage.getItem("document_id");
    const storedConfig = localStorage.getItem(LLM_CONFIG_KEY);

    if (storedDocumentId) {
      setDocumentId(storedDocumentId);
    }

    if (storedConfig) {
      const parsed: LLMConfig = JSON.parse(storedConfig);

      if (parsed.apiUrl && parsed.apiKey && parsed.model) {
        setConfig(parsed);
        setCredentialsSubmitted(true);
      }
    }
  } catch (error) {
    console.error("Failed to load saved configuration:", error);
    setError("Could not load your saved configuration.");
  }
}, []);

  function handleCredentialsSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (!documentId.trim()) {
      setError("No document ID was found. Please upload and process a PDF first.");
      return;
    }

    if (!config.apiUrl.trim() || !config.apiKey.trim() || !config.model.trim()) {
      setError("Please complete all LLM configuration fields.");
      return;
    }

    let parsedUrl: URL;

    try {
      parsedUrl = new URL(config.apiUrl.trim());
    } catch {
      setError("Enter a valid LLM API endpoint URL.");
      return;
    }

    if (
      parsedUrl.protocol !== "https:" &&
      parsedUrl.hostname !== "localhost" &&
      parsedUrl.hostname !== "127.0.0.1"
    ) {
      setError("Use HTTPS for remote LLM API endpoints.");
      return;
    }
    const normalizedConfig = {
    apiUrl: config.apiUrl.trim(),
    apiKey: config.apiKey.trim(),
    model: config.model.trim(),
    };
    // Credentials remain in component memory; do not persist the API key.
    
    try {
        localStorage.setItem(
        LLM_CONFIG_KEY,
        JSON.stringify(normalizedConfig)
        );
        setConfig(normalizedConfig);
        setCredentialsSubmitted(true);
    }catch{
        setError("Could not save your configuration in browser storage.");
    }
  }

  async function sendMessage() {
    const query = input.trim();

    if (
      !query ||
      !documentId.trim() ||
      !credentialsSubmitted ||
      isStreaming
    ) {
      return;
    }

    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: "user",
      content: query,
    };

    const assistantMessage: Message = {
      id: crypto.randomUUID(),
      role: "assistant",
      content: "",
    };

    setMessages((previous) => [
      ...previous,
      userMessage,
      assistantMessage,
    ]);

    setInput("");
    setError("");
    setIsStreaming(true);

    const controller = new AbortController();
    abortRef.current = controller;

    function appendToken(token: string) {
      setMessages((previous) =>
        previous.map((message) =>
          message.id === assistantMessage.id
            ? { ...message, content: message.content + token }
            : message
        )
      );
    }

    try {
      // The backend must explicitly support these request fields.
      // We will align this contract with the FastAPI implementation next.
      const response = await axios.post(
        `${API_URL}/chat`,
        {
          document_id: documentId,
          query,
          llm_api_url: config.apiUrl,
          llm_api_key: config.apiKey,
          llm_model: config.model,
        },
        {
          signal: controller.signal,
          responseType: "text",
          headers: {
            Accept: "text/event-stream",
            "Content-Type": "application/json",
          },
          onDownloadProgress: undefined,
        }
      );

      // This currently handles a complete text response.
      // Incremental Axios SSE parsing will be implemented next.
      const result =
        typeof response.data === "string"
          ? response.data
          : JSON.stringify(response.data);

      appendToken(result);
    } catch (err) {
      if (axios.isCancel(err)) return;

      setError(
        axios.isAxiosError(err)
          ? err.response?.data?.detail ??
              "The request failed. Check your API configuration and backend."
          : "Something went wrong while generating the answer."
      );

      setMessages((previous) =>
        previous.filter((message) => message.id !== assistantMessage.id)
      );
    } finally {
      abortRef.current = null;
      setIsStreaming(false);
      textareaRef.current?.focus();
    }
  }

  function stopGeneration() {
    abortRef.current?.abort();
    abortRef.current = null;
    setIsStreaming(false);
  }

  function newChat() {
    if (isStreaming) return;

    setMessages([]);
    setInput("");
    setError("");
  }

  // STEP 2: LLM credential setup screen.
  if (!credentialsSubmitted) {
    return (
      <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#080711] px-4 py-10 text-white">
        <div className="pointer-events-none absolute -left-32 top-10 h-96 w-96 rounded-full bg-violet-700/20 blur-[130px]" />
        <div className="pointer-events-none absolute -right-32 bottom-0 h-96 w-96 rounded-full bg-indigo-700/20 blur-[130px]" />

        <div className="relative z-10 w-full max-w-lg">
          <button
            onClick={() => router.push("/")}
            className="mb-8 flex items-center gap-3"
          >
            <div className="flex size-11 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 shadow-lg shadow-violet-600/20">
              <BrainCircuit size={24} />
            </div>
            <span className="text-xl font-bold tracking-tight">
              Feed<span className="text-violet-400">GPT</span>
            </span>
          </button>

          <div className="rounded-3xl border border-white/10 bg-[#100e1c]/90 p-6 shadow-2xl shadow-violet-950/30 backdrop-blur-xl sm:p-8">
            <div className="mb-6 flex size-14 items-center justify-center rounded-2xl border border-violet-400/20 bg-violet-500/10 text-violet-300">
              <KeyRound size={27} />
            </div>

            <div className="inline-flex items-center gap-2 rounded-full border border-violet-400/20 bg-violet-500/[0.08] px-3 py-1.5 text-xs font-medium text-violet-300">
              <Sparkles size={14} />
              Almost ready
            </div>

            <h1 className="mt-4 text-3xl font-bold tracking-tight">
              Connect your AI
            </h1>

            <p className="mt-3 text-sm leading-6 text-zinc-400">
              Add your LLM provider details to start chatting with your
              document. FeedGPT will use these settings for your requests.
            </p>

            <div className="mt-6 flex items-start gap-3 rounded-xl border border-white/[0.08] bg-white/[0.03] p-3">
              <FileText className="mt-0.5 size-5 shrink-0 text-violet-300" />
              <div className="min-w-0">
                <p className="text-xs text-zinc-500">Selected document</p>
                <p className="mt-1 break-all text-sm font-medium">
                  {documentId || "No document found"}
                </p>
              </div>
              {documentId && (
                <Check className="size-4 shrink-0 text-emerald-400" />
              )}
            </div>

            <form onSubmit={handleCredentialsSubmit} className="mt-6 space-y-5">
              <div>
                <label htmlFor="llm-api-url" className="mb-2 block text-sm font-medium text-zinc-200">
                  LLM API endpoint
                </label>
                <input
                  id="llm-api-url"
                  type="url"
                  required
                  value={config.apiUrl}
                  onChange={(event) =>
                    setConfig((previous) => ({
                      ...previous,
                      apiUrl: event.target.value,
                    }))
                  }
                  placeholder="https://your-provider.example/v1/chat/completions"
                  className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none transition placeholder:text-zinc-600 focus:border-violet-400/60 focus:ring-2 focus:ring-violet-500/10"
                />
              </div>

              <div>
                <label htmlFor="llm-api-key" className="mb-2 block text-sm font-medium text-zinc-200">
                  API key
                </label>
                <div className="relative">
                  <input
                    id="llm-api-key"
                    type={showApiKey ? "text" : "password"}
                    autoComplete="off"
                    required
                    value={config.apiKey}
                    onChange={(event) =>
                      setConfig((previous) => ({
                        ...previous,
                        apiKey: event.target.value,
                      }))
                    }
                    placeholder="Enter your secret API key"
                    className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 pr-12 text-sm text-white outline-none transition placeholder:text-zinc-600 focus:border-violet-400/60 focus:ring-2 focus:ring-violet-500/10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowApiKey((value) => !value)}
                    aria-label={showApiKey ? "Hide API key" : "Show API key"}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white"
                  >
                    {showApiKey ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <div>
                <label htmlFor="llm-model" className="mb-2 block text-sm font-medium text-zinc-200">
                  Model name
                </label>
                <input
                  id="llm-model"
                  type="text"
                  required
                  value={config.model}
                  onChange={(event) =>
                    setConfig((previous) => ({
                      ...previous,
                      model: event.target.value,
                    }))
                  }
                  placeholder="e.g. gpt-4o-mini"
                  className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none transition placeholder:text-zinc-600 focus:border-violet-400/60 focus:ring-2 focus:ring-violet-500/10"
                />
              </div>

              {error && (
                <p role="alert" className="rounded-xl border border-rose-400/20 bg-rose-500/10 p-3 text-sm text-rose-300">
                  {error}
                </p>
              )}

              <Button
                type="submit"
                disabled={!documentId}
                className="h-12 w-full bg-gradient-to-r from-violet-600 to-indigo-600 font-semibold hover:brightness-110 disabled:opacity-40"
              >
                Continue to chat
                <ArrowUp className="ml-2 size-4 rotate-45" />
              </Button>
            </form>

            <div className="mt-5 flex items-start gap-2 text-xs leading-5 text-zinc-500">
              <ShieldCheck className="mt-0.5 size-4 shrink-0 text-emerald-400" />
              Your API key is kept in page memory and is not saved to
              localStorage. Refreshing the page clears it.
            </div>
          </div>

          <p className="mt-5 text-center text-xs text-zinc-600">
            Your documents. Your AI. Your choice.
          </p>
        </div>
      </main>
    );
  }

  // Chat UI appears after credentials are submitted.
  return (
    <main className="flex h-dvh overflow-hidden bg-[#080711] text-zinc-100">
      <aside className="hidden w-64 shrink-0 flex-col border-r border-white/[0.07] bg-[#0d0b16] p-3 md:flex">
        <button
          onClick={() => router.push("/")}
          className="flex h-12 items-center gap-2 px-2 text-left"
        >
          <div className="flex size-9 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600">
            <BrainCircuit className="size-5" />
          </div>
          <span className="text-lg font-bold">
            Feed<span className="text-violet-400">GPT</span>
          </span>
        </button>

        <Button
          variant="secondary"
          className="mt-5 justify-start gap-2 border border-white/10 bg-white/[0.04] hover:bg-white/[0.08]"
          onClick={newChat}
          disabled={isStreaming}
        >
          <Plus className="size-4" />
          New chat
        </Button>

        <p className="mt-8 px-2 text-xs font-medium uppercase tracking-wider text-zinc-500">
          Knowledge source
        </p>

        <div className="mt-3 rounded-xl border border-white/[0.08] bg-white/[0.025] p-3">
          <div className="flex items-center gap-2">
            <FileText className="size-4 shrink-0 text-violet-300" />
            <span className="text-sm font-medium">Selected document</span>
          </div>
          <p className="mt-3 break-all text-xs text-zinc-500">{documentId}</p>
        </div>

        <Separator className="my-5 bg-white/[0.08]" />

        <p className="px-2 text-xs font-medium uppercase tracking-wider text-zinc-500">
          Current model
        </p>
        <div className="mt-3 rounded-xl border border-white/[0.08] bg-white/[0.025] p-3">
          <div className="flex items-center gap-2 text-sm">
            <Settings2 className="size-4 text-violet-300" />
            <span className="break-all">{config.model}</span>
          </div>
          <button
            onClick={() => {
              if (isStreaming) return;
              setCredentialsSubmitted(false);
              setConfig((previous) => ({ ...previous, apiKey: "" }));
            }}
            className="mt-3 text-xs text-violet-300 hover:text-violet-200"
          >
            Change configuration
          </button>
        </div>

        <div className="mt-auto flex items-center gap-3 rounded-xl p-2">
          <Avatar className="size-9">
            <AvatarFallback className="bg-violet-500/15 text-violet-300">
              <UserRound className="size-4" />
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="text-sm font-medium">FeedGPT workspace</p>
            <p className="text-xs text-zinc-500">Document assistant</p>
          </div>
        </div>
      </aside>

      <section className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-14 shrink-0 items-center justify-between border-b border-white/[0.07] px-4 md:px-6">
          <div>
            <h1 className="text-sm font-semibold">Document Chat</h1>
            <p className="text-xs text-zinc-500">
              Chatting with {config.model}
            </p>
          </div>
          <div className="flex items-center gap-1.5 rounded-full border border-emerald-400/15 bg-emerald-400/[0.06] px-2.5 py-1 text-xs text-emerald-300">
            <Check className="size-3.5" />
            Configured
          </div>
        </header>

        <ScrollArea className="min-h-0 flex-1">
          <div className="mx-auto w-full max-w-3xl px-4 py-8 md:px-8">
            {messages.length === 0 ? (
              <div className="flex min-h-[55vh] flex-col items-center justify-center text-center">
                <div className="mb-5 flex size-16 items-center justify-center rounded-2xl border border-violet-400/15 bg-violet-500/10 text-violet-300 shadow-lg shadow-violet-950/20">
                  <BrainCircuit className="size-8" />
                </div>
                <h2 className="text-2xl font-semibold tracking-tight">
                  Your document. Your AI.
                </h2>
                <p className="mt-2 max-w-md text-sm leading-6 text-zinc-400">
                  Your LLM configuration is ready. Ask questions about
                  your selected document.
                </p>

                <div className="mt-7 grid w-full max-w-xl gap-3 sm:grid-cols-2">
                  {[
                    "Define productivity",
                    "Summarize the main findings",
                    "What are the key statistics?",
                    "Explain the conclusion",
                  ].map((suggestion) => (
                    <button
                      key={suggestion}
                      onClick={() => {
                        setInput(suggestion);
                        textareaRef.current?.focus();
                      }}
                      className="rounded-xl border border-white/[0.08] bg-white/[0.025] p-4 text-left text-sm text-zinc-300 transition hover:border-violet-400/25 hover:bg-violet-500/[0.06]"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="space-y-8">
                {messages.map((message) => (
                  <div key={message.id} className="flex gap-3 sm:gap-4">
                    <Avatar className="mt-0.5 size-8 shrink-0">
                      <AvatarFallback className="bg-violet-500/10 text-violet-300">
                        {message.role === "user" ? (
                          <UserRound className="size-4" />
                        ) : (
                          <BrainCircuit className="size-4" />
                        )}
                      </AvatarFallback>
                    </Avatar>

                    <div className="min-w-0 flex-1 pt-1">
                      <p className="mb-2 text-sm font-semibold">
                        {message.role === "user" ? "You" : "FeedGPT"}
                      </p>
                      <div className="whitespace-pre-wrap break-words text-sm leading-7 text-zinc-300">
                        {message.content ||
                          (isStreaming && message.role === "assistant"
                            ? "Thinking..."
                            : "No response received.")}
                      </div>
                    </div>
                  </div>
                ))}
                <div ref={bottomRef} />
              </div>
            )}

            {error && (
              <div role="alert" className="mt-6 rounded-xl border border-rose-400/20 bg-rose-500/[0.07] p-4 text-sm">
                <p className="font-medium text-rose-300">
                  Unable to complete the request
                </p>
                <p className="mt-1 break-words text-zinc-400">{error}</p>
              </div>
            )}
          </div>
        </ScrollArea>

        <div className="shrink-0 px-3 pb-3 pt-2 md:px-6 md:pb-5">
          <div className="mx-auto max-w-3xl">
            <div className="rounded-2xl border border-white/[0.09] bg-[#100e1c] shadow-lg shadow-black/10 focus-within:border-violet-400/30">
              <Textarea
                ref={textareaRef}
                value={input}
                onChange={(event) => setInput(event.target.value)}
                onKeyDown={(event) => {
                  if (
                    event.key === "Enter" &&
                    !event.shiftKey &&
                    !event.nativeEvent.isComposing
                  ) {
                    event.preventDefault();
                    void sendMessage();
                  }
                }}
                placeholder="Ask anything about this document..."
                disabled={isStreaming}
                className="max-h-48 min-h-14 resize-none border-0 bg-transparent px-4 py-4 text-white shadow-none placeholder:text-zinc-600 focus-visible:ring-0"
                rows={1}
              />

              <div className="flex items-center justify-between px-3 pb-3">
                <p className="text-xs text-zinc-600">
                  Enter to send · Shift + Enter for a new line
                </p>

                {isStreaming ? (
                  <Button
                    size="icon"
                    variant="secondary"
                    onClick={stopGeneration}
                    aria-label="Stop generation"
                  >
                    <X className="size-4" />
                  </Button>
                ) : (
                  <Button
                    size="icon"
                    onClick={() => void sendMessage()}
                    disabled={!input.trim()}
                    aria-label="Send message"
                    className="bg-violet-600 text-white hover:bg-violet-500"
                  >
                    <ArrowUp className="size-4" />
                  </Button>
                )}
              </div>
            </div>

            <p className="mt-3 text-center text-[11px] text-zinc-600">
              <ShieldCheck className="mr-1 inline size-3" />
              Your API key is held in page memory, not browser storage.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
