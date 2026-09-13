Place pre-recorded candidate assets here (MP4 portrait 9:16 recommended):

  avatar-idle.png   — shown when the avatar is not speaking (from media/avatar/avatar.png)
  speak-1.mp4
  speak-2.mp4
  speak-3.mp4       (optional)

Idle image + videos share the same portrait frame (no circle, no stretch).

Then enable in .env:

  VITE_PRERECORDED_AVATAR=true

Rebuild the site. Video plays muted (random clip per answer); Edge TTS carries the voice.
