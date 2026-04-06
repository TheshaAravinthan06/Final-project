"use client";

import { useEffect, useRef, useState } from "react";
import { FiMessageCircle, FiX } from "react-icons/fi";
import FloatingAIChat from "@/components/ai/FloatingAIChat";

type Position = { x: number; y: number };

export default function GlobalAIWidget() {
  const [isOpen,    setIsOpen]    = useState(false);
  const [mounted,   setMounted]   = useState(false);
  const [dragging,  setDragging]  = useState(false);
  const [position,  setPosition]  = useState<Position>({ x: 0, y: 0 });
  const [showLabel, setShowLabel] = useState(true);

  const widgetRef   = useRef<HTMLDivElement | null>(null);
  const dragOffset  = useRef({ x: 0, y: 0 });
  const isDragging  = useRef(false);
  const hasDragged  = useRef(false);

  useEffect(() => {
    setMounted(true);
    setPosition({
      x: window.innerWidth  - 88,
      y: window.innerHeight - 88,
    });

    // Hide the label after 6 seconds
    const t = setTimeout(() => setShowLabel(false), 6000);
    return () => clearTimeout(t);
  }, []);

  // Hide label when chat opens
  useEffect(() => {
    if (isOpen) setShowLabel(false);
  }, [isOpen]);

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (!isDragging.current) return;
      hasDragged.current = true;

      const BTN   = 60;
      const PAN_W = 360;
      const PAN_H = 520;

      const nextX = e.clientX - dragOffset.current.x;
      const nextY = e.clientY - dragOffset.current.y;

      setPosition({
        x: Math.max(8, Math.min(nextX, window.innerWidth  - (isOpen ? PAN_W : BTN) - 8)),
        y: Math.max(isOpen ? PAN_H + 20 : 8, Math.min(nextY, window.innerHeight - BTN - 8)),
      });
    };

    const onUp = () => {
      isDragging.current = false;
      setDragging(false);
    };

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup",   onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup",   onUp);
    };
  }, [isOpen]);

  const startDrag = (e: React.MouseEvent<HTMLElement>) => {
    e.preventDefault();
    const rect = widgetRef.current?.getBoundingClientRect();
    if (!rect) return;
    isDragging.current = true;
    hasDragged.current = false;
    setDragging(true);
    dragOffset.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  const handleButtonClick = () => {
    if (hasDragged.current) { hasDragged.current = false; return; }
    setIsOpen((v) => !v);
  };

  if (!mounted) return null;

  return (
    <div
      ref={widgetRef}
      className={`floating-ai-wrapper ${dragging ? "is-dragging" : ""}`}
      style={{ left: position.x, top: position.y, right: "auto", bottom: "auto" }}
    >
      {/* Chat popup panel */}
      {isOpen && (
        <div className="floating-ai-drag-shell">
          {/* Drag handle — bottom of header */}
          <div
            className="floating-ai-drag-handle"
            onMouseDown={startDrag}
            role="button"
            tabIndex={0}
            aria-label="Drag chat"
          >
            <span /><span /><span />
          </div>

          {/* Close button */}
          <button
            type="button"
            className="floating-ai-panel-close"
            onClick={() => setIsOpen(false)}
            aria-label="Close chat"
          >
            <FiX />
          </button>

          {/* The real FloatingAIChat component */}
          <FloatingAIChat isOpen={isOpen} onClose={() => setIsOpen(false)} />
        </div>
      )}

      {/* Animated "Let's plan!" label */}
      {showLabel && !isOpen && (
        <div className="floating-ai-label">
          <span>Let&apos;s plan! ✦</span>
        </div>
      )}

      {/* Floating button — always FiMessageCircle */}
      <button
        type="button"
        className="floating-ai-btn"
        onMouseDown={startDrag}
        onClick={handleButtonClick}
        aria-label="Open AI trip planner"
      >
        <FiMessageCircle />
      </button>
    </div>
  );
}