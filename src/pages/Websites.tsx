import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { usePageVisit } from "@/hooks/useAnalytics";

const Websites = () => {
  usePageVisit("/websites");

  const { data: websites, isLoading } = useQuery({
    queryKey: ['websites'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('websites')
        .select('*')
        .order('display_order', { ascending: true });
      
      if (error) throw error;
      return data;
    }
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

      {/* Title */}
      <div className="max-w-6xl mx-auto mb-16">
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-light tracking-normal opacity-0 animate-fade-in-up text-center">
          Websites
        </h1>
      </div>

      {/* Gallery Grid */}
      <div className="max-w-6xl mx-auto">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-pulse text-muted-foreground">Loading...</div>
          </div>
        ) : websites && websites.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {websites.map((website, index) => (
              <a
                key={website.id}
                href={website.url.startsWith('http') ? website.url : `https://${website.url}`}
                target="_blank"
                rel="noopener noreferrer"
                className="group opacity-0 animate-fade-in-up block"
                style={{ animationDelay: `${index * 0.1}s`, animationFillMode: "forwards" }}
              >
                <div className="aspect-video bg-muted rounded-lg overflow-hidden mb-4">
                  <img
                    src={website.custom_thumbnail_url || website.thumbnail_url || '/placeholder.svg'}
                    alt={website.title}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                </div>
                <p className="text-foreground text-sm font-light tracking-wide group-hover:text-muted-foreground transition-colors duration-300">
                  {website.title}
                </p>
              </a>
            ))}
          </div>
        ) : (
          <div className="text-center py-20 text-muted-foreground">
            No websites yet
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="text-center text-muted-foreground text-sm mt-20">
        © {new Date().getFullYear()} Avrumy, LLC
      </footer>
    </div>
  );
};

export default Websites;
