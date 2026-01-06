import { Link } from "react-router-dom";
import { MoveRight } from "lucide-react";
import { motion } from "framer-motion";
import avrumyAnimation from "@/assets/avrumy-logo-animation.mp4";
import AnimatedText from "@/components/AnimatedText";

const Index = () => {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6">
      {/* Logo Animation */}
      <motion.div 
        className="mb-12"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8, delay: 0.2 }}
      >
        <video
          src={avrumyAnimation}
          autoPlay
          loop
          muted
          playsInline
          className="w-40 h-40 md:w-52 md:h-52 object-contain"
        />
      </motion.div>

      {/* Tagline */}
      <motion.div 
        className="text-center mb-16"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.5 }}
      >
        <p className="text-foreground text-xl md:text-2xl lg:text-3xl font-light tracking-wide leading-relaxed">
          <AnimatedText text="We are Avrumy, a creative design studio" />
          <br />
          <AnimatedText text="located in New York City" />
        </p>
      </motion.div>

      {/* Navigation */}
      <motion.nav 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.8 }}
      >
        <ul className="flex flex-col md:flex-row items-center gap-6 md:gap-12 text-lg tracking-wide">
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
      </motion.nav>
    </div>
  );
};

export default Index;
