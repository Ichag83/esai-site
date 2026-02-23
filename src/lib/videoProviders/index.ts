import type { UGCBlueprint } from "../schemas/ugcBlueprint";
import { buildSoraPayload, type SoraPayload } from "./sora";
import { buildVeoPayload, type VeoPayload } from "./veo";
import { buildTalkingActorPayload, type TalkingActorPayload } from "./talking_actor";

export type Provider = "sora" | "veo" | "runway" | "kling" | "talking_actor";

export type ProviderPayload = SoraPayload | VeoPayload | TalkingActorPayload | RunwayPayload | KlingPayload;

// Minimal stubs for providers without a dedicated adapter yet
interface RunwayPayload {
  model: "runway-gen4";
  duration_s: number;
  prompt_text: string;
}

interface KlingPayload {
  model: "kling-v2";
  duration_s: number;
  prompt_text: string;
}

function buildRunwayPayload(blueprint: UGCBlueprint): RunwayPayload {
  const lines = blueprint.scenes.map((s) => `${s.action} (${s.seconds}s)`).join("; ");
  return {
    model: "runway-gen4",
    duration_s: blueprint.video.duration_s,
    prompt_text: `UGC smartphone video. Brazilian creator. ${blueprint.product.name}. ${lines}. Natural lighting, handheld, no cinematic effects.`,
  };
}

function buildKlingPayload(blueprint: UGCBlueprint): KlingPayload {
  const lines = blueprint.scenes.map((s) => `${s.action} (${s.seconds}s)`).join("; ");
  return {
    model: "kling-v2",
    duration_s: blueprint.video.duration_s,
    prompt_text: `UGC smartphone video. Brazilian creator with ${blueprint.product.name}. ${lines}. Natural Brazilian environment. No slow-motion. No dramatic lighting.`,
  };
}

export function buildProviderPayload(
  provider: Provider,
  blueprint: UGCBlueprint
): ProviderPayload {
  switch (provider) {
    case "sora":
      return buildSoraPayload(blueprint);
    case "veo":
      return buildVeoPayload(blueprint);
    case "talking_actor":
      return buildTalkingActorPayload(blueprint);
    case "runway":
      return buildRunwayPayload(blueprint);
    case "kling":
      return buildKlingPayload(blueprint);
    default:
      throw new Error(`Unknown provider: ${provider}`);
  }
}
