import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Trash2, Loader2, Plus, Pencil, X, Check } from "lucide-react";
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
      
      // Fetch YouTube info via edge function
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

  return (
    <div className="space-y-8">
      {/* Add New */}
      <Card>
        <CardContent className="pt-6">
          <Label htmlFor="youtube-url" className="mb-2 block">Add YouTube Link</Label>
          <div className="flex gap-2">
            <Input
              id="youtube-url"
              placeholder="https://youtube.com/watch?v=..."
              value={youtubeUrl}
              onChange={(e) => setYoutubeUrl(e.target.value)}
              className="flex-1"
            />
            <Button
              onClick={() => addMutation.mutate(youtubeUrl)}
              disabled={!youtubeUrl || isLoading}
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Plus className="w-4 h-4" />
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* List */}
      <div className="space-y-4">
        {artworks?.map((artwork) => (
          <Card key={artwork.id}>
            <CardContent className="pt-6">
              <div className="flex gap-4">
                <div className="w-40 aspect-video bg-secondary rounded overflow-hidden flex-shrink-0">
                  <img
                    src={artwork.thumbnail_url}
                    alt={artwork.title}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  {editingId === artwork.id ? (
                    <div className="flex gap-2 items-center">
                      <Input
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        className="flex-1"
                      />
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => updateMutation.mutate({ id: artwork.id, title: editTitle })}
                      >
                        <Check className="w-4 h-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => setEditingId(null)}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ) : (
                    <p className="font-medium truncate">{artwork.title}</p>
                  )}
                  <p className="text-sm text-muted-foreground truncate mt-1">
                    {artwork.youtube_url}
                  </p>
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  <Button
                    size="icon"
                    variant="ghost"
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
                    onClick={() => deleteMutation.mutate(artwork.id)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default MusicArtworkAdmin;
