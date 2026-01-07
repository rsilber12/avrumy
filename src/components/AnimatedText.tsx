import { useEffect, useState } from "react";

interface AnimatedTextProps {
  text: string;
  className?: string;
  delay?: number;
  speed?: number;
}

const AnimatedText = ({ 
  text, 
  className = "", 
  delay = 0,
  speed = 80 
}: AnimatedTextProps) => {
  const [displayedText, setDisplayedText] = useState("");
  const [showCursor, setShowCursor] = useState(false);

  useEffect(() => {
    let currentIndex = 0;
    let typeInterval: NodeJS.Timeout;

    const startDelay = setTimeout(() => {
      setShowCursor(true);
      
      typeInterval = setInterval(() => {
        if (currentIndex < text.length) {
          setDisplayedText(text.slice(0, currentIndex + 1));
          currentIndex++;
        } else {
          clearInterval(typeInterval);
          setShowCursor(false);
        }
      }, speed);
    }, delay);

    return () => {
      clearTimeout(startDelay);
      clearInterval(typeInterval);
    };
  }, [text, delay, speed]);

  return (
    <span className={className}>
      {displayedText}
      {showCursor && (
        <span className="inline-block w-[2px] h-[0.8em] bg-foreground/70 ml-[1px] align-middle animate-pulse" />
      )}
    </span>
  );
};

export default AnimatedText;
