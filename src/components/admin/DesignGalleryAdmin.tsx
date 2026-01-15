import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Trash2, Loader2, Plus, Upload, ChevronUp, ChevronDown, Shuffle, CheckSquare, X } from "lucide-react";
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
  const [uploadCount, setUploadCount] = useState(0);
  const [editingProject, setEditingProject] = useState<GalleryProject | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [isSelectMode, setIsSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const fileInputRef = useRef<HTMLInputElement>(null);
  const subImagesInputRef = useRef<HTMLInputElement>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);
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
      const imageUrl = await uploadImage(file);

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
      setUploadCount((prev) => {
        const newCount = prev - 1;
        if (newCount === 0) {
          setIsUploading(false);
          toast({ title: "All images uploaded" });
        }
        return newCount;
      });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      setUploadCount((prev) => {
        const newCount = prev - 1;
        if (newCount === 0) {
          setIsUploading(false);
        }
        return newCount;
      });
    },
    onSettled: () => {
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

  const reorderMutation = useMutation({
    mutationFn: async ({ id, direction }: { id: string; direction: "up" | "down" }) => {
      if (!projects) return;
      
      const currentIndex = projects.findIndex((p) => p.id === id);
      if (currentIndex === -1) return;
      
      const swapIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;
      if (swapIndex < 0 || swapIndex >= projects.length) return;

      const currentItem = projects[currentIndex];
      const swapItem = projects[swapIndex];

      await supabase
        .from("gallery_projects")
        .update({ display_order: swapItem.display_order })
        .eq("id", currentItem.id);

      await supabase
        .from("gallery_projects")
        .update({ display_order: currentItem.display_order })
        .eq("id", swapItem.id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["gallery-projects"] });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const bulkDeleteMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      const { error } = await supabase
        .from("gallery_projects")
        .delete()
        .in("id", ids);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["gallery-projects"] });
      setSelectedIds(new Set());
      setIsSelectMode(false);
      toast({ title: `${selectedIds.size} project(s) deleted` });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const shuffleMutation = useMutation({
    mutationFn: async () => {
      if (!projects || projects.length < 2) return;
      
      const shuffled = [...projects].sort(() => Math.random() - 0.5);
      
      for (let i = 0; i < shuffled.length; i++) {
        await supabase
          .from("gallery_projects")
          .update({ display_order: i + 1 })
          .eq("id", shuffled[i].id);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["gallery-projects"] });
      toast({ title: "Order shuffled" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const toggleSelect = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const toggleSelectAll = () => {
    if (!projects) return;
    if (selectedIds.size === projects.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(projects.map((p) => p.id)));
    }
  };

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

  const handleFiles = (files: FileList | File[]) => {
    const fileArray = Array.from(files).filter((file) => file.type.startsWith("image/"));
    if (fileArray.length === 0) return;
    
    setIsUploading(true);
    setUploadCount(fileArray.length);
    
    fileArray.forEach((file) => {
      addProjectMutation.mutate(file);
    });
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      handleFiles(files);
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

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (dropZoneRef.current && !dropZoneRef.current.contains(e.relatedTarget as Node)) {
      setIsDragging(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFiles(files);
    }
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Drag & Drop Upload Zone */}
      <div
        ref={dropZoneRef}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`rounded-2xl border-2 border-dashed transition-all duration-300 ${
          isDragging 
            ? "border-primary bg-primary/5 scale-[1.01]" 
            : "border-border/50 bg-card hover:border-primary/50"
        }`}
      >
        <div className="p-8 text-center">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleFileSelect}
            className="hidden"
          />
          {isUploading ? (
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">
                Uploading {uploadCount} image{uploadCount !== 1 ? "s" : ""}...
              </p>
            </div>
          ) : (
            <div 
              className="flex flex-col items-center gap-3 cursor-pointer"
              onClick={() => fileInputRef.current?.click()}
            >
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-colors ${
                isDragging ? "bg-primary/10" : "bg-muted"
              }`}>
                <Upload className={`w-6 h-6 transition-colors ${isDragging ? "text-primary" : "text-muted-foreground"}`} />
              </div>
              <div>
                <p className="text-sm font-medium">
                  {isDragging ? "Drop images here" : "Drag & drop images here"}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  or click to browse • Each image becomes a project
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Action Bar */}
      <div className="flex items-center gap-2 flex-wrap">
        <Button
          variant={isSelectMode ? "secondary" : "outline"}
          size="sm"
          className="h-9 rounded-xl gap-2"
          onClick={() => {
            setIsSelectMode(!isSelectMode);
            setSelectedIds(new Set());
          }}
        >
          {isSelectMode ? <X className="w-4 h-4" /> : <CheckSquare className="w-4 h-4" />}
          {isSelectMode ? "Cancel" : "Select"}
        </Button>
        
        {isSelectMode && (
          <>
            <Button
              variant="outline"
              size="sm"
              className="h-9 rounded-xl"
              onClick={toggleSelectAll}
            >
              {selectedIds.size === projects?.length ? "Deselect All" : "Select All"}
            </Button>
            <Button
              variant="destructive"
              size="sm"
              className="h-9 rounded-xl gap-2"
              disabled={selectedIds.size === 0 || bulkDeleteMutation.isPending}
              onClick={() => bulkDeleteMutation.mutate(Array.from(selectedIds))}
            >
              <Trash2 className="w-4 h-4" />
              Delete ({selectedIds.size})
            </Button>
          </>
        )}
        
        <Button
          variant="outline"
          size="sm"
          className="h-9 rounded-xl gap-2"
          onClick={() => shuffleMutation.mutate()}
          disabled={shuffleMutation.isPending || !projects || projects.length < 2}
        >
          <Shuffle className="w-4 h-4" />
          Shuffle
        </Button>
      </div>

      {/* Projects Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {projects?.map((project, index) => (
          <Dialog key={project.id}>
            <div className="relative group">
              {/* Select checkbox */}
              {isSelectMode && (
                <div 
                  className="absolute top-2 left-2 z-20"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleSelect(project.id);
                  }}
                >
                  <Checkbox
                    checked={selectedIds.has(project.id)}
                    className="w-6 h-6 rounded-lg border-2 bg-background/80 backdrop-blur-sm data-[state=checked]:bg-primary"
                  />
                </div>
              )}
              {/* Reorder buttons */}
              {!isSelectMode && (
                <div className="absolute top-2 left-2 z-10 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button
                    size="icon"
                    variant="secondary"
                    className="w-7 h-7 rounded-lg bg-background/80 backdrop-blur-sm hover:bg-background"
                    onClick={(e) => {
                      e.stopPropagation();
                      reorderMutation.mutate({ id: project.id, direction: "up" });
                    }}
                    disabled={index === 0}
                  >
                    <ChevronUp className="w-4 h-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="secondary"
                    className="w-7 h-7 rounded-lg bg-background/80 backdrop-blur-sm hover:bg-background"
                    onClick={(e) => {
                      e.stopPropagation();
                      reorderMutation.mutate({ id: project.id, direction: "down" });
                    }}
                    disabled={index === (projects?.length || 0) - 1}
                  >
                    <ChevronDown className="w-4 h-4" />
                  </Button>
                </div>
              )}
              {isSelectMode ? (
                <div 
                  className={`cursor-pointer rounded-2xl overflow-hidden bg-card border-2 transition-all duration-300 ${
                    selectedIds.has(project.id) ? "border-primary" : "border-border/50"
                  }`}
                  onClick={() => toggleSelect(project.id)}
                >
                  <div className="aspect-square overflow-hidden">
                    <img
                      src={project.main_image_url}
                      alt={project.title || "Project"}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="p-4">
                    <p className="text-sm truncate font-medium">
                      {project.title || "Untitled"}
                    </p>
                  </div>
                </div>
              ) : (
                <DialogTrigger asChild>
                  <div 
                    className="cursor-pointer rounded-2xl overflow-hidden bg-card border border-border/50 transition-all duration-300 hover:shadow-xl hover:shadow-primary/5 hover:-translate-y-1"
                    onClick={() => {
                      setEditingProject(project);
                      setEditTitle(project.title || "");
                      setEditDescription(project.description || "");
                    }}
                  >
                    <div className="aspect-square overflow-hidden">
                      <img
                        src={project.main_image_url}
                        alt={project.title || "Project"}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    </div>
                    <div className="p-4">
                      <p className="text-sm truncate font-medium">
                        {project.title || "Untitled"}
                      </p>
                    </div>
                  </div>
                </DialogTrigger>
              )}
            </div>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto font-sans rounded-2xl border-border/50">
              <DialogHeader>
                <DialogTitle className="text-lg font-medium">Edit Project</DialogTitle>
              </DialogHeader>
              
              <div className="space-y-6">
                {/* Main Image Preview */}
                <div className="aspect-video w-full overflow-hidden rounded-xl bg-muted ring-1 ring-border/50">
                  <img
                    src={project.main_image_url}
                    alt={project.title || "Project"}
                    className="w-full h-full object-contain"
                  />
                </div>

                {/* Title & Description */}
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="title" className="text-sm font-medium">Title (optional)</Label>
                    <Input
                      id="title"
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      placeholder="Project title"
                      className="h-11 rounded-xl border-border/50 bg-muted/30 focus:bg-background transition-colors"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description" className="text-sm font-medium">Description (optional)</Label>
                    <Textarea
                      id="description"
                      value={editDescription}
                      onChange={(e) => setEditDescription(e.target.value)}
                      placeholder="Project description"
                      rows={3}
                      className="rounded-xl border-border/50 bg-muted/30 focus:bg-background transition-colors resize-none"
                    />
                  </div>
                  <Button
                    onClick={() => updateProjectMutation.mutate({
                      id: project.id,
                      title: editTitle,
                      description: editDescription,
                    })}
                    className="h-10 rounded-xl"
                  >
                    Save Changes
                  </Button>
                </div>

                {/* Sub Images */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <Label className="text-sm font-medium">Additional Images</Label>
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
                        className="h-8 rounded-lg"
                        onClick={() => subImagesInputRef.current?.click()}
                      >
                        <Plus className="w-4 h-4 mr-1" />
                        Add Images
                      </Button>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    {projectImages?.map((img) => (
                      <div key={img.id} className="relative group/img">
                        <div className="aspect-square overflow-hidden rounded-xl bg-muted ring-1 ring-border/50">
                          <img
                            src={img.image_url}
                            alt=""
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <Button
                          size="icon"
                          variant="destructive"
                          className="absolute top-2 right-2 w-7 h-7 rounded-lg opacity-0 group-hover/img:opacity-100 transition-opacity"
                          onClick={() => deleteSubImageMutation.mutate(img.id)}
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Delete */}
                <div className="border-t border-border/50 pt-6">
                  <Button
                    variant="destructive"
                    onClick={() => deleteProjectMutation.mutate(project.id)}
                    className="h-10 rounded-xl"
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
