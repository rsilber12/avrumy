import { useState } from "react";

interface AnimatedTextProps {
  text: string;
  className?: string;
}

const AnimatedText = ({ text, className = "" }: AnimatedTextProps) => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const words = text.split(" ");

  let charIndex = 0;

  return (
    <span className={className}>
      {words.map((word, wordIndex) => (
        <span key={wordIndex} className="inline-block whitespace-nowrap">
          {word.split("").map((char) => {
            const currentIndex = charIndex++;
            const isHovered = hoveredIndex === currentIndex;
            
            return (
              <span
                key={currentIndex}
                className="inline-block cursor-default hoverable transition-all duration-200 ease-out"
                style={{
                  transform: isHovered ? "translateY(-8px) scale(1.15)" : "translateY(0) scale(1)",
                  color: isHovered ? "hsl(200, 80%, 55%)" : "inherit",
                }}
                onMouseEnter={() => setHoveredIndex(currentIndex)}
                onMouseLeave={() => setHoveredIndex(null)}
              >
                {char}
              </span>
            );
          })}
          {wordIndex < words.length - 1 && (
            <span className="inline-block">&nbsp;</span>
          )}
        </span>
      ))}
    </span>
  );
};

export default AnimatedText;
