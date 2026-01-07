import { Link } from "react-router-dom";
import { motion } from "framer-motion";

import avrumyAnimation from "@/assets/avrumy-logo-animation.mp4";
import AnimatedText from "@/components/AnimatedText";
import GradientBackground from "@/components/GradientBackground";
import MagneticButton from "@/components/MagneticButton";
import FloatingElement from "@/components/FloatingElement";
import { usePageVisit } from "@/hooks/useAnalytics";

const Index = () => {
  usePageVisit("/");

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
        delayChildren: 8.5,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30, filter: "blur(10px)" },
    visible: {
      opacity: 1,
      y: 0,
      filter: "blur(0px)",
      transition: {
        duration: 0.8,
        ease: [0.22, 1, 0.36, 1] as const,
      },
    },
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4 sm:px-6 py-8 sm:py-0 relative overflow-hidden">
      <GradientBackground />
      
      {/* Logo Animation with 3D float */}
      <FloatingElement amplitude={8} duration={5}>
        <motion.div 
          className="mb-6 sm:mb-12"
          initial={{ opacity: 0, scale: 0.8, rotateX: 20 }}
          animate={{ opacity: 1, scale: 1, rotateX: 0 }}
          transition={{ 
            duration: 1.2, 
            delay: 0.2,
            ease: [0.22, 1, 0.36, 1]
          }}
          style={{ perspective: 1000 }}
        >
          <video
            src={avrumyAnimation}
            autoPlay
            loop
            muted
            playsInline
            className="w-48 h-48 sm:w-56 sm:h-56 md:w-72 md:h-72 lg:w-80 lg:h-80 object-contain drop-shadow-2xl"
          />
        </motion.div>
      </FloatingElement>

      {/* Tagline with depth */}
      <motion.div 
        className="text-center mb-10 sm:mb-20"
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1, delay: 0.5, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="text-foreground text-2xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-light tracking-tight flex flex-col gap-1 sm:gap-2 md:gap-4 lg:gap-5">
          <span><AnimatedText text="We are Avrumy," delay={600} speed={120} /></span>
          <span><AnimatedText text="a creative design studio" delay={2600} speed={110} /></span>
          <span><AnimatedText text="located in New York City" delay={5600} speed={110} /></span>
        </div>
      </motion.div>

      {/* Navigation with magnetic effect */}
      <motion.nav 
        className="mt-2 sm:mt-4"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <ul className="flex flex-col md:flex-row items-center gap-4 sm:gap-6 md:gap-12 text-base sm:text-lg tracking-tight font-sans">
          {[
            { to: "/design-gallery", label: "Design" },
            { to: "/websites", label: "Websites" },
            { to: "/music-artwork", label: "Music Artwork" },
            { to: "/contact", label: "Contact" },
          ].map((link) => (
            <motion.li key={link.to} variants={itemVariants}>
              <MagneticButton>
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  transition={{ duration: 0.3 }}
                >
                  <Link to={link.to} className="nav-link group relative">
                    <span className="relative z-10 group-hover:text-cursor-blue transition-colors duration-300">
                      {link.label}
                    </span>
                    <motion.span
                      className="absolute inset-0 -z-10 rounded-lg bg-primary/5"
                      initial={{ scale: 0, opacity: 0 }}
                      whileHover={{ scale: 1.2, opacity: 1 }}
                      transition={{ duration: 0.3 }}
                    />
                  </Link>
                </motion.div>
              </MagneticButton>
            </motion.li>
          ))}
        </ul>
      </motion.nav>

      {/* Decorative elements */}
      <motion.div
        className="absolute bottom-10 left-1/2 -translate-x-1/2"
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.5 }}
        transition={{ delay: 10, duration: 1 }}
      >
        <motion.div
          className="w-px h-16 bg-gradient-to-b from-transparent via-muted-foreground to-transparent"
          animate={{ scaleY: [1, 1.5, 1], opacity: [0.3, 0.6, 0.3] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        />
      </motion.div>
    </div>
  );
};

export default Index;
