import { useState, useRef, useEffect, ReactNode } from 'react';
import { createPortal } from 'react-dom';

interface TooltipProps {
  content: string;
  children: ReactNode;
}

export function Tooltip({ content, children }: TooltipProps) {
  const [visible, setVisible] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0, above: true });
  const triggerRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (visible && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      const TOOLTIP_HEIGHT = 32;
      const MARGIN = 8;

      let above = true;
      let y = rect.top - MARGIN;

      if (y < TOOLTIP_HEIGHT + MARGIN) {
        above = false;
        y = rect.bottom + MARGIN;
      }

      setPosition({
        x: rect.left + rect.width / 2,
        y,
        above,
      });
    }
  }, [visible]);

  return (
    <>
      <div
        ref={triggerRef}
        className="relative inline-block"
        onMouseEnter={() => setVisible(true)}
        onMouseLeave={() => setVisible(false)}
        onClick={() => setVisible(!visible)}
      >
        {children}
      </div>
      {visible &&
        createPortal(
          <div
            ref={tooltipRef}
            className="fixed z-[9999] pointer-events-none"
            style={{
              left: position.x,
              top: position.y,
              transform: `translate(-50%, ${position.above ? '-100%' : '0'})`,
            }}
          >
            <div className="bg-stone-900 text-white text-xs px-2.5 py-1.5 rounded-lg whitespace-nowrap shadow-lg">
              {content}
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}
