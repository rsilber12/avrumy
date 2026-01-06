import { useEffect, useState, useRef } from "react";

const CustomCursor = () => {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [smoothPosition, setSmoothPosition] = useState({ x: 0, y: 0 });
  const [isHovering, setIsHovering] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const animationRef = useRef<number>();

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

  // Smooth animation loop
  useEffect(() => {
    const animate = () => {
      setSmoothPosition(prev => ({
        x: prev.x + (position.x - prev.x) * 0.15,
        y: prev.y + (position.y - prev.y) * 0.15,
      }));
      animationRef.current = requestAnimationFrame(animate);
    };
    
    animationRef.current = requestAnimationFrame(animate);
    
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [position]);

  if (!isVisible) return null;

  const size = isHovering ? 40 : 20;

  return (
    <>
      {/* Main cursor ball */}
      <div
        className="fixed pointer-events-none z-[9999]"
        style={{
          left: smoothPosition.x - size / 2,
          top: smoothPosition.y - size / 2,
          width: size,
          height: size,
          backgroundColor: "hsl(200, 80%, 50%)",
          borderRadius: "50%",
          opacity: isHovering ? 0.7 : 0.9,
          transition: "width 0.3s ease, height 0.3s ease, opacity 0.3s ease",
        }}
      />
      
      {/* Trailing dot */}
      <div
        className="fixed pointer-events-none z-[9998]"
        style={{
          left: smoothPosition.x - 3 + (position.x - smoothPosition.x) * -0.3,
          top: smoothPosition.y - 3 + (position.y - smoothPosition.y) * -0.3,
          width: 6,
          height: 6,
          backgroundColor: "hsl(200, 80%, 50%)",
          borderRadius: "50%",
          opacity: 0.4,
        }}
      />
    </>
  );
};

export default CustomCursor;
