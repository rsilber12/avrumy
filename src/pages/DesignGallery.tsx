import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

const DesignGallery = () => {
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
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-light tracking-wide mb-6 opacity-0 animate-fade-in-up">
          Design Gallery
        </h1>
        <p className="text-muted-foreground text-lg md:text-xl font-light opacity-0 animate-fade-in-up" style={{ animationDelay: "0.2s" }}>
          A collection of our creative work
        </p>
      </header>

      {/* Gallery Grid */}
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((item, index) => (
            <div 
              key={item}
              className="aspect-square bg-secondary rounded-sm overflow-hidden opacity-0 animate-fade-in-up group cursor-pointer"
              style={{ animationDelay: `${0.3 + index * 0.1}s` }}
            >
              <div className="w-full h-full flex items-center justify-center text-muted-foreground group-hover:text-foreground transition-colors duration-300">
                <span className="text-sm">Project {item}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Coming Soon Note */}
      <p className="text-center text-muted-foreground mt-20 text-sm opacity-0 animate-fade-in" style={{ animationDelay: "1s" }}>
        More projects coming soon
      </p>
    </div>
  );
};

export default DesignGallery;
