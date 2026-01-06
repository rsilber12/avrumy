import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

const Contact = () => {
  return (
    <div className="min-h-screen bg-background px-6 py-12 flex flex-col">
      {/* Back Navigation */}
      <Link 
        to="/" 
        className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors duration-300 mb-16"
      >
        <ArrowLeft className="w-4 h-4" />
        <span className="tracking-widest uppercase text-sm">Back</span>
      </Link>

      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center justify-center max-w-2xl mx-auto text-center">
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-light tracking-wide mb-12 opacity-0 animate-fade-in-up">
          Get in Touch
        </h1>

        <div className="space-y-8 opacity-0 animate-fade-in-up" style={{ animationDelay: "0.3s" }}>
          <p className="text-muted-foreground text-lg md:text-xl font-light leading-relaxed">
            We'd love to hear about your project.
            <br />
            Let's create something beautiful together.
          </p>

          <a 
            href="mailto:hello@avrumy.com" 
            className="inline-block text-foreground text-xl md:text-2xl font-light tracking-wide hover:text-accent transition-colors duration-300"
          >
            hello@avrumy.com
          </a>
        </div>

        {/* Location */}
        <div className="mt-20 opacity-0 animate-fade-in-up" style={{ animationDelay: "0.5s" }}>
          <p className="text-muted-foreground text-sm tracking-widest uppercase mb-2">
            Based in
          </p>
          <p className="text-foreground text-lg font-light">
            New York City
          </p>
        </div>
      </div>

      {/* Footer */}
      <footer className="text-center text-muted-foreground text-sm tracking-widest mt-auto pt-12 opacity-0 animate-fade-in" style={{ animationDelay: "0.8s" }}>
        © {new Date().getFullYear()} Avrumy
      </footer>
    </div>
  );
};

export default Contact;
