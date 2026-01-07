import { Link } from "react-router-dom";
import { ArrowLeft, Mail, MapPin } from "lucide-react";
import { motion } from "framer-motion";
import { usePageVisit, trackEmailClick } from "@/hooks/useAnalytics";
import GradientBackground from "@/components/GradientBackground";
import FloatingElement from "@/components/FloatingElement";
import MagneticButton from "@/components/MagneticButton";

const Contact = () => {
  usePageVisit("/contact");

  const handleEmailClick = () => {
    trackEmailClick();
  };

  return (
    <div className="min-h-screen bg-background px-6 py-12 flex flex-col relative overflow-hidden">
      <GradientBackground />
      
      {/* Back Navigation */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      >
        <Link 
          to="/" 
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors duration-300 mb-16 group"
        >
          <motion.span whileHover={{ x: -4 }} transition={{ duration: 0.2 }}>
            <ArrowLeft className="w-4 h-4" />
          </motion.span>
          <span className="text-sm">Back</span>
        </Link>
      </motion.div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center justify-center max-w-2xl mx-auto text-center">
        <motion.h1 
          className="text-4xl md:text-5xl lg:text-6xl font-light tracking-normal mb-12"
          initial={{ opacity: 0, y: 40, filter: "blur(10px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        >
          Get in Touch
        </motion.h1>

        <motion.div 
          className="space-y-8"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
        >
          <p className="text-muted-foreground text-lg md:text-xl font-light leading-relaxed">
            We'd love to hear about your project.
            <br />
            Let's create something beautiful together.
          </p>

          <FloatingElement amplitude={4} duration={4}>
            <MagneticButton>
              <motion.a 
                href="mailto:mail@avrumy.com" 
                onClick={handleEmailClick}
                className="inline-flex items-center gap-3 text-foreground text-xl md:text-2xl font-light tracking-wide hover:text-muted-foreground transition-colors duration-300 group"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <motion.span
                  className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center"
                  whileHover={{ rotate: 10, scale: 1.1 }}
                >
                  <Mail className="w-5 h-5" />
                </motion.span>
                <span className="relative">
                  mail@avrumy.com
                  <motion.span
                    className="absolute -bottom-1 left-0 right-0 h-px bg-foreground"
                    initial={{ scaleX: 0 }}
                    whileHover={{ scaleX: 1 }}
                    transition={{ duration: 0.3 }}
                  />
                </span>
              </motion.a>
            </MagneticButton>
          </FloatingElement>
        </motion.div>

        {/* Location */}
        <motion.div 
          className="mt-20"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.5, ease: [0.22, 1, 0.36, 1] }}
        >
          <motion.div 
            className="flex items-center gap-2 justify-center text-muted-foreground text-sm mb-2"
            whileHover={{ scale: 1.02 }}
          >
            <MapPin className="w-4 h-4" />
            <span>Based in</span>
          </motion.div>
          <motion.p 
            className="text-foreground text-lg font-light"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
          >
            New York City
          </motion.p>
        </motion.div>

        {/* Decorative orb */}
        <motion.div
          className="absolute -bottom-40 right-1/4 w-80 h-80 rounded-full bg-gradient-to-tr from-primary/5 to-accent/10 blur-3xl"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      </div>

      {/* Footer */}
      <motion.footer 
        className="text-center text-muted-foreground text-sm mt-auto pt-12"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
      >
        © {new Date().getFullYear()} Avrumy, LLC
      </motion.footer>
    </div>
  );
};

export default Contact;
