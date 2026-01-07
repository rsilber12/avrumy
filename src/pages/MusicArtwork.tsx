import { Link } from "react-router-dom";
import { ArrowLeft, Play } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { usePageVisit } from "@/hooks/useAnalytics";
import GradientBackground from "@/components/GradientBackground";
import ScrollReveal from "@/components/ScrollReveal";
import GlowingCard from "@/components/GlowingCard";

const MusicArtwork = () => {
  usePageVisit("/music-artwork");

  const { data: artworks, isLoading } = useQuery({
    queryKey: ["music-artworks"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("music_artworks")
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
          Music Artwork
        </motion.h1>
        <motion.div
          className="mt-4 w-24 h-px bg-gradient-to-r from-transparent via-muted-foreground/50 to-transparent mx-auto"
          initial={{ scaleX: 0, opacity: 0 }}
          animate={{ scaleX: 1, opacity: 1 }}
          transition={{ duration: 1, delay: 0.5 }}
        />
      </header>

      {/* Gallery Grid */}
      <div className="max-w-6xl mx-auto">
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {[1, 2, 3, 4].map((item) => (
              <motion.div 
                key={item}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: item * 0.1 }}
              >
                <div className="aspect-video bg-secondary/50 rounded-xl animate-pulse backdrop-blur-sm" />
                <div className="h-4 bg-secondary/50 rounded mt-4 w-3/4 animate-pulse" />
              </motion.div>
            ))}
          </div>
        ) : artworks && artworks.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {artworks.map((artwork, index) => (
              <ScrollReveal
                key={artwork.id}
                delay={index * 0.1}
                scale
                blur
                direction={index % 2 === 0 ? "up" : "down"}
              >
                <GlowingCard className="rounded-xl">
                  <a
                    href={artwork.youtube_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group block"
                  >
                    <motion.div 
                      className="aspect-video bg-secondary rounded-xl overflow-hidden relative"
                      whileTap={{ scale: 0.98 }}
                    >
                      <motion.img
                        src={artwork.thumbnail_url}
                        alt={artwork.title}
                        className="w-full h-full object-cover"
                        whileHover={{ scale: 1.08 }}
                        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                      />
                      {/* Play overlay */}
                      <motion.div
                        className="absolute inset-0 flex items-center justify-center bg-background/20 backdrop-blur-sm"
                        initial={{ opacity: 0 }}
                        whileHover={{ opacity: 1 }}
                        transition={{ duration: 0.3 }}
                      >
                        <motion.div
                          className="w-16 h-16 rounded-full bg-background/80 flex items-center justify-center"
                          initial={{ scale: 0.8 }}
                          whileHover={{ scale: 1 }}
                        >
                          <Play className="w-6 h-6 text-foreground ml-1" />
                        </motion.div>
                      </motion.div>
                    </motion.div>
                    <motion.p 
                      className="mt-4 text-sm text-muted-foreground group-hover:text-foreground transition-colors duration-300"
                      whileHover={{ x: 4 }}
                    >
                      {artwork.title}
                    </motion.p>
                  </a>
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
            No artwork added yet
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

export default MusicArtwork;
