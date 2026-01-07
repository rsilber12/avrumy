import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Trash2, Loader2, Plus, Pencil, Upload, Image } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface GalleryProject {
  id: string;
  title: string | null;
  description: string | null;
  main_image_url: string;
  display_order: number;
}

interface ProjectImage {
  id: string;
  project_id: string;
  image_url: string;
  display_order: number;
}

const DesignGalleryAdmin = () => {
  const [isUploading, setIsUploading] = useState(false);
  const [editingProject, setEditingProject] = useState<GalleryProject | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const subImagesInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: projects } = useQuery({
    queryKey: ["gallery-projects"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("gallery_projects")
        .select("*")
        .order("display_order", { ascending: true });
      
      if (error) throw error;
      return data as GalleryProject[];
    },
  });

  const { data: projectImages } = useQuery({
    queryKey: ["gallery-project-images", editingProject?.id],
    queryFn: async () => {
      if (!editingProject) return [];
      const { data, error } = await supabase
        .from("gallery_project_images")
        .select("*")
        .eq("project_id", editingProject.id)
        .order("display_order", { ascending: true });
      
      if (error) throw error;
      return data as ProjectImage[];
    },
    enabled: !!editingProject,
  });

  const uploadImage = async (file: File): Promise<string> => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${crypto.randomUUID()}.${fileExt}`;
    const filePath = `projects/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from("gallery")
      .upload(filePath, file);

    if (uploadError) throw uploadError;

    const { data: { publicUrl } } = supabase.storage
      .from("gallery")
      .getPublicUrl(filePath);

    return publicUrl;
  };

  const addProjectMutation = useMutation({
    mutationFn: async (file: File) => {
      setIsUploading(true);
      const imageUrl = await uploadImage(file);

      // Get image dimensions for aspect ratio
      const img = new window.Image();
      img.src = URL.createObjectURL(file);
      await new Promise((resolve) => { img.onload = resolve; });
      const aspectRatio = img.width / img.height;

      const { data, error } = await supabase
        .from("gallery_projects")
        .insert({
          main_image_url: imageUrl,
          aspect_ratio: aspectRatio,
          display_order: (projects?.length || 0) + 1,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["gallery-projects"] });
      toast({ title: "Project added" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
    onSettled: () => {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    },
  });

  const updateProjectMutation = useMutation({
    mutationFn: async ({ id, title, description }: { id: string; title: string; description: string }) => {
      const { error } = await supabase
        .from("gallery_projects")
        .update({ title: title || null, description: description || null })
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["gallery-projects"] });
      toast({ title: "Project updated" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const deleteProjectMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("gallery_projects")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["gallery-projects"] });
      setEditingProject(null);
      toast({ title: "Project deleted" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const addSubImageMutation = useMutation({
    mutationFn: async ({ projectId, file }: { projectId: string; file: File }) => {
      const imageUrl = await uploadImage(file);

      const { data, error } = await supabase
        .from("gallery_project_images")
        .insert({
          project_id: projectId,
          image_url: imageUrl,
          display_order: (projectImages?.length || 0) + 1,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["gallery-project-images"] });
      toast({ title: "Image added" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const deleteSubImageMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("gallery_project_images")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["gallery-project-images"] });
      toast({ title: "Image deleted" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      Array.from(files).forEach((file) => {
        addProjectMutation.mutate(file);
      });
    }
  };

  const handleSubImagesSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && editingProject) {
      Array.from(files).forEach((file) => {
        addSubImageMutation.mutate({ projectId: editingProject.id, file });
      });
    }
    if (subImagesInputRef.current) subImagesInputRef.current.value = "";
  };

  return (
    <div className="space-y-8">
      {/* Upload New */}
      <Card>
        <CardContent className="pt-6">
          <Label className="mb-2 block">Add Project Images</Label>
          <div className="flex gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={handleFileSelect}
              className="hidden"
            />
            <Button
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="w-full"
              variant="outline"
            >
              {isUploading ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <Upload className="w-4 h-4 mr-2" />
              )}
              Upload Images
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Projects Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {projects?.map((project) => (
          <Dialog key={project.id}>
            <DialogTrigger asChild>
              <Card 
                className="cursor-pointer hover:ring-2 hover:ring-primary/50 transition-all"
                onClick={() => {
                  setEditingProject(project);
                  setEditTitle(project.title || "");
                  setEditDescription(project.description || "");
                }}
              >
                <CardContent className="p-0">
                  <div className="aspect-square overflow-hidden rounded-t-lg">
                    <img
                      src={project.main_image_url}
                      alt={project.title || "Project"}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="p-3">
                    <p className="text-sm truncate">
                      {project.title || "Untitled"}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Edit Project</DialogTitle>
              </DialogHeader>
              
              <div className="space-y-6">
                {/* Main Image Preview */}
                <div className="aspect-video w-full overflow-hidden rounded-lg bg-secondary">
                  <img
                    src={project.main_image_url}
                    alt={project.title || "Project"}
                    className="w-full h-full object-contain"
                  />
                </div>

                {/* Title & Description */}
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="title">Title (optional)</Label>
                    <Input
                      id="title"
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      placeholder="Project title"
                    />
                  </div>
                  <div>
                    <Label htmlFor="description">Description (optional)</Label>
                    <Textarea
                      id="description"
                      value={editDescription}
                      onChange={(e) => setEditDescription(e.target.value)}
                      placeholder="Project description"
                      rows={3}
                    />
                  </div>
                  <Button
                    onClick={() => updateProjectMutation.mutate({
                      id: project.id,
                      title: editTitle,
                      description: editDescription,
                    })}
                  >
                    Save Changes
                  </Button>
                </div>

                {/* Sub Images */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <Label>Additional Images</Label>
                    <div>
                      <input
                        ref={subImagesInputRef}
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={handleSubImagesSelect}
                        className="hidden"
                      />
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => subImagesInputRef.current?.click()}
                      >
                        <Plus className="w-4 h-4 mr-1" />
                        Add Images
                      </Button>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {projectImages?.map((img) => (
                      <div key={img.id} className="relative group">
                        <div className="aspect-square overflow-hidden rounded bg-secondary">
                          <img
                            src={img.image_url}
                            alt=""
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <Button
                          size="icon"
                          variant="destructive"
                          className="absolute top-1 right-1 w-6 h-6 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => deleteSubImageMutation.mutate(img.id)}
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Delete */}
                <div className="border-t pt-4">
                  <Button
                    variant="destructive"
                    onClick={() => deleteProjectMutation.mutate(project.id)}
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete Project
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        ))}
      </div>
    </div>
  );
};

export default DesignGalleryAdmin;
