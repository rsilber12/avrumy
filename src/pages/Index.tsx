import { Link } from "react-router-dom";
import avrumyAnimation from "@/assets/avrumy-logo-animation.mp4";

const Index = () => {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6">
      {/* Logo Animation */}
      <div 
        className="mb-12 opacity-0 animate-fade-in"
        style={{ animationDelay: "0.2s" }}
      >
        <video
          src={avrumyAnimation}
          autoPlay
          loop
          muted
          playsInline
          className="w-40 h-40 md:w-52 md:h-52 object-contain"
        />
      </div>

      {/* Tagline */}
      <div 
        className="text-center mb-16 opacity-0 animate-fade-in-up"
        style={{ animationDelay: "0.5s" }}
      >
        <p className="text-foreground text-xl md:text-2xl lg:text-3xl font-light tracking-wide leading-relaxed max-w-xl">
          We are Avrumy, a creative design studio
          <br />
          located in New York City
        </p>
      </div>

      {/* Navigation */}
      <nav 
        className="opacity-0 animate-fade-in-up"
        style={{ animationDelay: "0.8s" }}
      >
        <ul className="flex flex-col md:flex-row items-center gap-6 md:gap-12 text-lg tracking-widest uppercase">
          <li>
            <Link to="/design-gallery" className="nav-link">
              Design Gallery
            </Link>
          </li>
          <li>
            <Link to="/music-artwork" className="nav-link">
              Music Artwork
            </Link>
          </li>
          <li>
            <Link to="/contact" className="nav-link">
              Contact
            </Link>
          </li>
        </ul>
      </nav>
    </div>
  );
};

export default Index;
