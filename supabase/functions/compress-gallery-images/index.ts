import { createClient } from "https://esm.sh/@supabase/supabase-js@2.89.0";
import { Image } from "https://deno.land/x/imagescript@1.3.0/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const MAX_SIZE_BYTES = 512 * 1024; // 512KB
const TARGET_SIZE_BYTES = 400 * 1024; // Target 400KB to have some margin

type CompressResult = 
  | { status: "compressed"; originalSize: number; newSize: number; newUrl: string }
  | { status: "skipped"; reason: string; originalSize: number }
  | { status: "error"; error: string };

async function compressImage(
  imageUrl: string,
  supabaseUrl: string,
  supabaseServiceKey: string
): Promise<CompressResult> {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Fetch the original image
    const response = await fetch(imageUrl);
    if (!response.ok) {
      console.error(`Failed to fetch image: ${imageUrl}`);
      return { status: "error", error: "Failed to fetch image" };
    }

    const originalBuffer = await response.arrayBuffer();
    const originalSize = originalBuffer.byteLength;

    // If already under 512KB, skip compression
    if (originalSize <= MAX_SIZE_BYTES) {
      console.log(`Image already under 512KB: ${imageUrl} (${originalSize} bytes)`);
      return { status: "skipped", reason: "Already under 512KB", originalSize };
    }

    console.log(`Compressing image from ${originalSize} bytes...`);

    // Decode the image using ImageScript
    const image = await Image.decode(new Uint8Array(originalBuffer));
    
    // Calculate scale factor to reduce file size
    const scaleFactor = Math.sqrt(TARGET_SIZE_BYTES / originalSize);
    const newWidth = Math.round(image.width * scaleFactor);
    const newHeight = Math.round(image.height * scaleFactor);
    
    console.log(`Resizing from ${image.width}x${image.height} to ${newWidth}x${newHeight}`);
    
    // Resize the image
    image.resize(newWidth, newHeight);
    
    // Encode as JPEG with quality adjustment
    let quality = 85;
    let encoded = await image.encodeJPEG(quality);
    
    // If still too large, reduce quality iteratively
    while (encoded.byteLength > MAX_SIZE_BYTES && quality > 30) {
      quality -= 10;
      encoded = await image.encodeJPEG(quality);
      console.log(`Quality ${quality}: ${encoded.byteLength} bytes`);
    }
    
    const newSize = encoded.byteLength;
    console.log(`Compressed to ${newSize} bytes (quality: ${quality})`);

    // Upload compressed image to storage
    const fileName = `projects/compressed_${crypto.randomUUID()}.jpg`;
    
    const { error: uploadError } = await supabase.storage
      .from("gallery")
      .upload(fileName, encoded, {
        contentType: "image/jpeg",
        upsert: true,
      });

    if (uploadError) {
      console.error(`Upload failed: ${uploadError.message}`);
      return { status: "error", error: `Upload failed: ${uploadError.message}` };
    }

    const { data: { publicUrl } } = supabase.storage
      .from("gallery")
      .getPublicUrl(fileName);

    return {
      status: "compressed",
      originalSize,
      newSize,
      newUrl: publicUrl,
    };
  } catch (err) {
    console.error(`Error compressing image: ${err}`);
    return { status: "error", error: err instanceof Error ? err.message : "Unknown error" };
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const body = await req.json().catch(() => ({}));
    const { mode, projectId, imageId, imageType } = body;

    // Mode: "list" - return list of images that need compression
    if (mode === "list") {
      const { data: projects } = await supabase
        .from("gallery_projects")
        .select("id, main_image_url, display_order")
        .order("display_order", { ascending: true });

      const { data: projectImages } = await supabase
        .from("gallery_project_images")
        .select("id, image_url, project_id, display_order")
        .order("display_order", { ascending: true });

      const imagesToCompress: { id: string; projectId: string; type: "main" | "sub"; url: string; displayOrder: number }[] = [];

      // Check main images in parallel for speed
      const mainImageChecks = await Promise.allSettled(
        (projects || []).map(async (project) => {
          try {
            const response = await fetch(project.main_image_url, { method: "HEAD" });
            const contentLength = response.headers.get("content-length");
            if (contentLength && parseInt(contentLength, 10) > MAX_SIZE_BYTES) {
              return { 
                id: project.id, 
                projectId: project.id, 
                type: "main" as const, 
                url: project.main_image_url,
                displayOrder: project.display_order ?? 0
              };
            }
          } catch {
            // Skip if can't check
          }
          return null;
        })
      );

      // Check sub images in parallel
      const subImageChecks = await Promise.allSettled(
        (projectImages || []).map(async (image) => {
          try {
            const response = await fetch(image.image_url, { method: "HEAD" });
            const contentLength = response.headers.get("content-length");
            if (contentLength && parseInt(contentLength, 10) > MAX_SIZE_BYTES) {
              return { 
                id: image.id, 
                projectId: image.project_id, 
                type: "sub" as const, 
                url: image.image_url,
                displayOrder: image.display_order ?? 0
              };
            }
          } catch {
            // Skip if can't check
          }
          return null;
        })
      );

      // Collect successful results
      for (const result of mainImageChecks) {
        if (result.status === "fulfilled" && result.value) {
          imagesToCompress.push(result.value);
        }
      }
      for (const result of subImageChecks) {
        if (result.status === "fulfilled" && result.value) {
          imagesToCompress.push(result.value);
        }
      }

      // Sort by displayOrder to ensure compression starts from first visible image
      imagesToCompress.sort((a, b) => a.displayOrder - b.displayOrder);

      return new Response(JSON.stringify({ images: imagesToCompress }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Mode: "compress" - compress a single image
    if (mode === "compress" && projectId && imageType) {
      let imageUrl: string | null = null;

      if (imageType === "main") {
        const { data } = await supabase
          .from("gallery_projects")
          .select("main_image_url")
          .eq("id", projectId)
          .single();
        imageUrl = data?.main_image_url || null;
      } else if (imageType === "sub" && imageId) {
        const { data } = await supabase
          .from("gallery_project_images")
          .select("image_url")
          .eq("id", imageId)
          .single();
        imageUrl = data?.image_url || null;
      }

      if (!imageUrl) {
        return new Response(JSON.stringify({ error: "Image not found" }), {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const result = await compressImage(imageUrl, supabaseUrl, supabaseServiceKey);

      if (result.status === "compressed") {
        // Update database with new URL
        if (imageType === "main") {
          await supabase
            .from("gallery_projects")
            .update({ main_image_url: result.newUrl })
            .eq("id", projectId);
        } else if (imageType === "sub" && imageId) {
          await supabase
            .from("gallery_project_images")
            .update({ image_url: result.newUrl })
            .eq("id", imageId);
        }

        return new Response(JSON.stringify({
          success: true,
          compressed: true,
          originalSize: result.originalSize,
          newSize: result.newSize,
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      } else if (result.status === "skipped") {
        return new Response(JSON.stringify({
          success: true,
          compressed: false,
          reason: result.reason,
          originalSize: result.originalSize,
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      } else {
        // Error case
        return new Response(JSON.stringify({
          success: false,
          error: result.error,
        }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    return new Response(JSON.stringify({ error: "Invalid mode" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("Error:", err);
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
