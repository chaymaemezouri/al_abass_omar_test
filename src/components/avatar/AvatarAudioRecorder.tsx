import { useEffect, useRef, useState } from "react";

type Props = {
  disabled?: boolean;
  onRecorded: (blob: Blob, filename: string) => void;
  labels: { speak: string; stop: string; unsupported: string };
};

export function AvatarAudioRecorder({ disabled, onRecorded, labels }: Props) {
  const [recording, setRecording] = useState(false);
  const [supported, setSupported] = useState(true);
  const mediaRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  useEffect(() => {
    if (typeof window !== "undefined" && !navigator.mediaDevices?.getUserMedia) {
      setSupported(false);
    }
  }, []);

  async function start() {
    if (disabled || recording) return;
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const mime = MediaRecorder.isTypeSupported("audio/webm") ? "audio/webm" : "audio/mp4";
    const recorder = new MediaRecorder(stream, { mimeType: mime });
    chunksRef.current = [];
    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data);
    };
    recorder.onstop = () => {
      stream.getTracks().forEach((t) => t.stop());
      const blob = new Blob(chunksRef.current, { type: mime });
      const ext = mime.includes("webm") ? "webm" : "m4a";
      onRecorded(blob, `question.${ext}`);
    };
    mediaRef.current = recorder;
    recorder.start();
    setRecording(true);
  }

  function stop() {
    mediaRef.current?.stop();
    setRecording(false);
  }

  if (!supported) {
    return <p className="avatar-rec-hint">{labels.unsupported}</p>;
  }

  return (
    <div className="avatar-rec">
      {!recording ? (
        <button type="button" className="avatar-btn ghost" disabled={disabled} onClick={start}>
          {labels.speak}
        </button>
      ) : (
        <button type="button" className="avatar-btn danger" onClick={stop}>
          {labels.stop}
        </button>
      )}
    </div>
  );
}
