"use client";

import { useEffect, useRef, useState } from "react";
import { Send, Mic, Square } from "lucide-react";

// ----- Kiểu tối giản cho Web Speech API (không có sẵn trong lib DOM) -----
interface SpeechResultLike {
  isFinal: boolean;
  0: { transcript: string };
}
interface SpeechEventLike {
  resultIndex: number;
  results: { length: number } & Record<number, SpeechResultLike>;
}
interface SpeechRecognitionLike {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  onresult: ((e: SpeechEventLike) => void) | null;
  onerror: (() => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
}

function getSpeechCtor(): (new () => SpeechRecognitionLike) | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as {
    SpeechRecognition?: new () => SpeechRecognitionLike;
    webkitSpeechRecognition?: new () => SpeechRecognitionLike;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

export function ChatInput({
  onSend,
  disabled,
}: {
  onSend: (text: string) => void;
  disabled?: boolean;
}) {
  const [value, setValue] = useState("");
  const [recording, setRecording] = useState(false);
  const [voiceSupported, setVoiceSupported] = useState(false);
  const taRef = useRef<HTMLTextAreaElement>(null);
  const recRef = useRef<SpeechRecognitionLike | null>(null);

  useEffect(() => {
    setVoiceSupported(getSpeechCtor() !== null);
    return () => recRef.current?.stop();
  }, []);

  function autoGrow() {
    const ta = taRef.current;
    if (!ta) return;
    ta.style.height = "auto";
    ta.style.height = Math.min(ta.scrollHeight, 200) + "px";
  }

  function toggleRecord() {
    if (recording) {
      recRef.current?.stop();
      return;
    }
    const Ctor = getSpeechCtor();
    if (!Ctor) return;
    const rec = new Ctor();
    rec.lang = "vi-VN";
    rec.interimResults = true;
    rec.continuous = false;
    const base = value ? value.trimEnd() + " " : "";
    rec.onresult = (e) => {
      let text = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        text += e.results[i][0].transcript;
      }
      setValue(base + text);
      requestAnimationFrame(autoGrow);
    };
    rec.onerror = () => setRecording(false);
    rec.onend = () => setRecording(false);
    recRef.current = rec;
    try {
      rec.start();
      setRecording(true);
    } catch {
      setRecording(false);
    }
  }

  function submit() {
    const text = value.trim();
    if (!text || disabled) return;
    recRef.current?.stop();
    onSend(text);
    setValue("");
    requestAnimationFrame(() => {
      if (taRef.current) taRef.current.style.height = "auto";
    });
  }

  return (
    <div className="border-t border-hpu-border bg-hpu-surface px-3 py-3 sm:px-4">
      <div className="mx-auto flex w-full max-w-3xl items-end gap-2">
        {voiceSupported && (
          <button
            onClick={toggleRecord}
            disabled={disabled}
            aria-label={recording ? "Dừng ghi âm" : "Ghi âm câu hỏi"}
            title={recording ? "Dừng ghi âm" : "Nói câu hỏi"}
            className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full border transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
              recording
                ? "animate-pulse border-hpu-accent bg-hpu-accent/10 text-hpu-accent"
                : "border-hpu-border bg-white text-hpu-muted hover:border-hpu-primary hover:text-hpu-primary"
            }`}
          >
            {recording ? <Square className="h-4 w-4 fill-current" /> : <Mic className="h-5 w-5" />}
          </button>
        )}

        <textarea
          ref={taRef}
          rows={1}
          value={value}
          placeholder={
            recording
              ? "Đang nghe… anh/chị cứ nói ạ"
              : "Nhập câu hỏi về phần mềm… (Enter để gửi, Shift+Enter xuống dòng)"
          }
          onChange={(e) => {
            setValue(e.target.value);
            autoGrow();
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              submit();
            }
          }}
          className="max-h-[200px] flex-1 resize-none rounded-2xl border border-hpu-border bg-white px-4 py-3 text-[15px] leading-relaxed text-hpu-ink outline-none placeholder:text-hpu-muted focus:border-hpu-primary focus:ring-2 focus:ring-hpu-primary/30"
        />
        <button
          onClick={submit}
          disabled={disabled || !value.trim()}
          aria-label="Gửi"
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-hpu-primary text-white transition-colors hover:bg-hpu-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-hpu-primary focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <Send className="h-5 w-5" />
        </button>
      </div>
      <p className="mx-auto mt-2 max-w-3xl text-center text-xs text-hpu-muted">
        Trợ lý HPU có thể nhầm. Hãy kiểm chứng các thao tác quan trọng theo tài liệu chính thức.
      </p>
    </div>
  );
}
