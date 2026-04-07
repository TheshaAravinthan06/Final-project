"use client";

import { useEffect, useRef, useState } from "react";
import { FiMessageCircle, FiX } from "react-icons/fi";
import FloatingAIChat from "@/components/ai/FloatingAIChat";

type Position = { x: number; y: number };

export default function GlobalAIWidget() {
  const [isOpen, setIsOpen]     = useState(false);
  const [mounted, setMounted]   = useState(false);
  const [dragging, setDragging] = useState(false);
  const [position, setPosition] = useState<Position>({ x: 0, y: 0 });

  const widgetRef    = useRef<HTMLDivElement | null>(null);
  const dragOffset   = useRef({ x: 0, y: 0 });
  const isDragging   = useRef(false);
  const hasDragged   = useRef(false);

  /* set initial position bottom-right */
  useEffect(() => {
    setMounted(true);
    setPosition({
      x: window.innerWidth  - 84,
      y: window.innerHeight - 84,
    });
  }, []);

  /* global mouse move / up */
  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (!isDragging.current) return;
      hasDragged.current = true;

      const PANEL_W  = 352;
      const PANEL_H  = 496;
      const BTN_SIZE = 58;

      const nextX = e.clientX - dragOffset.current.x;
      const nextY = e.clientY - dragOffset.current.y;

      const minX = 8;
      const minY = isOpen ? PANEL_H + 20 : 8;
      const maxX = window.innerWidth  - (isOpen ? PANEL_W : BTN_SIZE) - 8;
      const maxY = window.innerHeight - BTN_SIZE - 8;

      setPosition({
        x: Math.max(minX, Math.min(nextX, maxX)),
        y: Math.max(minY, Math.min(nextY, maxY)),
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

    isDragging.current  = true;
    hasDragged.current  = false;
    setDragging(true);
    dragOffset.current  = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  };

  /* toggle open — but not if we just finished dragging */
  const handleButtonClick = () => {
    if (hasDragged.current) return;
    setIsOpen((v) => !v);
  };

  if (!mounted) return null;

  return (
    <div
      ref={widgetRef}
      className={`floating-ai-wrapper ${dragging ? "is-dragging" : ""}`}
      style={{ left: position.x, top: position.y, right: "auto", bottom: "auto" }}
    >
      {/* Chat panel — slides in above the button */}
      {isOpen && (
        <div className="floating-ai-drag-shell">
          {/* Drag handle */}
          <div
            className="floating-ai-drag-handle"
            onMouseDown={startDrag}
            role="button"
            tabIndex={0}
            aria-label="Drag AI chat"
          >
            <span /><span /><span />
          </div>

          {/* Close button */}
          <button
            type="button"
            className="floating-ai-panel-close"
            onClick={() => setIsOpen(false)}
            aria-label="Close AI chat"
          >
            <FiX />
          </button>

          <FloatingAIChat isOpen={isOpen} onClose={() => setIsOpen(false)} />
        </div>
      )}

      {/* Floating launch button */}
      <button
        type="button"
        className="floating-ai-btn"
        onMouseDown={startDrag}
        onClick={handleButtonClick}
        aria-label={isOpen ? "Close AI chat" : "Open AI chat"}
      >
        {isOpen ? <FiX /> : <FiMessageCircle />}
      </button>
    </div>
  );
}