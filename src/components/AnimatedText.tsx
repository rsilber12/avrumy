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
  speed = 50 
}: AnimatedTextProps) => {
  const [displayedText, setDisplayedText] = useState("");
  const [isTyping, setIsTyping] = useState(false);

  useEffect(() => {
    const startDelay = setTimeout(() => {
      setIsTyping(true);
      let currentIndex = 0;
      
      const typeInterval = setInterval(() => {
        if (currentIndex <= text.length) {
          setDisplayedText(text.slice(0, currentIndex));
          currentIndex++;
        } else {
          clearInterval(typeInterval);
          setIsTyping(false);
        }
      }, speed);

      return () => clearInterval(typeInterval);
    }, delay);

    return () => clearTimeout(startDelay);
  }, [text, delay, speed]);

  return (
    <span className={className}>
      {displayedText}
      {isTyping && (
        <span className="inline-block w-[2px] h-[0.9em] bg-foreground ml-[2px] animate-pulse align-middle" />
      )}
    </span>
  );
};

export default AnimatedText;
