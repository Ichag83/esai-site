import { z } from "zod";

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Validates that a seconds string matches "a-b" where a and b are integers and a < b.
 */
export function validateSecondsRange(s: string): boolean {
  const match = s.match(/^(\d+)-(\d+)$/);
  if (!match) return false;
  const a = parseInt(match[1], 10);
  const b = parseInt(match[2], 10);
  return a < b;
}

/**
 * After Zod validation, verify that the sum of all scene durations equals
 * video.duration_s within ±2 seconds.
 */
export function validateTotalDuration(
  blueprint: UGCBlueprint
): { valid: boolean; diff: number } {
  let total = 0;
  for (const scene of blueprint.scenes) {
    const match = scene.seconds.match(/^(\d+)-(\d+)$/);
    if (match) {
      total += parseInt(match[2], 10) - parseInt(match[1], 10);
    }
  }
  const diff = Math.abs(total - blueprint.video.duration_s);
  return { valid: diff <= 2, diff };
}

// ─────────────────────────────────────────────────────────────────────────────
// Sub-schemas
// ─────────────────────────────────────────────────────────────────────────────

const CameraSchema = z.object({
  shot: z.enum(["close-up", "medium", "wide"]),
  rig: z.enum(["handheld selfie", "tripod", "overhead"]),
  movement: z.enum(["static", "slight shake", "pan", "push-in"]),
  lens: z.literal("smartphone"),
});

const SceneSchema = z.object({
  scene_id: z.string().min(1),
  seconds: z
    .string()
    .refine(validateSecondsRange, {
      message: "seconds must match 'a-b' where a and b are integers and a < b",
    }),
  camera: CameraSchema,
  environment: z.string().min(1),
  action: z.string().min(1),
  dialogue: z.string(),
  on_screen_text: z.string().nullable(),
  audio_notes: z.string().nullable(),
  editing: z.string().nullable(),
});

const VoiceSchema = z.object({
  gender: z.enum(["female", "male"]),
  accent: z.literal("br"),
  energy: z.enum(["calm", "excited", "serious"]),
});

const CastMemberSchema = z.object({
  role: z.literal("creator"),
  description: z.string().min(1),
  wardrobe: z.string().min(1),
  voice: VoiceSchema,
});

const ProductSchema = z.object({
  name: z.string().min(1),
  category: z.string().min(1),
  claims: z.array(z.string()),
  must_show: z.array(z.string()),
});

const VideoMetaSchema = z.object({
  duration_s: z.number().int().min(8).max(60),
  format: z.enum(["9:16", "16:9"]),
  style: z.enum(["UGC selfie", "UGC tripod", "POV demo"]),
  language: z.literal("pt-BR"),
});

// ─────────────────────────────────────────────────────────────────────────────
// Root blueprint schema
// ─────────────────────────────────────────────────────────────────────────────

export const UGCBlueprintSchema = z.object({
  video: VideoMetaSchema,
  cast: z.array(CastMemberSchema).min(1),
  product: ProductSchema,
  scenes: z.array(SceneSchema).min(1),
});

// ─────────────────────────────────────────────────────────────────────────────
// TypeScript types
// ─────────────────────────────────────────────────────────────────────────────

export type UGCBlueprint = z.infer<typeof UGCBlueprintSchema>;
export type Scene = z.infer<typeof SceneSchema>;
export type CastMember = z.infer<typeof CastMemberSchema>;
export type Camera = z.infer<typeof CameraSchema>;
