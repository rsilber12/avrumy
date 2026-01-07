import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { usePageVisit } from "@/hooks/useAnalytics";
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
    <div className="min-h-screen bg-background px-6 py-12">
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
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm">Back</span>
        </Link>
      </motion.div>

      {/* Header */}
      <header className="max-w-4xl mx-auto text-center mb-20">
        <motion.h1 
          className="text-4xl md:text-5xl lg:text-6xl font-light tracking-normal"
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        >
          Design
        </motion.h1>
      </header>

      {/* Gallery Grid - Masonry Style */}
      <div className="max-w-7xl mx-auto">
        {isLoading ? (
          <div className="columns-2 lg:columns-4 gap-4">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((item) => (
              <div 
                key={item} 
                className="break-inside-avoid mb-4"
              >
                <div 
                  className="bg-secondary rounded-xl animate-pulse"
                  style={{ aspectRatio: Math.random() > 0.5 ? "3/4" : "4/3" }}
                />
              </div>
            ))}
          </div>
        ) : projects && projects.length > 0 ? (
          <div className="columns-2 lg:columns-4 gap-4">
            {projects.map((project, index) => (
              <ScrollReveal
                key={project.id}
                delay={index * 0.05}
                scale
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
          <p className="text-center text-muted-foreground">No projects added yet</p>
        )}
      </div>

      {/* Footer */}
      <footer className="text-center text-muted-foreground text-sm mt-20">
        © {new Date().getFullYear()} Avrumy, LLC
      </footer>
    </div>
  );
};

export default DesignGallery;
