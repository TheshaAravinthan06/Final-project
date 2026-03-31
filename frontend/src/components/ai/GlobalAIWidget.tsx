"use client";

import { useEffect, useState } from "react";
import FloatingAIChat, { FloatingAIButton } from "@/components/ai/FloatingAIChat";

export default function GlobalAIWidget() {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const openHandler = () => setIsOpen(true);
    window.addEventListener("open-trip-ai", openHandler);

    return () => {
      window.removeEventListener("open-trip-ai", openHandler);
    };
  }, []);

  return (
    <div className="floating-ai-wrapper">
      <FloatingAIChat isOpen={isOpen} onClose={() => setIsOpen(false)} />
      <FloatingAIButton onClick={() => setIsOpen((prev) => !prev)} />
    </div>
  );
}