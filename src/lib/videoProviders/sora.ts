import type { UGCBlueprint } from "../schemas/ugcBlueprint";

export interface SoraPayload {
  model: "sora-2-pro";
  duration_s: number;
  resolution: string;
  prompt_text: string;
}

export function buildSoraPayload(blueprint: UGCBlueprint): SoraPayload {
  const resolution = blueprint.video.format === "9:16" ? "720x1280" : "1280x720";

  const sceneDescriptions = blueprint.scenes
    .map(
      (s) =>
        `[${s.seconds}s] ${s.action}. Creator says: "${s.dialogue}". Camera: ${s.camera.shot} ${s.camera.rig}, ${s.camera.movement}. Setting: ${s.environment}.`
    )
    .join(" ");

  const castDesc = blueprint.cast[0];
  const creatorDesc = castDesc
    ? `Brazilian creator (${castDesc.description}), wearing ${castDesc.wardrobe}.`
    : "Young Brazilian creator.";

  const prompt_text = [
    "UGC-style smartphone video. Natural daylight only, no dramatic lighting. Handheld stable, no slow motion, no cinematic camera movements.",
    `${creatorDesc}`,
    `Product: ${blueprint.product.name} (${blueprint.product.category}).`,
    sceneDescriptions,
    "Authentic Brazilian apartment/street environment. No text overlays. No heavy post-processing.",
  ].join(" ");

  return {
    model: "sora-2-pro",
    duration_s: blueprint.video.duration_s,
    resolution,
    prompt_text,
  };
}
