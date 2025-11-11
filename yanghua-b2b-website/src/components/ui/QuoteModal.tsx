"use client";

import Quote from "@/components/blocks/quote";
import type { QuoteBlock } from "@/lib/types";

interface QuoteModalProps {
  open: boolean;
  onClose: () => void;
  data: QuoteBlock;
}

export default function QuoteModal({ open, onClose, data }: QuoteModalProps) {
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={onClose}
      aria-modal="true"
      role="dialog"
    >
      <div
        className="relative w-full max-w-2xl bg-white rounded-lg shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6">
          <Quote data={data} onClose={onClose} />
        </div>
      </div>
    </div>
  );
}