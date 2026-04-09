"use client";

import { useEffect, useRef, useState } from "react";
import { FiX, FiMessageCircle } from "react-icons/fi";
import FloatingAIChat from "@/components/ai/FloatingAIChat";

type Position = { x: number; y: number };

const BTN_SIZE  = 64;
const PANEL_W   = 360;
const PANEL_H   = 520;
const PANEL_GAP = 14;

export default function GlobalAIWidget() {
  const [isOpen, setIsOpen]     = useState(false);
  const [mounted, setMounted]   = useState(false);
  const [dragging, setDragging] = useState(false);
  const [position, setPosition] = useState<Position>({ x: 0, y: 0 });
  const [pulse, setPulse]       = useState(true);

  const widgetRef  = useRef<HTMLDivElement | null>(null);
  const dragOffset = useRef({ x: 0, y: 0 });
  const isDragging = useRef(false);
  const hasDragged = useRef(false);

  useEffect(() => {
    setMounted(true);
    setPosition({
      x: window.innerWidth  - BTN_SIZE - 134 - 24,
      y: window.innerHeight - BTN_SIZE - 134 - 28,
    });
    const t = setTimeout(() => setPulse(false), 6000);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    const onResize = () =>
      setPosition((prev) => ({
        x: Math.min(prev.x, window.innerWidth  - 200),
        y: Math.min(prev.y, window.innerHeight - 200),
      }));
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (!isDragging.current) return;
      hasDragged.current = true;
      const nextX = e.clientX - dragOffset.current.x;
      const nextY = e.clientY - dragOffset.current.y;
      const minY  = isOpen ? PANEL_H + PANEL_GAP + 134 + 8 : 8;
      setPosition({
        x: Math.max(8, Math.min(nextX, window.innerWidth  - 200)),
        y: Math.max(minY, Math.min(nextY, window.innerHeight - 200)),
      });
    };
    const onUp = () => { isDragging.current = false; setDragging(false); };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup",   onUp);
    return () => { window.removeEventListener("mousemove", onMove); window.removeEventListener("mouseup", onUp); };
  }, [isOpen]);

  const startDrag = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    const rect = widgetRef.current?.getBoundingClientRect();
    if (!rect) return;
    isDragging.current = true;
    hasDragged.current = false;
    setDragging(true);
    const cx = "touches" in e ? e.touches[0].clientX : e.clientX;
    const cy = "touches" in e ? e.touches[0].clientY : e.clientY;
    dragOffset.current = { x: cx - rect.left, y: cy - rect.top };
  };

  const handleClick = () => {
    if (hasDragged.current) return;
    setPulse(false);
    setIsOpen((v) => !v);
  };

  if (!mounted) return null;

  return (
    <>
      <style>{`
        .ppw-root {
          position: fixed;
          z-index: 9999;
          display: flex;
          flex-direction: column;
          align-items: center;
          user-select: none;
        }
        .ppw-root.dragging { cursor: grabbing; }

        /* Panel opens UPWARD — margin-bottom pushes it above the button */
        .ppw-panel {
          width: ${PANEL_W}px;
          background: #f0f4f0;
          border-radius: 24px;
          overflow: hidden;
          box-shadow:
            0 2px 4px rgba(0,0,0,0.05),
            0 24px 64px rgba(31,41,55,0.15),
            0 0 0 0.5px rgba(134,167,137,0.22);
          display: flex;
          flex-direction: column;
          height: ${PANEL_H}px;
          margin-bottom: ${PANEL_GAP}px;
          animation: ppUp 0.36s cubic-bezier(0.34,1.46,0.64,1) both;
          transform-origin: bottom center;
        }
        @keyframes ppUp {
          from { opacity: 0; transform: scale(0.88) translateY(24px); }
          to   { opacity: 1; transform: scale(1)    translateY(0); }
        }

        /* Header bar */
        .ppw-header {
          display: flex;
          align-items: center;
          gap: 11px;
          padding: 14px 16px;
          background: #ffffff;
          border-bottom: 1px solid rgba(134,167,137,0.13);
          cursor: grab;
          flex-shrink: 0;
        }
        .ppw-header:active { cursor: grabbing; }

        .ppw-avatar {
          width: 38px;
          height: 38px;
          border-radius: 50%;
          background: linear-gradient(145deg, #7aa874, #4e7d50);
          display: grid;
          place-items: center;
          color: #fff;
          font-size: 17px;
          flex-shrink: 0;
          box-shadow: 0 2px 8px rgba(78,125,80,0.3);
        }

        .ppw-hinfo { flex: 1; min-width: 0; }
        .ppw-hname { font-size: 14px; font-weight: 700; color: #1a2e1b; line-height: 1.2; }
        .ppw-hsub  {
          font-size: 11px; color: #6b7a6d;
          display: flex; align-items: center; gap: 4px; margin-top: 2px;
        }
        .ppw-dot {
          width: 6px; height: 6px; border-radius: 50%;
          background: #22c55e; flex-shrink: 0;
          box-shadow: 0 0 0 2px rgba(34,197,94,0.2);
        }

        .ppw-xbtn {
          width: 28px; height: 28px; border-radius: 50%; border: none;
          background: #edf4ed; color: #4e7d50;
          display: grid; place-items: center;
          cursor: pointer; font-size: 13px; flex-shrink: 0;
          transition: background 0.15s, transform 0.22s;
        }
        .ppw-xbtn:hover { background: #daeeda; transform: rotate(90deg); }

        /* Chat body */
        .ppw-body { flex: 1; overflow: hidden; display: flex; flex-direction: column; }

        /* ── Button wrap — 134×134 to fit the curved text ring ── */
        .ppw-btn-wrap {
          position: relative;
          width: 134px;
          height: 134px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          cursor: pointer;
        }

        /* Curved SVG text */
        .ppw-ring-svg {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          pointer-events: none;
          transition: opacity 0.2s, transform 0.4s cubic-bezier(0.34,1.4,0.64,1);
        }
        .ppw-btn-wrap.open .ppw-ring-svg {
          opacity: 0;
          transform: rotate(20deg) scale(0.9);
        }

        /* Pulse rings */
        .ppw-pulse {
          position: absolute;
          width: ${BTN_SIZE}px;
          height: ${BTN_SIZE}px;
          border-radius: 50%;
          border: 2.5px solid rgba(122,168,116,0.45);
          animation: ppPulse 2.2s ease-out infinite;
          pointer-events: none;
        }
        .ppw-pulse:nth-of-type(2) { animation-delay: 0.75s; }
        @keyframes ppPulse {
          0%  { transform: scale(1);   opacity: 0.7; }
          80% { transform: scale(1.6); opacity: 0;   }
          to  { transform: scale(1.6); opacity: 0;   }
        }

        /* The circular button */
        .ppw-btn {
          position: relative;
          z-index: 1;
          width: ${BTN_SIZE}px;
          height: ${BTN_SIZE}px;
          border-radius: 50%;
          border: none;
          background: linear-gradient(145deg, #7aa874 0%, #4e7d50 100%);
          color: #fff;
          display: grid;
          place-items: center;
          cursor: pointer;
          font-size: 24px;
          box-shadow:
            0 6px 18px rgba(78,125,80,0.4),
            0 1px 3px rgba(0,0,0,0.1),
            0 0 0 3px rgba(255,255,255,0.18) inset;
          transition: transform 0.25s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.2s;
        }
        .ppw-btn:hover { transform: scale(1.09); box-shadow: 0 10px 26px rgba(78,125,80,0.46); }
        .ppw-btn:active { transform: scale(0.95); }

        .ppw-btn-icon {
          display: grid; place-items: center;
          transition: transform 0.3s cubic-bezier(0.34,1.56,0.64,1);
        }
        .ppw-btn-wrap.open .ppw-btn-icon { transform: rotate(90deg); }

        /* Badge */
        .ppw-badge {
          position: absolute;
          top: 24px; right: 22px;
          width: 18px; height: 18px;
          border-radius: 50%;
          background: #ef4444;
          color: #fff;
          font-size: 10px; font-weight: 700;
          display: grid; place-items: center;
          border: 2px solid #fff;
          z-index: 2;
          pointer-events: none;
          animation: ppBadge 0.4s cubic-bezier(0.34,1.56,0.64,1) both;
        }
        @keyframes ppBadge { from { transform: scale(0); } to { transform: scale(1); } }
        .ppw-btn-wrap.open .ppw-badge { display: none; }

        @media (max-width: 480px) {
          .ppw-panel { width: calc(100vw - 20px); }
        }
      `}</style>

      <div
        ref={widgetRef}
        className={`ppw-root${dragging ? " dragging" : ""}`}
        style={{ left: position.x, top: position.y }}
      >
        {/* ── Panel (above the button) ── */}
        {isOpen && (
          <div className="ppw-panel">
            <div className="ppw-header" onMouseDown={startDrag} onTouchStart={startDrag}>
              <div className="ppw-avatar"><FiMessageCircle /></div>
              <div className="ppw-hinfo">
                <div className="ppw-hname">PackPalz AI</div>
                <div className="ppw-hsub"><span className="ppw-dot" />Active now</div>
              </div>
              <button type="button" className="ppw-xbtn" onClick={() => setIsOpen(false)} aria-label="Close">
                <FiX />
              </button>
            </div>
            <div className="ppw-body">
              <FloatingAIChat isOpen={isOpen} onClose={() => setIsOpen(false)} />
            </div>
          </div>
        )}

        {/* ── Circular button with curved text ── */}
        <div
          className={`ppw-btn-wrap${isOpen ? " open" : ""}`}
          onClick={handleClick}
          onMouseDown={startDrag}
          onTouchStart={startDrag}
          role="button"
          tabIndex={0}
          aria-label={isOpen ? "Close planner" : "Open AI trip planner"}
        >
          {/* Pulse rings (only when closed & pulsing) */}
          {pulse && !isOpen && (
            <><span className="ppw-pulse" /><span className="ppw-pulse" /></>
          )}

          {/* Curved text SVG ring */}
          <svg className="ppw-ring-svg" viewBox="0 0 134 134" xmlns="http://www.w3.org/2000/svg">
            <defs>
              {/* Arc path: radius 50, centered at 67,67 — text runs counter-clockwise top arc */}
              <path id="ppArc" d="M 67,67 m -50,0 a 50,50 0 1,1 100,0 a 50,50 0 1,1 -100,0" />
            </defs>
            <text
              fontSize="10.5"
              fontWeight="800"
              fontFamily="'Segoe UI', system-ui, sans-serif"
              letterSpacing="3"
              fill="#4e7d50"
            >
              <textPath href="#ppArc" startOffset="5%">
                ✦ LET&apos;S PLAN YOUR TRIP! ✦ GO!
              </textPath>
            </text>
          </svg>

          {/* Notification badge */}
          {!isOpen && <span className="ppw-badge">1</span>}

          {/* Button circle */}
          <button type="button" className="ppw-btn" aria-hidden tabIndex={-1}>
            <span className="ppw-btn-icon">
              {isOpen ? <FiX /> : <FiMessageCircle />}
            </span>
          </button>
        </div>
      </div>
    </>
  );
}