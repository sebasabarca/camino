"use client";
import { Volume2 } from "lucide-react";
import { speak } from "@/lib/speech";

export function SayIt({ text }: { text: string }) {
  return (
    <button
      type="button"
      onClick={() => speak([{ text }])}
      aria-label={`Escuchar: ${text}`}
      className="grid size-12 shrink-0 place-items-center rounded-full bg-terra-wash text-terra-deep transition active:scale-95"
    >
      <Volume2 className="size-5" strokeWidth={2.25} />
    </button>
  );
}
