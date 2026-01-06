import { useEffect, useState } from "react";

const CustomCursor = () => {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isHovering, setIsHovering] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const updatePosition = (e: MouseEvent) => {
      setPosition({ x: e.clientX, y: e.clientY });
      setIsVisible(true);
    };

    const handleMouseOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (
        target.tagName === "A" ||
        target.tagName === "BUTTON" ||
        target.closest("a") ||
        target.closest("button") ||
        target.classList.contains("hoverable")
      ) {
        setIsHovering(true);
      }
    };

    const handleMouseOut = () => {
      setIsHovering(false);
    };

    const handleMouseLeave = () => {
      setIsVisible(false);
    };

    window.addEventListener("mousemove", updatePosition);
    document.addEventListener("mouseover", handleMouseOver);
    document.addEventListener("mouseout", handleMouseOut);
    document.addEventListener("mouseleave", handleMouseLeave);

    return () => {
      window.removeEventListener("mousemove", updatePosition);
      document.removeEventListener("mouseover", handleMouseOver);
      document.removeEventListener("mouseout", handleMouseOut);
      document.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, []);

  if (!isVisible) return null;

  return (
    <>
      {/* Main cursor ball */}
      <div
        className="fixed pointer-events-none z-[9999] mix-blend-difference transition-transform duration-75 ease-out"
        style={{
          left: position.x - (isHovering ? 20 : 10),
          top: position.y - (isHovering ? 20 : 10),
        }}
      >
        <div 
          className="rounded-full bg-cursor-blue transition-all duration-200"
          style={{
            width: isHovering ? 40 : 20,
            height: isHovering ? 40 : 20,
            opacity: isHovering ? 0.8 : 1,
          }}
        />
      </div>
      
      {/* Trailing cursor */}
      <div
        className="fixed pointer-events-none z-[9998] transition-all duration-150 ease-out"
        style={{
          left: position.x - 4,
          top: position.y - 4,
        }}
      >
        <div className="w-2 h-2 rounded-full bg-cursor-blue opacity-50" />
      </div>
    </>
  );
};

export default CustomCursor;
