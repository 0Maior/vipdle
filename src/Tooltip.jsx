import { useEffect, useRef, useState } from "react";
import "./tooltip.css";

const Tooltip = ({ content, children }) => {
  const triggerRef = useRef(null);
  const tooltipRef = useRef(null);
  const [visible, setVisible] = useState(false);

  const show = () => setVisible(true);
  const hide = () => setVisible(false);

  // Position tooltip relative to trigger
  const positionTooltip = () => {
    if (!triggerRef.current || !tooltipRef.current) return;

    const rect = triggerRef.current.getBoundingClientRect();

    tooltipRef.current.style.top = `${rect.top - 8}px`;
    tooltipRef.current.style.left = `${rect.left + rect.width / 2}px`;
    tooltipRef.current.style.transform = "translate(-50%, -100%)";
  };

  useEffect(() => {
    if (visible) positionTooltip();
  }, [visible]);

  // Close on scroll / resize / outside click
  useEffect(() => {
    if (!visible) return;

    const onScroll = () => hide();
    const onResize = () => hide();
    const onClickOutside = (e) => {
      if (
        !tooltipRef.current?.contains(e.target) &&
        !triggerRef.current?.contains(e.target)
      ) {
        hide();
      }
    };

    window.addEventListener("scroll", onScroll, true);
    window.addEventListener("resize", onResize);
    document.addEventListener("mousedown", onClickOutside);
    document.addEventListener("touchstart", onClickOutside);

    return () => {
      window.removeEventListener("scroll", onScroll, true);
      window.removeEventListener("resize", onResize);
      document.removeEventListener("mousedown", onClickOutside);
      document.removeEventListener("touchstart", onClickOutside);
    };
  }, [visible]);

  return (
    <>
      <span
        ref={triggerRef}
        className="tooltip-trigger"
        onMouseEnter={show}
        onMouseLeave={hide}
        onTouchStart={(e) => {
          e.preventDefault();
          setVisible((v) => !v);
        }}
      >
        {children}
      </span>

      {visible && (
        <div ref={tooltipRef} className="tooltip-fixed">
          {content}
        </div>
      )}
    </>
  );
};

export default Tooltip;