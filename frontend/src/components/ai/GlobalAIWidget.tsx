"use client";

import { useEffect, useRef, useState } from "react";
import { FiMessageCircle, FiX } from "react-icons/fi";
import FloatingAIChat from "@/components/ai/FloatingAIChat";

type Position = {
  x: number;
  y: number;
};

export default function GlobalAIWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [position, setPosition] = useState<Position>({ x: 0, y: 0 });

  const widgetRef = useRef<HTMLDivElement | null>(null);
  const dragOffsetRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    setMounted(true);

    const defaultX = window.innerWidth - 84;
    const defaultY = window.innerHeight - 84;

    setPosition({ x: defaultX, y: defaultY });
  }, []);

  useEffect(() => {
    const handleMove = (e: MouseEvent) => {
      if (!dragging) return;

      const buttonSize = 60;
      const panelWidth = 360;
      const panelHeight = 520;

      const nextX = e.clientX - dragOffsetRef.current.x;
      const nextY = e.clientY - dragOffsetRef.current.y;

      const minX = 8;
      const minY = isOpen ? panelHeight + 8 : 8;

      const maxX = window.innerWidth - (isOpen ? panelWidth : buttonSize) - 8;
      const maxY = window.innerHeight - buttonSize - 8;

      setPosition({
        x: Math.max(minX, Math.min(nextX, maxX)),
        y: Math.max(minY, Math.min(nextY, maxY)),
      });
    };

    const handleUp = () => {
      setDragging(false);
    };

    window.addEventListener("mousemove", handleMove);
    window.addEventListener("mouseup", handleUp);

    return () => {
      window.removeEventListener("mousemove", handleMove);
      window.removeEventListener("mouseup", handleUp);
    };
  }, [dragging, isOpen]);

  const startDrag = (e: React.MouseEvent<HTMLElement>) => {
    const rect = widgetRef.current?.getBoundingClientRect();
    if (!rect) return;

    setDragging(true);
    dragOffsetRef.current = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  };

  const openChat = () => {
    setIsOpen(true);
  };

  const closeChat = () => {
    setIsOpen(false);
  };

  if (!mounted) return null;

    return (
    <div
      ref={widgetRef}
      className={`floating-ai-wrapper ${dragging ? "is-dragging" : ""}`}
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        right: "auto",
        bottom: "auto",
      }}
    >
      {isOpen && (
        <div className="floating-ai-drag-shell">
          <div
            className="floating-ai-drag-handle"
            onMouseDown={startDrag}
            role="button"
            tabIndex={0}
            aria-label="Drag AI chat"
          >
            <span />
            <span />
            <span />
          </div>

          <button
            type="button"
            className="floating-ai-panel-close"
            onClick={() => setIsOpen(false)}
            aria-label="Close AI chat"
          >
            <FiX />
          </button>

          <FloatingAIChat isOpen={isOpen} onClose={() => {}} fullPage />
        </div>
      )}

      <button
        type="button"
        className="floating-ai-btn"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-label="Open AI chat"
      >
        <FiMessageCircle />
      </button>
    </div>
  );
}