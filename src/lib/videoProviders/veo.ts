import type { UGCBlueprint } from "../schemas/ugcBlueprint";

export interface VeoPayload {
  model: "veo-3.1";
  duration_s: number;
  resolution: string;
  prompt_text: string;
  start_frame: null;
}

export function buildVeoPayload(blueprint: UGCBlueprint): VeoPayload {
  const resolution = blueprint.video.format === "9:16" ? "720x1280" : "1280x720";

  const sceneDescriptions = blueprint.scenes
    .map(
      (s) =>
        `Scene ${s.scene_id} (${s.seconds}s): ${s.action}. "${s.dialogue}". ${s.environment}.`
    )
    .join(" | ");

  const castDesc = blueprint.cast[0];
  const voiceNote = castDesc
    ? `${castDesc.voice.gender === "female" ? "Female" : "Male"} Brazilian creator, ${castDesc.voice.energy} energy.`
    : "Brazilian creator.";

  const prompt_text = [
    "Vertical smartphone UGC video. Natural ambient lighting, no studio lights. Slight handheld camera, no smooth stabilizer. No slow-motion effects.",
    voiceNote,
    `Featuring ${blueprint.product.name}.`,
    sceneDescriptions,
    "Authentic Brazilian daily-life setting. Portuguese (Brazilian) dialogue throughout. No text graphics in video frame.",
  ].join(" ");

  return {
    model: "veo-3.1",
    duration_s: blueprint.video.duration_s,
    resolution,
    prompt_text,
    start_frame: null,
  };
}
