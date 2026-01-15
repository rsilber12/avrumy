import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { usePageVisit } from "@/hooks/useAnalytics";
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
      <div>
        <Link 
          to="/" 
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors duration-300 mb-16 group"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm">Back</span>
        </Link>
      </div>

      {/* Header */}
      <header className="max-w-4xl mx-auto text-center mb-20">
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-light tracking-normal">
          Design
        </h1>
      </header>

      {/* Gallery Grid */}
      <div className="max-w-7xl mx-auto">
        {projects && projects.length > 0 ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {projects.map((project) => (
              <div key={project.id}>
                <GlowingCard className="rounded-xl cursor-pointer">
                  <div
                    className="overflow-hidden rounded-xl"
                    onClick={() => navigate(`/project/${project.id}`)}
                  >
                    <img
                      src={project.main_image_url}
                      alt={project.title || "Gallery project"}
                      className="w-full h-auto object-cover hover:scale-105 transition-transform duration-500"
                    />
                  </div>
                </GlowingCard>
              </div>
            ))}
          </div>
        ) : !isLoading ? (
          <p className="text-center text-muted-foreground">No projects added yet</p>
        ) : null}
      </div>

      {/* Footer */}
      <footer className="text-center text-muted-foreground text-sm mt-20">
        © {new Date().getFullYear()} Avrumy, LLC
      </footer>
    </div>
  );
};

export default DesignGallery;
