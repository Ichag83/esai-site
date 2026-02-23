import type { UGCBlueprint } from "../schemas/ugcBlueprint";

export interface TalkingActorPayload {
  model: "talking_actor";
  script: string;
  voice: {
    gender: "female" | "male";
    accent: "br";
    energy: "calm" | "excited" | "serious";
  };
  actor_image_prompt: string;
}

export function buildTalkingActorPayload(blueprint: UGCBlueprint): TalkingActorPayload {
  const castMember = blueprint.cast[0];

  // Concatenate dialogue from all scenes into a single spoken script
  const script = blueprint.scenes
    .filter((s) => s.dialogue.trim().length > 0)
    .map((s) => s.dialogue.trim())
    .join(" ");

  const voice = castMember?.voice ?? {
    gender: "female" as const,
    accent: "br" as const,
    energy: "excited" as const,
  };

  // Generate a detailed actor image prompt for avatar generation
  const wardrobe = castMember?.wardrobe ?? "casual Brazilian everyday clothing";
  const description = castMember?.description ?? "Young Brazilian person with natural features";
  const firstScene = blueprint.scenes[0];
  const background = firstScene?.environment ?? "bright Brazilian apartment";

  const actor_image_prompt = [
    `${description}.`,
    `Wearing ${wardrobe}.`,
    `Standing or sitting in: ${background}.`,
    "Natural expression, looking at camera. Smartphone selfie framing. No dramatic lighting. Authentic UGC style.",
    "Brazilian aesthetic.",
  ].join(" ");

  return {
    model: "talking_actor",
    script,
    voice: {
      gender: voice.gender,
      accent: "br",
      energy: voice.energy,
    },
    actor_image_prompt,
  };
}
