import { supabase } from "@/lib/supabase";
import ffmpegPath from "ffmpeg-static";
import { spawn } from "child_process";

export async function POST(req) {
  try {
    const body = await req.json();
    const { audioUrl, thumbnailUrl, captions, userId } = body;

    if (!audioUrl || !thumbnailUrl || !captions || !userId) {
      return Response.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // 1. Download audio
    const audioRes = await fetch(audioUrl);
    const audioBuffer = Buffer.from(await audioRes.arrayBuffer());

    // 2. Download image
    const imageRes = await fetch(thumbnailUrl);
    const imageBuffer = Buffer.from(await imageRes.arrayBuffer());

    // 3. Maak tijdelijke bestanden
    const tmpAudio = `/tmp/${userId}-audio.mp3`;
    const tmpImage = `/tmp/${userId}-image.png`;
    const tmpSrt = `/tmp/${userId}-captions.srt`;
    const tmpOutput = `/tmp/${userId}-final.mp4`;

    // schrijf bestanden naar /tmp
    await Bun.write(tmpAudio, audioBuffer);
    await Bun.write(tmpImage, imageBuffer);
    await Bun.write(tmpSrt, convertCaptionsToSrt(captions));

    // 4. FFmpeg commando
    const ffmpegArgs = [
      "-loop", "1",
      "-i", tmpImage,
      "-i", tmpAudio,
      "-vf", `subtitles=${tmpSrt}:force_style='Fontsize=24,PrimaryColour=&H00ffffff&,OutlineColour=&H00000000&,BorderStyle=1,Outline=3'`,
      "-c:v", "libx264",
      "-c:a", "aac",
      "-b:a", "192k",
      "-shortest",
      "-t", "60",
      tmpOutput
    ];

    await runFfmpeg(ffmpegArgs);

    // 5. Lees output video
    const outputBuffer = await Bun.file(tmpOutput).arrayBuffer();

    // 6. Upload naar Supabase
    const finalName = `final-videos/${userId}-${Date.now()}.mp4`;

    const { error: uploadError } = await supabase.storage
      .from("videos")
      .upload(finalName, Buffer.from(outputBuffer), {
        contentType: "video/mp4"
      });

    if (uploadError) {
      return Response.json({ error: uploadError.message }, { status: 500 });
    }

    const { data: publicUrlData } = supabase.storage
      .from("videos")
      .getPublicUrl(finalName);

    return Response.json({
      success: true,
      url: publicUrlData.publicUrl,
      file: finalName
    });

  } catch (error) {
    console.error("RENDER ERROR:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}

/*********** HELPERS ***********/

// captions → .srt
function convertCaptionsToSrt(captions) {
  let srt = "";
  captions.forEach((cap, i) => {
    srt += `${i + 1}\n`;
    srt += `${formatTime(cap.start)} --> ${formatTime(cap.end)}\n`;
    srt += `${cap.text}\n\n`;
  });
  return srt;
}

function formatTime(seconds) {
  const date = new Date(seconds * 1000);
  return date.toISOString().substr(11, 12).replace(".", ",");
}

// Run FFmpeg
function runFfmpeg(args) {
  return new Promise((resolve, reject) => {
    const ff = spawn(ffmpegPath, args);

    ff.stderr.on("data", (d) => console.log("FFmpeg:", d.toString()));

    ff.on("close", (code) => {
      if (code === 0) resolve();
      else reject(new Error("FFmpeg failed with code " + code));
    });
  });
}

