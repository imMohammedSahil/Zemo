const React = require("react");
const { useState, useEffect, useRef } = React;

/**
 * MagneticCursorPill
 *
 * @param {Object} props
 * @param {React.ReactNode} props.children - Pill label or icon content
 * @param {string} [props.className] - CSS class name
 * @param {Object} [props.style] - Inline styles
 * @param {number} [props.lerp=0.14] - Kinetic damping factor (0.05 to 0.3)
 * @param {string} [props.boundaryElementId] - ID of element outside which pill hides
 * @param {number} [props.offsetX=14] - Cursor X offset
 * @param {number} [props.offsetY=-34] - Cursor Y offset
 */
function MagneticCursorPill({
  children,
  className = "",
  style = {},
  lerp = 0.14,
  boundaryElementId = "",
  offsetX = 14,
  offsetY = -34
}) {
  const [hasMoved, setHasMoved] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const pillRef = useRef(null);

  useEffect(() => {
    let targetX = -500;
    let targetY = -500;
    let currentX = -500;
    let currentY = -500;
    let initialized = false;
    let animId = null;

    const handlePointerMove = (e) => {
      targetX = e.clientX + offsetX;
      targetY = e.clientY + offsetY;

      // First detection: snap immediately to cursor without fly-in lag
      if (!initialized) {
        currentX = targetX;
        currentY = targetY;
        if (pillRef.current) {
          pillRef.current.style.transform = `translate3d(${currentX}px, ${currentY}px, 0)`;
        }
        initialized = true;
        setHasMoved(true);
      }
    };

    const render = () => {
      if (initialized) {
        currentX += (targetX - currentX) * lerp;
        currentY += (targetY - currentY) * lerp;
        if (pillRef.current) {
          pillRef.current.style.transform = `translate3d(${currentX}px, ${currentY}px, 0)`;
        }
      }
      animId = requestAnimationFrame(render);
    };

    const checkBoundary = () => {
      if (!boundaryElementId) return;
      const el = document.getElementById(boundaryElementId);
      if (el) {
        const rect = el.getBoundingClientRect();
        setIsVisible(rect.bottom > 60 && rect.top < window.innerHeight);
      }
    };

    window.addEventListener("pointermove", handlePointerMove, { passive: true });
    window.addEventListener("scroll", checkBoundary, { passive: true });
    animId = requestAnimationFrame(render);

    checkBoundary();

    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("scroll", checkBoundary);
      cancelAnimationFrame(animId);
    };
  }, [lerp, boundaryElementId, offsetX, offsetY]);

  if (!hasMoved || !isVisible) return null;

  return React.createElement(
    "div",
    {
      ref: pillRef,
      className,
      style: {
        position: "fixed",
        top: 0,
        left: 0,
        pointerEvents: "none",
        zIndex: 9999,
        willChange: "transform",
        ...style
      }
    },
    children
  );
}

module.exports = MagneticCursorPill;
module.exports.default = MagneticCursorPill;
