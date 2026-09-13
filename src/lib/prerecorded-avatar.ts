/**
 * Pre-recorded lip-sync loops (3 variants) — random pick per answer.
 * Enable with VITE_PRERECORDED_AVATAR=true after dropping files in public/candidate-speaking/.
 *
 * Video plays muted + looped; Edge TTS audio is the real voice (sync feeling, not letter-perfect).
 */

/** Idle portrait shown when the speaking clip is not playing. */
export const CANDIDATE_IDLE_PORTRAIT = "/candidate-speaking/avatar-idle.png";

const CLIP_PATHS = [
  "/candidate-speaking/speak-1.mp4",
  "/candidate-speaking/speak-2.mp4",
  // Add when ready: "/candidate-speaking/speak-3.mp4",
] as const;

let lastClipIndex = -1;

export function isPrerecordedAvatarEnabled(): boolean {
  return true;
}

/** Random clip; avoids repeating the same file twice in a row when possible. */
export function pickSpeakingClip(): string {
  const clips = CLIP_PATHS.filter(Boolean);
  if (clips.length === 0) return "";
  if (clips.length === 1) return clips[0]!;

  let idx = Math.floor(Math.random() * clips.length);
  if (idx === lastClipIndex) {
    idx = (idx + 1 + Math.floor(Math.random() * (clips.length - 1))) % clips.length;
  }
  lastClipIndex = idx;
  return clips[idx]!;
}

export function speakingClipPaths(): readonly string[] {
  return CLIP_PATHS;
}
