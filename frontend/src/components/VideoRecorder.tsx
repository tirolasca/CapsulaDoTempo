import { useEffect, useRef, useState } from "react";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import {
  addDoc,
  collection,
  serverTimestamp,
  Timestamp,
} from "firebase/firestore";
import { storage, db } from "../lib/firebase";
import type { User } from "firebase/auth";

type Props = {
  user: User;
};

export function VideoRecorder({ user }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunks = useRef<Blob[]>([]);

  const [recording, setRecording] = useState(false);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [openDate, setOpenDate] = useState<string>("");
  const [error, setError] = useState<string | null>(null);

  function getSupportedMimeType() {
    const types = [
      "video/webm;codecs=vp9,opus",
      "video/webm;codecs=vp8,opus",
      "video/webm",
    ];
    return types.find((t) => MediaRecorder.isTypeSupported(t));
  }

  function cleanup() {
    mediaRecorderRef.current = null;
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }

  async function startRecording() {
    if (!openDate) {
      setError("Escolha uma data para abrir a cápsula.");
      return;
    }

    try {
      setError(null);
      setVideoUrl(null);
      chunks.current = [];

      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.muted = true;
        await videoRef.current.play();
      }

      const mimeType = getSupportedMimeType();
      const mediaRecorder = new MediaRecorder(
        stream,
        mimeType ? { mimeType } : undefined,
      );

      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.current.push(e.data);
      };

      mediaRecorder.onstop = async () => {
        try {
          const blob = new Blob(chunks.current, {
            type: mediaRecorder.mimeType,
          });

          const fileRef = ref(storage, `videos/${Date.now()}.webm`);
          await uploadBytes(fileRef, blob);
          const downloadURL = await getDownloadURL(fileRef);

          await addDoc(collection(db, "capsulas"), {
            userId: user.uid,
            userName: user.displayName,
            videoUrl: downloadURL,
            createdAt: serverTimestamp(),
            openAt: Timestamp.fromDate(new Date(openDate)),
          });

          setVideoUrl(downloadURL);
        } catch (err) {
          console.error(err);
          setError("Erro ao salvar a cápsula.");
        } finally {
          cleanup();
        }
      };

      mediaRecorder.start(1000);
      setRecording(true);
    } catch (err) {
      console.error(err);
      setError("Erro ao acessar câmera ou microfone.");
    }
  }

  function stopRecording() {
    mediaRecorderRef.current?.stop();
    setRecording(false);
  }

  useEffect(() => {
    return () => cleanup();
  }, []);

  return (
    <div className="w-full max-w-lg rounded-2xl bg-white/10 backdrop-blur-xl shadow-2xl border border-white/10 p-6 flex flex-col gap-5">
      <header className="text-center">
        <h1 className="text-xl font-semibold text-white">
          Cápsula do Tempo 🎥
        </h1>
        <p className="text-sm text-gray-400">
          Grave uma mensagem para o futuro
        </p>
      </header>

      {/* DATA */}
      <div>
        <label className="text-sm text-gray-300 mb-1 block">
          Abrir cápsula em:
        </label>
        <input
          type="date"
          value={openDate}
          min={new Date().toISOString().split("T")[0]}
          onChange={(e) => setOpenDate(e.target.value)}
          className="w-full px-3 py-2 rounded-lg bg-black/40 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* VIDEO */}
      <div className="relative rounded-xl overflow-hidden bg-black aspect-video">
        <video
          ref={videoRef}
          src={videoUrl ?? undefined}
          autoPlay
          playsInline
          muted={!videoUrl}
          controls={!!videoUrl}
          className="w-full h-full object-cover"
        />

        {recording && (
          <span className="absolute top-3 left-3 flex items-center gap-2 bg-red-600/90 text-white text-xs px-3 py-1 rounded-full animate-pulse">
            <span className="h-2 w-2 bg-white rounded-full" />
            Gravando
          </span>
        )}
      </div>

      {error && <p className="text-red-400 text-sm text-center">{error}</p>}

      <div className="flex gap-3 justify-center">
        {!recording ? (
          <button
            onClick={startRecording}
            className="px-5 py-2.5 rounded-xl bg-blue-600 text-white font-medium hover:bg-blue-700 transition"
          >
            🎬 Gravar
          </button>
        ) : (
          <button
            onClick={stopRecording}
            className="px-5 py-2.5 rounded-xl bg-red-600 text-white font-medium hover:bg-red-700 transition"
          >
            ⏹ Parar
          </button>
        )}

        {videoUrl && (
          <a
            href={videoUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="px-5 py-2.5 rounded-xl bg-emerald-600 text-white font-medium hover:bg-emerald-700 transition"
          >
            ▶ Ver Vídeo
          </a>
        )}
      </div>
    </div>
  );
}
