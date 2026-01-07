import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Trash2, Loader2, Plus, Pencil, X, Check, ChevronUp, ChevronDown } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface MusicArtwork {
  id: string;
  youtube_url: string;
  youtube_video_id: string;
  title: string;
  thumbnail_url: string;
  display_order: number;
}

const MusicArtworkAdmin = () => {
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: artworks } = useQuery({
    queryKey: ["music-artworks"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("music_artworks")
        .select("*")
        .order("display_order", { ascending: true });
      
      if (error) throw error;
      return data as MusicArtwork[];
    },
  });

  const addMutation = useMutation({
    mutationFn: async (url: string) => {
      setIsLoading(true);
      
      const { data: youtubeData, error: functionError } = await supabase.functions.invoke(
        "fetch-youtube-info",
        { body: { url } }
      );

      if (functionError || youtubeData?.error) {
        throw new Error(youtubeData?.error || "Failed to fetch YouTube info");
      }

      const { data, error } = await supabase
        .from("music_artworks")
        .insert({
          youtube_url: url,
          youtube_video_id: youtubeData.videoId,
          title: youtubeData.title,
          thumbnail_url: youtubeData.thumbnailUrl,
          display_order: (artworks?.length || 0) + 1,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["music-artworks"] });
      setYoutubeUrl("");
      toast({ title: "Artwork added successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
    onSettled: () => {
      setIsLoading(false);
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, title }: { id: string; title: string }) => {
      const { error } = await supabase
        .from("music_artworks")
        .update({ title })
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["music-artworks"] });
      setEditingId(null);
      toast({ title: "Title updated" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("music_artworks")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["music-artworks"] });
      toast({ title: "Artwork deleted" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const refetchMutation = useMutation({
    mutationFn: async (artwork: MusicArtwork) => {
      const { data: youtubeData, error: functionError } = await supabase.functions.invoke(
        "fetch-youtube-info",
        { body: { url: artwork.youtube_url } }
      );

      if (functionError || youtubeData?.error) {
        throw new Error(youtubeData?.error || "Failed to fetch YouTube info");
      }

      const { error } = await supabase
        .from("music_artworks")
        .update({
          title: youtubeData.title,
          thumbnail_url: youtubeData.thumbnailUrl,
        })
        .eq("id", artwork.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["music-artworks"] });
      toast({ title: "Info refreshed from YouTube" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const reorderMutation = useMutation({
    mutationFn: async ({ id, direction }: { id: string; direction: "up" | "down" }) => {
      if (!artworks) return;
      
      const currentIndex = artworks.findIndex((a) => a.id === id);
      if (currentIndex === -1) return;
      
      const swapIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;
      if (swapIndex < 0 || swapIndex >= artworks.length) return;

      const currentItem = artworks[currentIndex];
      const swapItem = artworks[swapIndex];

      // Swap display_order values
      await supabase
        .from("music_artworks")
        .update({ display_order: swapItem.display_order })
        .eq("id", currentItem.id);

      await supabase
        .from("music_artworks")
        .update({ display_order: currentItem.display_order })
        .eq("id", swapItem.id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["music-artworks"] });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  return (
    <div className="space-y-6 font-sans">
      {/* Add New */}
      <div className="rounded-2xl bg-card border border-border/50 overflow-hidden">
        <div className="p-6">
          <Label htmlFor="youtube-url" className="mb-3 block text-sm font-medium">Add YouTube Link</Label>
          <div className="flex gap-3">
            <Input
              id="youtube-url"
              placeholder="https://youtube.com/watch?v=..."
              value={youtubeUrl}
              onChange={(e) => setYoutubeUrl(e.target.value)}
              className="flex-1 h-11 rounded-xl border-border/50 bg-muted/30 focus:bg-background transition-colors"
            />
            <Button
              onClick={() => addMutation.mutate(youtubeUrl)}
              disabled={!youtubeUrl || isLoading}
              className="h-11 rounded-xl px-5"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Plus className="w-4 h-4" />
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* List */}
      <div className="space-y-3">
        {artworks?.map((artwork, index) => (
          <div 
            key={artwork.id} 
            className="group relative rounded-2xl bg-card border border-border/50 overflow-hidden transition-all duration-300 hover:shadow-lg hover:shadow-primary/5"
          >
            {/* Reorder buttons */}
            <div className="absolute left-3 top-1/2 -translate-y-1/2 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <Button
                size="icon"
                variant="ghost"
                className="w-7 h-7 rounded-lg hover:bg-muted"
                onClick={() => reorderMutation.mutate({ id: artwork.id, direction: "up" })}
                disabled={index === 0}
              >
                <ChevronUp className="w-4 h-4" />
              </Button>
              <Button
                size="icon"
                variant="ghost"
                className="w-7 h-7 rounded-lg hover:bg-muted"
                onClick={() => reorderMutation.mutate({ id: artwork.id, direction: "down" })}
                disabled={index === (artworks?.length || 0) - 1}
              >
                <ChevronDown className="w-4 h-4" />
              </Button>
            </div>
            <div className="p-5 pl-14">
              <div className="flex gap-4">
                <div className="w-32 aspect-video bg-muted rounded-xl overflow-hidden flex-shrink-0 ring-1 ring-border/50">
                  <img
                    src={artwork.thumbnail_url}
                    alt={artwork.title}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-1 min-w-0 py-1">
                  {editingId === artwork.id ? (
                    <div className="flex gap-2 items-center">
                      <Input
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        className="flex-1 h-9 rounded-lg"
                      />
                      <Button
                        size="icon"
                        variant="ghost"
                        className="w-8 h-8 rounded-lg"
                        onClick={() => updateMutation.mutate({ id: artwork.id, title: editTitle })}
                      >
                        <Check className="w-4 h-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="w-8 h-8 rounded-lg"
                        onClick={() => setEditingId(null)}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ) : (
                    <p className="font-medium truncate text-sm">{artwork.title}</p>
                  )}
                  <p className="text-xs text-muted-foreground truncate mt-1.5">
                    {artwork.youtube_url}
                  </p>
                </div>
                <div className="flex gap-1 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button
                    size="icon"
                    variant="ghost"
                    className="w-8 h-8 rounded-lg hover:bg-muted"
                    onClick={() => {
                      setEditingId(artwork.id);
                      setEditTitle(artwork.title);
                    }}
                  >
                    <Pencil className="w-4 h-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="w-8 h-8 rounded-lg hover:bg-muted"
                    onClick={() => refetchMutation.mutate(artwork)}
                    disabled={refetchMutation.isPending}
                  >
                    {refetchMutation.isPending ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <span className="text-xs">↻</span>
                    )}
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="w-8 h-8 rounded-lg text-destructive hover:text-destructive hover:bg-destructive/10"
                    onClick={() => deleteMutation.mutate(artwork.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MusicArtworkAdmin;
