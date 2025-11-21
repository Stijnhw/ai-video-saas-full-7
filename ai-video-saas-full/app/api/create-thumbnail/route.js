import OpenAI from "openai";
import { supabase } from "@/lib/supabase";

export async function POST(req) {
  try {
    const body = await req.json();
    const { script, themeName, userId } = body;

    if (!script || !themeName || !userId) {
      return Response.json(
        { error: "Missing required fields (script, themeName, userId)" },
        { status: 400 }
      );
    }

    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    // → 1. Maak een afbeelding gebaseerd op script en thema
    const prompt = `
Create a detailed 9:16 portrait-style thumbnail for a TikTok/YouTube Short.
Theme: ${themeName}.
Description based on this script:
${script}

Requirements:
- Dark cinematic colors
- High contrast
- Sharp details
- Eye-catching
- No text
- No watermarks
- No copyright issues
    `;

    const result = await openai.images.generate({
      model: "gpt-image-1",
      prompt,
      size: "1024x1792",
    });

    const imageBase64 = result.data[0].b64_json;
    const imageBuffer = Buffer.from(imageBase64, "base64");

    // → 2. Upload naar Supabase Storage
    const filename = `thumbnails/${userId}-${Date.now()}.png`;

    const { error: uploadError } = await supabase.storage
      .from("videos")
      .upload(filename, imageBuffer, {
        contentType: "image/png",
      });

    if (uploadError) {
      return Response.json(
        { error: uploadError.message },
        { status: 500 }
      );
    }

    // → 3. Haal de publieke URL op
    const { data: publicUrlData } = supabase.storage
      .from("videos")
      .getPublicUrl(filename);

    return Response.json({
      success: true,
      url: publicUrlData.publicUrl,
      file: filename,
    });

  } catch (error) {
    console.error("THUMBNAIL ERROR:", error);
    return Response.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

