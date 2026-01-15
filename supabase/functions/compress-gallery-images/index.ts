import { createClient } from "https://esm.sh/@supabase/supabase-js@2.89.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const MAX_SIZE_BYTES = 512 * 1024; // 512KB

async function compressImage(
  imageUrl: string,
  supabaseUrl: string,
  supabaseServiceKey: string
): Promise<{ originalSize: number; newSize: number; newUrl: string } | null> {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Fetch the original image
    const response = await fetch(imageUrl);
    if (!response.ok) {
      console.error(`Failed to fetch image: ${imageUrl}`);
      return null;
    }

    const originalBuffer = await response.arrayBuffer();
    const originalSize = originalBuffer.byteLength;

    // If already under 512KB, skip compression
    if (originalSize <= MAX_SIZE_BYTES) {
      console.log(`Image already under 512KB: ${imageUrl} (${originalSize} bytes)`);
      return null;
    }

    // Convert to base64 for AI processing
    const base64Image = btoa(
      new Uint8Array(originalBuffer).reduce((data, byte) => data + String.fromCharCode(byte), "")
    );

    // Determine content type
    const contentType = response.headers.get("content-type") || "image/jpeg";
    const dataUrl = `data:${contentType};base64,${base64Image}`;

    // Calculate target dimensions to achieve ~512KB
    // Assuming roughly linear relationship between pixel count and file size
    const reductionRatio = Math.sqrt(MAX_SIZE_BYTES / originalSize);
    
    // Use Lovable AI to compress/resize the image
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY not configured");
    }

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-image-preview",
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: `Resize this image to approximately ${Math.round(reductionRatio * 100)}% of its current dimensions while maintaining the exact aspect ratio. Keep the image quality as high as possible while reducing the file size. Output the resized image.`,
              },
              {
                type: "image_url",
                image_url: {
                  url: dataUrl,
                },
              },
            ],
          },
        ],
        modalities: ["image", "text"],
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error(`AI compression failed: ${errorText}`);
      return null;
    }

    const aiData = await aiResponse.json();
    const generatedImage = aiData.choices?.[0]?.message?.images?.[0]?.image_url?.url;

    if (!generatedImage) {
      console.error("No image returned from AI");
      return null;
    }

    // Extract base64 data from data URL
    const base64Match = generatedImage.match(/^data:image\/(\w+);base64,(.+)$/);
    if (!base64Match) {
      console.error("Invalid image format returned");
      return null;
    }

    const [, format, base64Data] = base64Match;
    const binaryString = atob(base64Data);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }

    const newSize = bytes.byteLength;

    // Upload compressed image to storage
    const fileName = `projects/compressed_${crypto.randomUUID()}.${format === "png" ? "png" : "jpg"}`;
    
    const { error: uploadError } = await supabase.storage
      .from("gallery")
      .upload(fileName, bytes, {
        contentType: `image/${format}`,
        upsert: true,
      });

    if (uploadError) {
      console.error(`Upload failed: ${uploadError.message}`);
      return null;
    }

    const { data: { publicUrl } } = supabase.storage
      .from("gallery")
      .getPublicUrl(fileName);

    return {
      originalSize,
      newSize,
      newUrl: publicUrl,
    };
  } catch (err) {
    console.error(`Error compressing image: ${err}`);
    return null;
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

    // Fetch all gallery projects
    const { data: projects, error: projectsError } = await supabase
      .from("gallery_projects")
      .select("id, main_image_url");

    if (projectsError) {
      throw new Error(`Failed to fetch projects: ${projectsError.message}`);
    }

    // Fetch all project images
    const { data: projectImages, error: imagesError } = await supabase
      .from("gallery_project_images")
      .select("id, image_url");

    if (imagesError) {
      throw new Error(`Failed to fetch project images: ${imagesError.message}`);
    }

    const results = {
      processed: 0,
      compressed: 0,
      skipped: 0,
      failed: 0,
      details: [] as { id: string; type: string; originalSize: number; newSize: number }[],
    };

    // Process main project images
    for (const project of projects || []) {
      results.processed++;
      const result = await compressImage(project.main_image_url, supabaseUrl, supabaseServiceKey);
      
      if (result) {
        // Update project with new URL
        const { error: updateError } = await supabase
          .from("gallery_projects")
          .update({ main_image_url: result.newUrl })
          .eq("id", project.id);

        if (updateError) {
          console.error(`Failed to update project ${project.id}: ${updateError.message}`);
          results.failed++;
        } else {
          results.compressed++;
          results.details.push({
            id: project.id,
            type: "main",
            originalSize: result.originalSize,
            newSize: result.newSize,
          });
        }
      } else {
        results.skipped++;
      }
    }

    // Process additional project images
    for (const image of projectImages || []) {
      results.processed++;
      const result = await compressImage(image.image_url, supabaseUrl, supabaseServiceKey);
      
      if (result) {
        // Update image with new URL
        const { error: updateError } = await supabase
          .from("gallery_project_images")
          .update({ image_url: result.newUrl })
          .eq("id", image.id);

        if (updateError) {
          console.error(`Failed to update image ${image.id}: ${updateError.message}`);
          results.failed++;
        } else {
          results.compressed++;
          results.details.push({
            id: image.id,
            type: "sub",
            originalSize: result.originalSize,
            newSize: result.newSize,
          });
        }
      } else {
        results.skipped++;
      }
    }

    return new Response(JSON.stringify(results), {
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
