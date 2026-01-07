import { useEffect, useState, useRef } from "react";

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
  speed = 80,
  storageKey
}: AnimatedTextProps) => {
  const [displayedText, setDisplayedText] = useState("");
  const [showCursor, setShowCursor] = useState(false);
  const hasAnimated = useRef(false);

  useEffect(() => {
    // Check if animation was already played in this session
    if (storageKey) {
      const alreadyPlayed = sessionStorage.getItem(`typewriter-${storageKey}`);
      if (alreadyPlayed) {
        setDisplayedText(text);
        return;
      }
    }

    // Prevent double animation in strict mode
    if (hasAnimated.current) return;
    hasAnimated.current = true;

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
          // Keep cursor visible briefly, then hide
          setTimeout(() => {
            setShowCursor(false);
            // Mark as played
            if (storageKey) {
              sessionStorage.setItem(`typewriter-${storageKey}`, 'true');
            }
          }, 300);
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
        <span 
          className="inline-block w-[2px] h-[0.85em] bg-foreground/60 ml-[2px] align-middle"
          style={{ animation: 'pulse 1s ease-in-out infinite' }}
        />
      )}
    </span>
  );
};

export default AnimatedText;
