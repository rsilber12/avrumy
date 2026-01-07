import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import MusicArtworkAdmin from "@/components/admin/MusicArtworkAdmin";
import DesignGalleryAdmin from "@/components/admin/DesignGalleryAdmin";

const Admin = () => {
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
        <h1 className="text-3xl font-light tracking-wide mb-8">Admin Panel</h1>

        <Tabs defaultValue="music" className="w-full">
          <TabsList className="mb-8">
            <TabsTrigger value="music">Music Artwork</TabsTrigger>
            <TabsTrigger value="gallery">Design Gallery</TabsTrigger>
          </TabsList>

          <TabsContent value="music">
            <MusicArtworkAdmin />
          </TabsContent>

          <TabsContent value="gallery">
            <DesignGalleryAdmin />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Admin;
