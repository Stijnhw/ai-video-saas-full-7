import OpenAI from "openai";
import { supabase } from "@/lib/supabase";

export async function POST(req) {
  try {
    const body = await req.json();
    const { script, voicePreset, userId } = body;

    if (!script || !voicePreset || !userId) {
      return Response.json(
        { error: "Missing required fields (script, voicePreset, userId)" },
        { status: 400 }
      );
    }

    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    // → 1. Maak audio met OpenAI TTS
    const audio = await openai.audio.speech.create({
      model: "gpt-4o-mini-tts",
      voice: voicePreset,
      input: script,
      format: "mp3",
    });

    const audioArrayBuffer = await audio.arrayBuffer();
    const audioBuffer = Buffer.from(audioArrayBuffer);

    // → 2. Upload audio naar Supabase Storage
    const filename = `voice/${userId}-${Date.now()}.mp3`;

    let { error: uploadError } = await supabase.storage
      .from("videos")
      .upload(filename, audioBuffer, {
        contentType: "audio/mpeg",
      });

    if (uploadError) {
      return Response.json(
        { error: uploadError.message },
        { status: 500 }
      );
    }

    // → 3. Get public URL
    const { data: publicUrlData } = supabase.storage
      .from("videos")
      .getPublicUrl(filename);

    return Response.json({
      success: true,
      url: publicUrlData.publicUrl,
      file: filename,
    });

  } catch (error) {
    console.error("VOICE ERROR:", error);
    return Response.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

