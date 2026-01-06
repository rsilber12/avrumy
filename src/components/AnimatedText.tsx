interface AnimatedTextProps {
  text: string;
  className?: string;
}

const AnimatedText = ({ text, className = "" }: AnimatedTextProps) => {
  return (
    <span className={className}>
      {text}
    </span>
  );
};

export default AnimatedText;
