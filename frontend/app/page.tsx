
"use client";

import {
  ChangeEvent,
  DragEvent,
  useEffect,
  useRef,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import {
  AlertCircle,
  ArrowRight,
  BrainCircuit,
  CheckCircle2,
  FileText,
  LoaderCircle,
  MessageCircle,
  Settings2,
  ShieldCheck,
  Sparkles,
  UploadCloud,
  X,
} from "lucide-react";

const API_URL = (
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000"
).replace(/\/+$/, "");

type UploadStatus =
  | "idle"
  | "uploading"
  | "processing"
  | "success"
  | "error";

type DocumentStatusResponse = {
  status: string;
};

type UploadResponse = {
  id: string | number;
};

const POLLING_INTERVAL = 3000;

const workflowSteps = [
  {
    number: "01",
    title: "Upload",
    description: "Drop in your PDF. No complicated setup.",
    icon: UploadCloud,
  },
  {
    number: "02",
    title: "Process",
    description: "FeedGPT extracts and indexes the content.",
    icon: Settings2,
  },
  {
    number: "03",
    title: "Ask away",
    description: "Get answers grounded in your document.",
    icon: MessageCircle,
  },
];

export default function Home() {
  const router = useRouter();

  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<UploadStatus>("idle");
  const [message, setMessage] = useState("");
  const [isDragging, setIsDragging] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const pollingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(
    null
  );
  const requestInProgressRef = useRef(false);
  const mountedRef = useRef(false);
  const uploadControllerRef = useRef<AbortController | null>(null);
  const pollingControllerRef = useRef<AbortController | null>(null);
  const operationIdRef = useRef(0);

  useEffect(() => {
    mountedRef.current = true;

    return () => {
      mountedRef.current = false;
      operationIdRef.current += 1;

      if (pollingTimerRef.current) {
        clearTimeout(pollingTimerRef.current);
      }

      uploadControllerRef.current?.abort();
      pollingControllerRef.current?.abort();
    };
  }, []);

  function stopPolling() {
    if (pollingTimerRef.current) {
      clearTimeout(pollingTimerRef.current);
      pollingTimerRef.current = null;
    }

    pollingControllerRef.current?.abort();
    pollingControllerRef.current = null;
    requestInProgressRef.current = false;
  }

  function selectFile(selectedFile?: File) {
    if (!selectedFile) return;

    if (status === "uploading" || status === "processing") return;

    const isPdf =
      selectedFile.type === "application/pdf" ||
      selectedFile.name.toLowerCase().endsWith(".pdf");

    if (!isPdf) {
      setFile(null);
      setStatus("error");
      setMessage("Please select a PDF file.");
      return;
    }

    if (selectedFile.size === 0) {
      setFile(null);
      setStatus("error");
      setMessage("This PDF is empty. Please choose another file.");
      return;
    }

    stopPolling();
    setFile(selectedFile);
    setStatus("idle");
    setMessage("");
  }

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    selectFile(event.target.files?.[0]);

    // Permit selecting the same file again.
    event.target.value = "";
  }

  function handleDragOver(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();

    if (status !== "uploading" && status !== "processing") {
      setIsDragging(true);
    }
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setIsDragging(false);

    if (status === "uploading" || status === "processing") return;

    selectFile(event.dataTransfer.files?.[0]);
  }

  function removeFile() {
    if (status === "uploading" || status === "processing") return;

    stopPolling();
    setFile(null);
    setStatus("idle");
    setMessage("");
  }

  async function handleUpload() {
    if (!file || status === "uploading" || status === "processing") {
      return;
    }

    const operationId = ++operationIdRef.current;

    stopPolling();

    const uploadController = new AbortController();
    uploadControllerRef.current = uploadController;

    setStatus("uploading");
    setMessage("Uploading your document...");

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await axios.post<UploadResponse>(
        `${API_URL}/documents`,
        formData,
        {
          signal: uploadController.signal,
        }
      );

      if (
        !mountedRef.current ||
        operationIdRef.current !== operationId
      ) {
        return;
      }

      const documentId = response.data?.id;

      if (
        documentId === undefined ||
        documentId === null ||
        String(documentId).trim() === ""
      ) {
        throw new Error("The server did not return a document ID.");
      }

      setStatus("processing");
      setMessage(
        "Upload complete. We're building your knowledge base..."
      );

      await pollDocumentStatus(String(documentId), operationId);
    } catch (error) {
      if (
        axios.isCancel(error) ||
        (axios.isAxiosError(error) && error.code === "ERR_CANCELED")
      ) {
        return;
      }

      if (
        !mountedRef.current ||
        operationIdRef.current !== operationId
      ) {
        return;
      }

      console.error("Document upload failed:", error);

      setStatus("error");
      setMessage(
        axios.isAxiosError(error)
          ? error.response?.data?.detail ??
              "Upload failed. Check your backend connection and try again."
          : error instanceof Error
            ? error.message
            : "Something went wrong while uploading your document."
      );
    } finally {
      if (uploadControllerRef.current === uploadController) {
        uploadControllerRef.current = null;
      }
    }
  }

  async function pollDocumentStatus(
    documentId: string,
    operationId: number
  ) {
    while (
      mountedRef.current &&
      operationIdRef.current === operationId
    ) {
      if (pollingTimerRef.current) {
        clearTimeout(pollingTimerRef.current);
        pollingTimerRef.current = null;
      }

      const controller = new AbortController();
      pollingControllerRef.current = controller;
      requestInProgressRef.current = true;

      try {
        const response = await axios.get<DocumentStatusResponse>(
          `${API_URL}/documents/${encodeURIComponent(documentId)}/status`,
          { signal: controller.signal }
        );

        if (
          !mountedRef.current ||
          operationIdRef.current !== operationId
        ) {
          return;
        }

        const documentStatus = response.data?.status?.toUpperCase();

        if (documentStatus === "COMPLETED") {
          stopPolling();

          try {
            localStorage.setItem("document_id", documentId);
          } catch (storageError) {
            console.error("Could not save document ID:", storageError);
            setStatus("error");
            setMessage(
              "The document is ready, but browser storage is unavailable. Please enable site storage and try again."
            );
            return;
          }

          setStatus("success");
          setMessage("Your document is ready. Let's start chatting!");

          router.push("/chat");
          return;
        }

        if (
          documentStatus === "FAILED" ||
          documentStatus === "PARTIAL"
        ) {
          stopPolling();
          setStatus("error");
          setMessage(
            documentStatus === "PARTIAL"
              ? "Your document was only partially processed. Please check the backend status."
              : "Document processing failed. Please try again."
          );
          return;
        }

        // Any other status is treated as still processing.
        setMessage("Extracting, chunking and indexing your PDF...");
      } catch (error) {
        if (
          axios.isCancel(error) ||
          (axios.isAxiosError(error) && error.code === "ERR_CANCELED")
        ) {
          return;
        }

        if (
          !mountedRef.current ||
          operationIdRef.current !== operationId
        ) {
          return;
        }

        // Temporary status failures should not immediately fail the job.
        console.error("Document status check failed:", error);
        setMessage(
          "Still waiting for the processing service. Retrying..."
        );
      } finally {
        requestInProgressRef.current = false;

        if (pollingControllerRef.current === controller) {
          pollingControllerRef.current = null;
        }
      }

      if (
        !mountedRef.current ||
        operationIdRef.current !== operationId
      ) {
        return;
      }

      await new Promise<void>((resolve) => {
        pollingTimerRef.current = setTimeout(() => {
          pollingTimerRef.current = null;
          resolve();
        }, POLLING_INTERVAL);
      });
    }
  }

  const busy = status === "uploading" || status === "processing";

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#080711] text-white selection:bg-violet-500/30">
      {/* Ambient background */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-40 top-32 h-[450px] w-[450px] rounded-full bg-violet-700/20 blur-[140px]" />
        <div className="absolute -right-32 top-64 h-[450px] w-[450px] rounded-full bg-indigo-600/15 blur-[150px]" />
        <div className="absolute bottom-0 left-1/2 h-80 w-[650px] -translate-x-1/2 rounded-full bg-fuchsia-700/10 blur-[130px]" />

        <div className="absolute inset-0 bg-[linear-gradient(to_right,#a78bfa08_1px,transparent_1px),linear-gradient(to_bottom,#a78bfa08_1px,transparent_1px)] bg-[size:44px_44px] [mask-image:linear-gradient(to_bottom,white,transparent_90%)]" />
      </div>

      {/* Navbar */}
      <header className="relative z-10 border-b border-white/[0.07] bg-[#080711]/70 backdrop-blur-2xl">
        <nav className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 sm:px-8">
          <a href="/" className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 text-white shadow-lg shadow-violet-600/30">
              <BrainCircuit size={23} />
            </div>

            <span className="text-xl font-black tracking-tight">
              Feed<span className="text-violet-400">GPT</span>
            </span>
          </a>

          <div className="flex items-center gap-3 sm:gap-5">
            <div className="hidden items-center gap-2 rounded-full border border-emerald-400/15 bg-emerald-400/[0.07] px-3 py-1.5 text-xs font-medium text-emerald-400 sm:flex">
              <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400 shadow-[0_0_10px_#34d399]" />
              Self-hosted
            </div>

            <span className="hidden text-sm text-zinc-500 sm:block">
              Your documents. Your AI.
            </span>

            <button
              type="button"
              onClick={() => router.push("/chat")}
              className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-sm font-medium text-zinc-300 transition hover:border-violet-400/40 hover:bg-violet-500/10 hover:text-white"
            >
              <MessageCircle size={16} />
              <span className="hidden sm:inline">Open chat</span>
            </button>
          </div>
        </nav>
      </header>

      {/* Main content */}
      <section className="relative z-10 mx-auto max-w-7xl px-5 pb-16 pt-14 sm:px-8 sm:pt-20">
        {/* Hero */}
        <div className="mx-auto max-w-3xl text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-violet-400/20 bg-violet-500/[0.08] px-4 py-2 text-sm font-medium text-violet-300 shadow-[0_0_35px_rgba(139,92,246,0.07)]">
            <Sparkles size={15} className="text-fuchsia-400" />
            Your PDFs just got a brain
          </div>

          <h1 className="text-4xl font-black leading-[1.1] tracking-tight sm:text-6xl lg:text-7xl">
            Upload. Process.
            <br />
            <span className="bg-gradient-to-r from-violet-400 via-fuchsia-400 to-indigo-400 bg-clip-text text-transparent">
              Ask anything.
            </span>
          </h1>

          <p className="mx-auto mt-6 max-w-xl text-base leading-7 text-zinc-400 sm:text-lg">
            Turn those long PDFs into a personal AI knowledge base.
            Upload your document, let FeedGPT do the heavy lifting, and
            get straight to the good stuff.
          </p>
        </div>

        {/* Upload card */}
        <div className="mx-auto mt-10 max-w-2xl">
          <div className="rounded-[28px] border border-white/[0.09] bg-[#100e1c]/85 p-4 shadow-[0_25px_120px_-30px_rgba(124,58,237,0.25)] backdrop-blur-2xl sm:p-7">
            <div className="mb-5 flex items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold tracking-tight">
                  Your next big idea starts here.
                </h2>
                <p className="mt-1 text-sm text-zinc-500">
                  One PDF away from a smarter workflow.
                </p>
              </div>

              <div className="hidden h-12 w-12 items-center justify-center rounded-2xl border border-violet-400/15 bg-violet-500/10 text-violet-300 sm:flex">
                <UploadCloud size={25} />
              </div>
            </div>

            {/* Drop zone */}
            <div
              onDragOver={handleDragOver}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              onClick={() => {
                if (!busy) fileInputRef.current?.click();
              }}
              onKeyDown={(event) => {
                if (
                  !busy &&
                  (event.key === "Enter" || event.key === " ")
                ) {
                  event.preventDefault();
                  fileInputRef.current?.click();
                }
              }}
              role="button"
              tabIndex={busy ? -1 : 0}
              aria-label="Choose or drop a PDF file"
              aria-disabled={busy}
              className={`group rounded-2xl border-2 border-dashed p-7 text-center transition-all duration-200 sm:p-10 ${
                isDragging
                  ? "scale-[1.01] border-violet-400 bg-violet-500/15"
                  : "border-white/[0.12] bg-white/[0.02] hover:border-violet-400/50 hover:bg-violet-500/[0.05]"
              } ${busy ? "cursor-not-allowed opacity-60" : "cursor-pointer"}`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,application/pdf"
                onChange={handleFileChange}
                disabled={busy}
                className="hidden"
              />

              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-violet-400/20 bg-gradient-to-br from-violet-500/20 to-indigo-500/10 text-violet-300 shadow-[0_0_40px_rgba(139,92,246,0.12)] transition duration-200 group-hover:-translate-y-1 group-hover:border-violet-400/40 group-hover:shadow-[0_0_45px_rgba(139,92,246,0.22)]">
                <UploadCloud size={31} />
              </div>

              <p className="mt-5 text-lg font-bold">
                {isDragging
                  ? "Drop it like it's hot"
                  : "Drop your PDF here"}
              </p>

              <p className="mt-2 text-sm text-zinc-500">
                or{" "}
                <span className="font-semibold text-violet-300 group-hover:text-violet-200">
                  browse files
                </span>{" "}
                from your device
              </p>

              <p className="mt-4 text-xs text-zinc-600">
                PDF only · Choose a file you have permission to use
              </p>
            </div>

            {/* Selected file */}
            {file && (
              <div className="mt-4 flex items-center gap-3 rounded-2xl border border-white/[0.08] bg-white/[0.035] p-4 transition hover:border-violet-400/20">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-rose-400/15 bg-rose-500/10 text-rose-400">
                  <FileText size={23} />
                </div>

                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-zinc-200">
                    {file.name}
                  </p>
                  <p className="mt-1 text-xs text-zinc-500">
                    {(file.size / 1024 / 1024).toFixed(2)} MB · PDF
                    document
                  </p>
                </div>

                {status === "success" ? (
                  <CheckCircle2
                    className="shrink-0 text-emerald-400"
                    size={20}
                  />
                ) : (
                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      removeFile();
                    }}
                    disabled={busy}
                    aria-label="Remove selected file"
                    className="rounded-lg p-2 text-zinc-500 transition hover:bg-rose-500/10 hover:text-rose-400 disabled:opacity-40"
                  >
                    <X size={19} />
                  </button>
                )}
              </div>
            )}

            {/* Upload action */}
            <button
              type="button"
              onClick={handleUpload}
              disabled={!file || busy}
              className="mt-5 flex w-full items-center justify-center gap-3 rounded-2xl bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 px-5 py-4 font-bold text-white shadow-lg shadow-violet-900/30 transition duration-200 hover:-translate-y-0.5 hover:brightness-110 hover:shadow-xl hover:shadow-violet-900/40 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:translate-y-0 disabled:hover:brightness-100"
            >
              {busy ? (
                <>
                  <LoaderCircle size={20} className="animate-spin" />
                  {status === "uploading"
                    ? "Uploading PDF..."
                    : "Building your knowledge base..."}
                </>
              ) : status === "success" ? (
                <>
                  <CheckCircle2 size={20} />
                  Document ready
                </>
              ) : (
                <>
                  <UploadCloud size={20} />
                  Upload & get started
                  <ArrowRight size={19} />
                </>
              )}
            </button>

            {/* Feedback */}
            {message && (
              <div
                role="status"
                aria-live="polite"
                className={`mt-4 flex items-start gap-2 rounded-xl border p-3 text-sm ${
                  status === "error"
                    ? "border-rose-400/15 bg-rose-500/[0.08] text-rose-300"
                    : status === "success"
                      ? "border-emerald-400/15 bg-emerald-500/[0.08] text-emerald-300"
                      : "border-violet-400/15 bg-violet-500/[0.08] text-violet-300"
                }`}
              >
                {status === "error" ? (
                  <AlertCircle
                    size={18}
                    className="mt-0.5 shrink-0"
                  />
                ) : status === "success" ? (
                  <CheckCircle2
                    size={18}
                    className="mt-0.5 shrink-0"
                  />
                ) : (
                  <LoaderCircle
                    size={18}
                    className="mt-0.5 shrink-0 animate-spin"
                  />
                )}

                <span>{message}</span>
              </div>
            )}

            <div className="mt-5 flex items-center justify-center gap-2 text-xs text-zinc-500">
              <ShieldCheck size={16} className="text-emerald-400" />
              Processed by your configured FeedGPT backend.
            </div>
          </div>
        </div>

        {/* Workflow cards */}
        <div className="mx-auto mt-14 grid max-w-4xl gap-4 sm:grid-cols-3 sm:gap-6">
          {workflowSteps.map((step) => {
            const Icon = step.icon;

            return (
              <div
                key={step.number}
                className="group rounded-2xl border border-white/[0.07] bg-[#100e1c]/60 p-5 transition duration-200 hover:-translate-y-1 hover:border-violet-400/25 hover:bg-[#151127] hover:shadow-xl hover:shadow-violet-950/20"
              >
                <div className="flex items-center justify-between">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-violet-400/15 bg-violet-500/10 text-violet-300 transition group-hover:border-violet-400/30 group-hover:bg-violet-500/20">
                    <Icon size={22} />
                  </div>

                  <span className="text-sm font-black tracking-widest text-violet-400/40">
                    {step.number}
                  </span>
                </div>

                <h3 className="mt-4 font-bold text-zinc-100">
                  {step.title}
                </h3>

                <p className="mt-1 text-sm leading-6 text-zinc-500">
                  {step.description}
                </p>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <footer className="mt-14 flex flex-col items-center justify-center gap-2 text-center text-xs text-zinc-600 sm:flex-row sm:gap-3">
          <span>Made for curious minds.</span>
          <span className="hidden sm:inline">·</span>
          <span className="flex items-center gap-1.5">
            <ShieldCheck size={13} />
            Self-hosted AI workflow
          </span>
        </footer>
      </section>
    </main>
  );
}
