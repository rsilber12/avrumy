import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { usePageVisit } from "@/hooks/useAnalytics";

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
          Music Artwork
        </h1>
      </header>

      {/* Gallery Grid */}
      <div className="max-w-6xl mx-auto">
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {[1, 2, 3, 4].map((item) => (
              <div key={item} className="animate-pulse">
                <div className="aspect-video bg-secondary rounded-lg" />
                <div className="h-4 bg-secondary rounded mt-4 w-3/4" />
              </div>
            ))}
          </div>
        ) : artworks && artworks.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {artworks.map((artwork, index) => (
              <a
                key={artwork.id}
                href={artwork.youtube_url}
                target="_blank"
                rel="noopener noreferrer"
                className="group opacity-0 animate-fade-in-up"
                style={{ animationDelay: `${0.1 + index * 0.15}s` }}
              >
                <div className="aspect-video bg-secondary rounded-lg overflow-hidden">
                  <img
                    src={artwork.thumbnail_url}
                    alt={artwork.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                </div>
                <p className="mt-4 text-sm text-muted-foreground group-hover:text-foreground transition-colors duration-300">
                  {artwork.title}
                </p>
              </a>
            ))}
          </div>
        ) : (
          <p className="text-center text-muted-foreground">No artwork added yet</p>
        )}
      </div>

      {/* Footer */}
      <footer className="text-center text-muted-foreground text-sm mt-20">
        © {new Date().getFullYear()} Avrumy, LLC
      </footer>
    </div>
  );
};

export default MusicArtwork;
