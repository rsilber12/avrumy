import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { usePageVisit } from "@/hooks/useAnalytics";

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
      <Link 
        to="/" 
        className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors duration-300 mb-16"
      >
        <ArrowLeft className="w-4 h-4" />
        <span className="text-sm">Back</span>
      </Link>

      {/* Header */}
      <header className="max-w-4xl mx-auto text-center mb-20">
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-light tracking-normal opacity-0 animate-fade-in-up">
          Design Gallery
        </h1>
      </header>

      {/* Gallery Grid - Masonry Style */}
      <div className="max-w-7xl mx-auto">
        {isLoading ? (
          <div className="columns-2 lg:columns-4 gap-4">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((item) => (
              <div key={item} className="break-inside-avoid mb-4">
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
              <div
                key={project.id}
                className="break-inside-avoid mb-4 opacity-0 animate-fade-in-up cursor-pointer group"
                style={{ animationDelay: `${0.1 + index * 0.05}s` }}
                onClick={() => navigate(`/project/${project.id}`)}
              >
                <div className="overflow-hidden rounded-xl">
                  <img
                    src={project.main_image_url}
                    alt={project.title || "Gallery project"}
                    className="w-full h-auto object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                </div>
              </div>
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
