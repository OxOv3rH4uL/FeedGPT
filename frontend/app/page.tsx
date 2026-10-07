"use client";

import { ChangeEvent, useState } from "react";
import axios from "axios";
const API_URL = "http://localhost:8000";

type UploadStatus =
  | "idle"
  | "uploading"
  | "success"
  | "error"
  | "failed"
  | "uploaded";

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<UploadStatus>("idle");
  const [message, setMessage] = useState("");

  function handleFileChange(
    event: ChangeEvent<HTMLInputElement>,
  ) {
    const selectedFile = event.target.files?.[0];

    if (!selectedFile) {
      return;
    }

    if (selectedFile.type !== "application/pdf") {
      setFile(null);
      setStatus("error");
      setMessage("Please select a PDF file.");
      return;
    }

    setFile(selectedFile);
    setStatus("idle");
    setMessage("");
  }

  async function handleUpload() {
    if (!file) {
      setStatus("error");
      setMessage("Please select a PDF file first.");
      return;
    }

    setStatus("uploading");
    setMessage("");

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await axios.post(
        `${API_URL}/documents`,formData
      );
      if(response.status === 200){
        const data = response.data;
        setStatus("uploaded");
        setMessage(
          `Upload successful. Time for processing`);
        //need to implement ws or sse
        const timer = setInterval(async ()=>{
          const r = await axios.get(`${API_URL}/documents/${data.id}/status`);
          if(r.data.status === "COMPLETED"){
            clearInterval(timer);
            setStatus("success");
            setMessage("Document is ready, you can get the knowledge");
          }else if(r.data.status === "PARTIAL" || r.data.status === "FAILED"){
            clearInterval(timer);
            setStatus("error");
            setMessage("Document failed to process, vera yethana pdf try panra dei")
          }
        }, 3000);
      }else{
        setStatus("failed");
        setMessage(
          `Upload is not successful broski`,
        );
      }
    } catch (error) {
      console.error(error);

      setStatus("error");
      setMessage(
        "Something went wrong while uploading the document.",
      );
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-8">
      <div className="w-full max-w-xl">
        <h1 className="text-3xl font-bold">
          FeedGPT
        </h1>

        <p className="mt-2 text-gray-600">
          Upload a PDF to start processing.
        </p>

        <div className="mt-8 rounded-lg border p-6">
          <label
            htmlFor="pdf-upload"
            className="block cursor-pointer rounded-md border-2 border-dashed p-10 text-center"
          >
            <p className="font-medium">
              Choose a PDF
            </p>

            <p className="mt-2 text-sm text-gray-500">
              PDF files only
            </p>

            <input
              id="pdf-upload"
              type="file"
              accept="application/pdf"
              onChange={handleFileChange}
              className="hidden"
            />
          </label>

          {file && (
            <div className="mt-4 rounded-md bg-gray-100 p-4">
              <p className="font-medium">
                {file.name}
              </p>

              <p className="mt-1 text-sm text-gray-500">
                {(file.size / 1024 / 1024).toFixed(2)} MB
              </p>
            </div>
          )}

          <button
            onClick={handleUpload}
            disabled={!file || status === "uploading"}
            className="mt-6 w-full rounded-md bg-black px-4 py-3 text-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            {status === "uploading"
              ? "Uploading..."
              : "Upload Document"}
          </button>

          {message && (
            <p
              className={`mt-4 text-sm ${
                status === "error"
                  ? "text-red-600"
                  : status === "success"
                    ? "text-green-600"
                    : "text-gray-600"
              }`}
            >
              {message}
            </p>
          )}
        </div>
      </div>
    </main>
  );
}

