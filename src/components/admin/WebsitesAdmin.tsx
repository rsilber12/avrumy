import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Trash2, Plus, ArrowUp, ArrowDown, Upload, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const WebsitesAdmin = () => {
  const [newUrl, setNewUrl] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const [isCapturing, setIsCapturing] = useState<string | null>(null);
  const fileInputRefs = useRef<{ [key: string]: HTMLInputElement | null }>({});
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: websites, isLoading } = useQuery({
    queryKey: ['websites-admin'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('websites')
        .select('*')
        .order('display_order', { ascending: true });
      
      if (error) throw error;
      return data;
    }
  });

  const addWebsite = useMutation({
    mutationFn: async (url: string) => {
      // Format URL
      let formattedUrl = url.trim();
      if (!formattedUrl.startsWith('http://') && !formattedUrl.startsWith('https://')) {
        formattedUrl = `https://${formattedUrl}`;
      }

      // Extract domain for title
      const urlObj = new URL(formattedUrl);
      const title = urlObj.hostname;

      // Get max display order
      const maxOrder = websites?.reduce((max, w) => Math.max(max, w.display_order || 0), 0) || 0;

      // Generate screenshot using a free screenshot API
      let thumbnailUrl = null;
      try {
        thumbnailUrl = `https://api.microlink.io/?url=${encodeURIComponent(formattedUrl)}&screenshot=true&meta=false&embed=screenshot.url`;
      } catch (e) {
        console.error('Failed to generate screenshot:', e);
      }

      const { error } = await supabase
        .from('websites')
        .insert({
          url: formattedUrl,
          title: title,
          thumbnail_url: thumbnailUrl,
          display_order: maxOrder + 1
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['websites-admin'] });
      queryClient.invalidateQueries({ queryKey: ['websites'] });
      setNewUrl("");
      setIsAdding(false);
      toast({ title: "Website added successfully" });
    },
    onError: (error) => {
      toast({ title: "Failed to add website", description: error.message, variant: "destructive" });
    }
  });

  const deleteWebsite = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('websites')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['websites-admin'] });
      queryClient.invalidateQueries({ queryKey: ['websites'] });
      toast({ title: "Website deleted" });
    }
  });

  const updateOrder = useMutation({
    mutationFn: async ({ id, newOrder }: { id: string; newOrder: number }) => {
      const { error } = await supabase
        .from('websites')
        .update({ display_order: newOrder })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['websites-admin'] });
      queryClient.invalidateQueries({ queryKey: ['websites'] });
    }
  });

  const uploadThumbnail = useMutation({
    mutationFn: async ({ id, file }: { id: string; file: File }) => {
      const fileExt = file.name.split('.').pop();
      const fileName = `website-${id}-${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('gallery')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('gallery')
        .getPublicUrl(fileName);

      const { error: updateError } = await supabase
        .from('websites')
        .update({ custom_thumbnail_url: publicUrl })
        .eq('id', id);

      if (updateError) throw updateError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['websites-admin'] });
      queryClient.invalidateQueries({ queryKey: ['websites'] });
      toast({ title: "Thumbnail uploaded successfully" });
    },
    onError: (error) => {
      toast({ title: "Failed to upload thumbnail", description: error.message, variant: "destructive" });
    }
  });

  const regenerateScreenshot = useMutation({
    mutationFn: async ({ id, url }: { id: string; url: string }) => {
      const thumbnailUrl = `https://api.microlink.io/?url=${encodeURIComponent(url)}&screenshot=true&meta=false&embed=screenshot.url&timestamp=${Date.now()}`;
      
      const { error } = await supabase
        .from('websites')
        .update({ thumbnail_url: thumbnailUrl, custom_thumbnail_url: null })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['websites-admin'] });
      queryClient.invalidateQueries({ queryKey: ['websites'] });
      setIsCapturing(null);
      toast({ title: "Screenshot regenerated" });
    }
  });

  const moveItem = (index: number, direction: 'up' | 'down') => {
    if (!websites) return;
    
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= websites.length) return;

    const currentItem = websites[index];
    const swapItem = websites[newIndex];

    updateOrder.mutate({ id: currentItem.id, newOrder: swapItem.display_order || 0 });
    updateOrder.mutate({ id: swapItem.id, newOrder: currentItem.display_order || 0 });
  };

  const handleFileChange = (id: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      uploadThumbnail.mutate({ id, file });
    }
  };

  const handleAddWebsite = (e: React.FormEvent) => {
    e.preventDefault();
    if (newUrl.trim()) {
      addWebsite.mutate(newUrl);
    }
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Add New Website */}
      {isAdding ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-medium">Add New Website</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAddWebsite} className="space-y-4">
              <div>
                <Label htmlFor="url" className="text-sm">Website URL</Label>
                <Input
                  id="url"
                  type="text"
                  placeholder="www.example.com"
                  value={newUrl}
                  onChange={(e) => setNewUrl(e.target.value)}
                  className="mt-1"
                />
              </div>
              <div className="flex gap-2">
                <Button type="submit" disabled={addWebsite.isPending} size="sm">
                  {addWebsite.isPending ? "Adding..." : "Add Website"}
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  size="sm"
                  onClick={() => setIsAdding(false)}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      ) : (
        <Button onClick={() => setIsAdding(true)} className="gap-2" size="sm">
          <Plus className="w-4 h-4" />
          Add Website
        </Button>
      )}

      {/* Website List */}
      {isLoading ? (
        <div className="text-muted-foreground">Loading...</div>
      ) : websites && websites.length > 0 ? (
        <div className="space-y-4">
          {websites.map((website, index) => (
            <Card key={website.id} className="overflow-hidden">
              <CardContent className="p-4">
                <div className="flex gap-4">
                  {/* Thumbnail */}
                  <div className="w-48 aspect-video bg-muted rounded-lg overflow-hidden flex-shrink-0">
                    <img
                      src={website.custom_thumbnail_url || website.thumbnail_url || '/placeholder.svg'}
                      alt={website.title}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{website.title}</p>
                    <a 
                      href={website.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-xs text-muted-foreground hover:text-foreground truncate block"
                    >
                      {website.url}
                    </a>

                    {/* Actions */}
                    <div className="flex gap-2 mt-3 flex-wrap">
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        ref={(el) => { fileInputRefs.current[website.id] = el; }}
                        onChange={(e) => handleFileChange(website.id, e)}
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-1 text-xs"
                        onClick={() => fileInputRefs.current[website.id]?.click()}
                      >
                        <Upload className="w-3 h-3" />
                        Upload Thumbnail
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-1 text-xs"
                        disabled={isCapturing === website.id}
                        onClick={() => {
                          setIsCapturing(website.id);
                          regenerateScreenshot.mutate({ id: website.id, url: website.url });
                        }}
                      >
                        <RefreshCw className={`w-3 h-3 ${isCapturing === website.id ? 'animate-spin' : ''}`} />
                        Regenerate
                      </Button>
                    </div>
                  </div>

                  {/* Order & Delete Controls */}
                  <div className="flex flex-col gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => moveItem(index, 'up')}
                      disabled={index === 0}
                    >
                      <ArrowUp className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => moveItem(index, 'down')}
                      disabled={index === websites.length - 1}
                    >
                      <ArrowDown className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive hover:text-destructive"
                      onClick={() => deleteWebsite.mutate(website.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 text-muted-foreground">
          No websites yet. Add your first website above.
        </div>
      )}
    </div>
  );
};

export default WebsitesAdmin;
