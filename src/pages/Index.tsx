import { Link } from "react-router-dom";

import avrumyAnimation from "@/assets/avrumy-logo-animation.mp4";
import AnimatedText from "@/components/AnimatedText";

const Index = () => {
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
          className="w-32 h-32 sm:w-56 sm:h-56 md:w-72 md:h-72 lg:w-80 lg:h-80 object-contain"
        />
      </div>

      {/* Tagline */}
      <div 
        className="text-center mb-10 sm:mb-20 animate-fade-in-up"
        style={{ animationDelay: "0.5s" }}
      >
        <p className="text-foreground text-2xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-light leading-[1.6] sm:leading-[1.8] tracking-tight">
          <AnimatedText text="We are Avrumy," delay={500} speed={60} />
          <br />
          <AnimatedText text="a creative design studio" delay={1500} speed={60} />
          <br />
          <AnimatedText text="located in New York City" delay={3000} speed={60} />
        </p>
      </div>

      {/* Navigation */}
      <nav 
        className="animate-fade-in-up mt-2 sm:mt-4"
        style={{ animationDelay: "0.8s" }}
      >
        <ul className="flex flex-col md:flex-row items-center gap-4 sm:gap-6 md:gap-12 text-base sm:text-lg tracking-tight font-sans">
          <li>
            <Link to="/design-gallery" className="nav-link group">
              <span className="group-hover:text-cursor-blue transition-colors duration-300">Design Gallery</span>
            </Link>
          </li>
          <li>
            <Link to="/music-artwork" className="nav-link group">
              <span className="group-hover:text-cursor-blue transition-colors duration-300">Music Artwork</span>
            </Link>
          </li>
          <li>
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
