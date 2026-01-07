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
  speed = 120,
  storageKey
}: AnimatedTextProps) => {
  const [displayedText, setDisplayedText] = useState("");
  const [showCursor, setShowCursor] = useState(false);

  useEffect(() => {
    // Check if animation was already played
    if (storageKey) {
      const alreadyPlayed = sessionStorage.getItem(`typewriter-${storageKey}`);
      if (alreadyPlayed) {
        setDisplayedText(text);
        return;
      }
    }

    let currentIndex = 0;
    let typeInterval: ReturnType<typeof setInterval>;

    const startDelay = setTimeout(() => {
      setShowCursor(true);
      
      typeInterval = setInterval(() => {
        if (currentIndex < text.length) {
          setDisplayedText(text.slice(0, currentIndex + 1));
          currentIndex++;
        } else {
          clearInterval(typeInterval);
          setShowCursor(false);
          // Mark as played
          if (storageKey) {
            sessionStorage.setItem(`typewriter-${storageKey}`, 'true');
          }
        }
      }, speed);
    }, delay);

    return () => {
      clearTimeout(startDelay);
      clearInterval(typeInterval);
    };
  }, [text, delay, speed, storageKey]);

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
