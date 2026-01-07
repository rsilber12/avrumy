import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import MusicArtworkAdmin from "@/components/admin/MusicArtworkAdmin";
import DesignGalleryAdmin from "@/components/admin/DesignGalleryAdmin";
import UsersAdmin from "@/components/admin/UsersAdmin";
import AnalyticsAdmin from "@/components/admin/AnalyticsAdmin";

const Admin = () => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setIsAuthenticated(!!session);
        if (!session) {
          navigate("/login");
        }
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsAuthenticated(!!session);
      if (!session) {
        navigate("/login");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background px-6 py-12">
      {/* Back Navigation */}
      <Link 
        to="/" 
        className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors duration-300 mb-8"
      >
        <ArrowLeft className="w-4 h-4" />
        <span className="text-sm">Back to site</span>
      </Link>

      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-light tracking-normal mb-8">Admin Panel</h1>

        <Tabs defaultValue="analytics" className="w-full">
          <TabsList className="mb-8">
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="music">Music Artwork</TabsTrigger>
            <TabsTrigger value="gallery">Design Gallery</TabsTrigger>
            <TabsTrigger value="users">Users</TabsTrigger>
          </TabsList>

          <TabsContent value="analytics">
            <AnalyticsAdmin />
          </TabsContent>

          <TabsContent value="music">
            <MusicArtworkAdmin />
          </TabsContent>

          <TabsContent value="gallery">
            <DesignGalleryAdmin />
          </TabsContent>

          <TabsContent value="users">
            <UsersAdmin />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Admin;
