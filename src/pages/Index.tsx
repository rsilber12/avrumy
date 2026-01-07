import { Link } from "react-router-dom";

import avrumyAnimation from "@/assets/avrumy-logo-animation.mp4";
import AnimatedText from "@/components/AnimatedText";
import { usePageVisit } from "@/hooks/useAnalytics";

const Index = () => {
  usePageVisit("/");

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4 sm:px-6 py-8 sm:py-0">
      {/* Logo Animation */}
      <div 
        className="mb-6 sm:mb-12 animate-fade-in"
        style={{ animationDelay: "0.2s" }}
      >
        <video
          src={avrumyAnimation}
          autoPlay
          loop
          muted
          playsInline
          className="w-48 h-48 sm:w-56 sm:h-56 md:w-72 md:h-72 lg:w-80 lg:h-80 object-contain"
        />
      </div>

      {/* Tagline */}
      <div 
        className="text-center mb-10 sm:mb-20 animate-fade-in-up"
        style={{ animationDelay: "0.5s" }}
      >
        <p className="text-foreground text-2xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-light leading-[2] sm:leading-[2.2] tracking-tight">
          <AnimatedText text="We are Avrumy," delay={500} speed={90} />
          <br />
          <AnimatedText text="a creative design studio" delay={2000} speed={90} />
          <br />
          <AnimatedText text="located in New York City" delay={4500} speed={90} />
        </p>
      </div>

      {/* Navigation */}
      <nav className="mt-2 sm:mt-4">
        <ul className="flex flex-col md:flex-row items-center gap-4 sm:gap-6 md:gap-12 text-base sm:text-lg tracking-tight font-sans">
          <li 
            className="opacity-0 animate-fade-in"
            style={{ animationDelay: "7s", animationFillMode: "forwards" }}
          >
            <Link to="/design-gallery" className="nav-link group">
              <span className="group-hover:text-cursor-blue transition-colors duration-300">Design Gallery</span>
            </Link>
          </li>
          <li 
            className="opacity-0 animate-fade-in"
            style={{ animationDelay: "7.3s", animationFillMode: "forwards" }}
          >
            <Link to="/music-artwork" className="nav-link group">
              <span className="group-hover:text-cursor-blue transition-colors duration-300">Music Artwork</span>
            </Link>
          </li>
          <li 
            className="opacity-0 animate-fade-in"
            style={{ animationDelay: "7.6s", animationFillMode: "forwards" }}
          >
            <Link to="/contact" className="nav-link group">
              <span className="group-hover:text-cursor-blue transition-colors duration-300">Contact</span>
            </Link>
          </li>
        </ul>
      </nav>
    </div>
  );
};

export default Index;
