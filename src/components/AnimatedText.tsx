import { useEffect, useState } from "react";

interface AnimatedTextProps {
  text: string;
  className?: string;
  delay?: number;
  speed?: number;
  storageKey?: string;
}

const AnimatedText = ({ 
  text, 
  className = "", 
  delay = 0,
  speed = 55,
  storageKey
}: AnimatedTextProps) => {
  const [displayedText, setDisplayedText] = useState("");
  const [showCursor, setShowCursor] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);

  useEffect(() => {
    // Check if animation was already played in this session
    if (storageKey) {
      const alreadyPlayed = sessionStorage.getItem(`typewriter-${storageKey}`);
      if (alreadyPlayed) {
        setDisplayedText(text);
        return;
      }
    }

    // Prevent running twice
    if (hasStarted) return;
    setHasStarted(true);

    let currentIndex = 0;
    let typeInterval: ReturnType<typeof setInterval>;
    let cursorTimeout: ReturnType<typeof setTimeout>;

    const startDelay = setTimeout(() => {
      setShowCursor(true);
      
      typeInterval = setInterval(() => {
        if (currentIndex < text.length) {
          currentIndex++;
          setDisplayedText(text.slice(0, currentIndex));
        } else {
          clearInterval(typeInterval);
          cursorTimeout = setTimeout(() => {
            setShowCursor(false);
            if (storageKey) {
              sessionStorage.setItem(`typewriter-${storageKey}`, "true");
            }
          }, 400);
        }
      }, speed);
    }, delay);

    return () => {
      clearTimeout(startDelay);
      clearTimeout(cursorTimeout);
      if (typeInterval) clearInterval(typeInterval);
    };
  }, [text, delay, speed, storageKey, hasStarted]);

  return (
    <span className={className}>
      {displayedText}
      {showCursor && (
        <span 
          className="inline-block w-[2px] h-[0.85em] bg-foreground/70 ml-[2px] align-middle animate-pulse"
        />
      )}
    </span>
  );
};

export default AnimatedText;
