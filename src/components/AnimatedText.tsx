import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

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
  speed = 90 
}: AnimatedTextProps) => {
  const [displayedText, setDisplayedText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const requestRef = useRef<number>();
  const startTimeRef = useRef<number>();
  const currentIndexRef = useRef(0);

  useEffect(() => {
    const startDelay = setTimeout(() => {
      setIsTyping(true);
      startTimeRef.current = undefined;
      currentIndexRef.current = 0;

      const animate = (timestamp: number) => {
        if (!startTimeRef.current) {
          startTimeRef.current = timestamp;
        }

        const elapsed = timestamp - startTimeRef.current;
        const targetIndex = Math.floor(elapsed / speed);

        if (targetIndex > currentIndexRef.current && currentIndexRef.current <= text.length) {
          currentIndexRef.current = Math.min(targetIndex, text.length);
          setDisplayedText(text.slice(0, currentIndexRef.current));
        }

        if (currentIndexRef.current < text.length) {
          requestRef.current = requestAnimationFrame(animate);
        } else {
          setIsTyping(false);
          setIsComplete(true);
        }
      };

      requestRef.current = requestAnimationFrame(animate);
    }, delay);

    return () => {
      clearTimeout(startDelay);
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
      }
    };
  }, [text, delay, speed]);

  return (
    <span className={className}>
      {displayedText.split("").map((char, index) => (
        <motion.span
          key={index}
          initial={{ opacity: 0, y: 2 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ 
            duration: 0.15,
            ease: "easeOut"
          }}
        >
          {char}
        </motion.span>
      ))}
      <AnimatePresence>
        {isTyping && (
          <motion.span 
            className="inline-block w-[2px] h-[0.85em] bg-foreground ml-[1px] align-middle"
            initial={{ opacity: 1 }}
            animate={{ opacity: [1, 0, 1] }}
            exit={{ opacity: 0 }}
            transition={{ 
              opacity: { duration: 0.8, repeat: Infinity, ease: "easeInOut" }
            }}
          />
        )}
      </AnimatePresence>
    </span>
  );
};

export default AnimatedText;
