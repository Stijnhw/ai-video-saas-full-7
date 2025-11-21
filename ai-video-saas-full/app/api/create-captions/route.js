import OpenAI from "openai";
import { supabase } from "@/lib/supabase";

export async function POST(req) {
  try {
    const body = await req.json();
    const { audioUrl, userId } = body;

    if (!audioUrl || !userId) {
      return Response.json(
        { error: "Missing required fields (audioUrl, userId)" },
        { status: 400 }
      );
    }

    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    // → 1. Download audio from Supabase Storage
    const audioRes = await fetch(audioUrl);
    const audioArrayBuffer = await audioRes.arrayBuffer();
    const audioBuffer = Buffer.from(audioArrayBuffer);

    // → 2. Convert to File object for Whisper
    const audioFile = new File([audioBuffer], "audio.mp3", {
      type: "audio/mpeg",
    });

    // → 3. Whisper transcription (timestamps enabled)
    const transcript = await openai.audio.transcriptions.create({
      file: audioFile,
      model: "whisper-1",
      response_format: "verbose_json",
      timestamp_granularities: ["word"],
      language: "en",
    });

    // → 4. Convert Whisper verbose JSON into caption blocks
    let captions = [];
    let currentBlock = { start: 0, end: 0, text: "" };

    for (let w of transcript.words) {
      if (currentBlock.text.length === 0) {
        currentBlock.start = w.start;
      }

      currentBlock.text += w.word + " ";
      currentBlock.end = w.end;

      // split captions into readable blocks (around 6-8 words)
      if (currentBlock.text.split(" ").length > 7) {
        captions.push({
          start: currentBlock.start,
          end: currentBlock.end,
          text: currentBlock.text.trim(),
        });

        currentBlock = { start: 0, end: 0, text: "" };
      }
    }

    if (currentBlock.text.length > 0) {
      captions.push(currentBlock);
    }

    // → 5. Return captions
    return Response.json({
      success: true,
      captions,
    });

  } catch (error) {
    console.error("CAPTIONS ERROR:", error);
    return Response.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
