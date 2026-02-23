/**
 * UGC video job worker (mock implementation).
 *
 * Polls Supabase for PENDING video_jobs, marks them RUNNING, waits 2s,
 * then marks them DONE with a mock result URL.
 *
 * Usage:
 *   npm run worker
 *
 * Requires env vars (loaded from .env.local via tsx --env-file):
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 */

import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
const POLL_LIMIT = 5;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error("[worker] Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

interface VideoJob {
  id: string;
  provider: string;
  provider_payload: unknown;
  attempts: number;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function processJob(job: VideoJob): Promise<void> {
  console.log(`[worker] processing job ${job.id} (provider: ${job.provider})`);

  // Mark RUNNING and increment attempts
  const { error: runErr } = await supabase
    .from("video_jobs")
    .update({ status: "RUNNING", attempts: job.attempts + 1 })
    .eq("id", job.id);

  if (runErr) {
    console.error(`[worker] failed to mark job ${job.id} RUNNING:`, runErr);
    return;
  }

  try {
    // Mock: simulate render latency
    await sleep(2000);

    // Mark DONE with mock result
    const { error: doneErr } = await supabase
      .from("video_jobs")
      .update({
        status: "DONE",
        result_urls: ["https://example.com/mock.mp4"],
        error: null,
      })
      .eq("id", job.id);

    if (doneErr) {
      console.error(`[worker] failed to mark job ${job.id} DONE:`, doneErr);
    } else {
      console.log(`[worker] job ${job.id} → DONE`);
    }
  } catch (err) {
    console.error(`[worker] job ${job.id} threw:`, err);

    await supabase
      .from("video_jobs")
      .update({ status: "FAILED", error: String(err) })
      .eq("id", job.id);

    console.log(`[worker] job ${job.id} → FAILED`);
  }
}

async function processPendingJobs(): Promise<void> {
  const { data: jobs, error } = await supabase
    .from("video_jobs")
    .select("id, provider, provider_payload, attempts")
    .eq("status", "PENDING")
    .order("created_at", { ascending: true })
    .limit(POLL_LIMIT);

  if (error) {
    console.error("[worker] fetch error:", error);
    return;
  }

  if (!jobs || jobs.length === 0) {
    console.log("[worker] no pending jobs found");
    return;
  }

  console.log(`[worker] found ${jobs.length} pending job(s)`);

  for (const job of jobs as VideoJob[]) {
    await processJob(job);
  }
}

processPendingJobs()
  .then(() => {
    console.log("[worker] done");
    process.exit(0);
  })
  .catch((err) => {
    console.error("[worker] fatal error:", err);
    process.exit(1);
  });
