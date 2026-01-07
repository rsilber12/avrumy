import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { usePageVisit } from "@/hooks/useAnalytics";
import GradientBackground from "@/components/GradientBackground";
import ScrollReveal from "@/components/ScrollReveal";
import GlowingCard from "@/components/GlowingCard";

const DesignGallery = () => {
  const navigate = useNavigate();
  usePageVisit("/design-gallery");
  
  const { data: projects, isLoading } = useQuery({
    queryKey: ["gallery-projects"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("gallery_projects")
        .select("*")
        .order("display_order", { ascending: true });
      
      if (error) throw error;
      return data;
    },
  });

  return (
    <div className="min-h-screen bg-background px-6 py-12 relative overflow-hidden">
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

      {/* Header */}
      <header className="max-w-4xl mx-auto text-center mb-20">
        <motion.h1 
          className="text-4xl md:text-5xl lg:text-6xl font-light tracking-normal"
          initial={{ opacity: 0, y: 40, filter: "blur(10px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        >
          Design
        </motion.h1>
        <motion.div
          className="mt-4 w-24 h-px bg-gradient-to-r from-transparent via-muted-foreground/50 to-transparent mx-auto"
          initial={{ scaleX: 0, opacity: 0 }}
          animate={{ scaleX: 1, opacity: 1 }}
          transition={{ duration: 1, delay: 0.5 }}
        />
      </header>

      {/* Gallery Grid - Masonry Style */}
      <div className="max-w-7xl mx-auto">
        {isLoading ? (
          <div className="columns-2 lg:columns-4 gap-4">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((item) => (
              <motion.div 
                key={item} 
                className="break-inside-avoid mb-4"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: item * 0.1 }}
              >
                <div 
                  className="bg-secondary/50 rounded-xl animate-pulse backdrop-blur-sm"
                  style={{ aspectRatio: Math.random() > 0.5 ? "3/4" : "4/3" }}
                />
              </motion.div>
            ))}
          </div>
        ) : projects && projects.length > 0 ? (
          <div className="columns-2 lg:columns-4 gap-4">
            {projects.map((project, index) => (
              <ScrollReveal
                key={project.id}
                delay={index * 0.05}
                scale
                blur
                className="break-inside-avoid mb-4"
              >
                <GlowingCard className="rounded-xl cursor-pointer">
                  <motion.div
                    className="overflow-hidden rounded-xl"
                    onClick={() => navigate(`/project/${project.id}`)}
                    whileTap={{ scale: 0.98 }}
                  >
                    <motion.img
                      src={project.main_image_url}
                      alt={project.title || "Gallery project"}
                      className="w-full h-auto object-cover"
                      whileHover={{ scale: 1.08 }}
                      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                    />
                  </motion.div>
                </GlowingCard>
              </ScrollReveal>
            ))}
          </div>
        ) : (
          <motion.p 
            className="text-center text-muted-foreground"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            No projects added yet
          </motion.p>
        )}
      </div>

      {/* Footer */}
      <ScrollReveal delay={0.2} className="mt-20">
        <footer className="text-center text-muted-foreground text-sm">
          © {new Date().getFullYear()} Avrumy, LLC
        </footer>
      </ScrollReveal>
    </div>
  );
};

export default DesignGallery;
