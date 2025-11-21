import { supabase } from "@/lib/supabase";
import OpenAI from "openai";

export async function POST(req) {
  try {
    const body = await req.json();
    const { themeId, duration, userId } = body;

    if (!themeId || !duration || !userId) {
      return Response.json(
        { error: "Missing required fields (themeId, duration, userId)" },
        { status: 400 }
      );
    }

    // → 1. Haal het thema op
    const { data: theme, error: themeErr } = await supabase
      .from("video_themes")
      .select("*")
      .eq("id", themeId)
      .single();

    if (themeErr || !theme) {
      return Response.json(
        { error: "Theme not found" },
        { status: 404 }
      );
    }

    // → 2. OpenAI instellen
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    // → 3. Script prompt genereren
    const prompt = `
You are an AI script generator for short TikTok style no-face videos.
Theme: ${theme.name}
Writing Style: ${theme.template_style}
Voice: ${theme.voice_preset}
Duration: ${duration} seconds
Instructions: ${theme.prompt_template}

Write a short script, maximum ${duration * 12} characters,
optimized for short-form content, attention grabbing,
and suitable for AI video generation.
    `;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 200,
    });

    const script = completion.choices[0].message.content;

    // → 4. Opslaan in database (optioneel)
    const { data: saved } = await supabase
      .from("generated_scripts")
      .insert({
        user_id: userId,
        theme_id: themeId,
        script_text: script,
        duration,
      })
      .select()
      .single();

    return Response.json({
      success: true,
      script,
      savedId: saved?.id || null,
    });

  } catch (error) {
    console.error("SCRIPT ERROR:", error);
    return Response.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

