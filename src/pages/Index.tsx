import { Link } from "react-router-dom";
import { MoveRight } from "lucide-react";
import avrumyAnimation from "@/assets/avrumy-logo-animation.mp4";
import AnimatedText from "@/components/AnimatedText";

const Index = () => {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6">
      {/* Logo Animation */}
      <div 
        className="mb-12 animate-fade-in"
        style={{ animationDelay: "0.2s" }}
      >
        <video
          src={avrumyAnimation}
          autoPlay
          loop
          muted
          playsInline
          className="w-56 h-56 md:w-72 md:h-72 lg:w-80 lg:h-80 object-contain"
        />
      </div>

      {/* Tagline */}
      <div 
        className="text-center mb-20 animate-fade-in-up"
        style={{ animationDelay: "0.5s" }}
      >
        <p className="text-foreground text-2xl md:text-3xl lg:text-4xl xl:text-5xl font-light leading-[1.8] tracking-tight">
          <AnimatedText text="We are Avrumy," />
          <br />
          <AnimatedText text="a creative design studio" />
          <br />
          <AnimatedText text="located in New York City" />
        </p>
      </div>

      {/* Navigation */}
      <nav 
        className="animate-fade-in-up mt-4"
        style={{ animationDelay: "0.8s" }}
      >
        <ul className="flex flex-col md:flex-row items-center gap-6 md:gap-12 text-lg tracking-tight">
          <li>
            <Link to="/design-gallery" className="nav-link inline-flex items-center group">
              <MoveRight className="nav-arrow w-4 h-4" />
              <span className="group-hover:text-cursor-blue transition-colors duration-300">Design Gallery</span>
            </Link>
          </li>
          <li>
            <Link to="/music-artwork" className="nav-link inline-flex items-center group">
              <MoveRight className="nav-arrow w-4 h-4" />
              <span className="group-hover:text-cursor-blue transition-colors duration-300">Music Artwork</span>
            </Link>
          </li>
          <li>
            <Link to="/contact" className="nav-link inline-flex items-center group">
              <MoveRight className="nav-arrow w-4 h-4" />
              <span className="group-hover:text-cursor-blue transition-colors duration-300">Contact</span>
            </Link>
          </li>
        </ul>
      </nav>
    </div>
  );
};

export default Index;
