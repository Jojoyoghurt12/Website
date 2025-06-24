"use client";

import { useRef, useState } from "react";

export default function Page() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [cameraStarted, setCameraStarted] = useState(false);
  const [facingMode, setFacingMode] = useState<"user" | "environment">("user");
  const [photo, setPhoto] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<string | null>(null);

  const startCamera = async (mode: "user" | "environment" = "user") => {
    setError(null);
    setPhoto(null);
    setUploadResult(null);

    if (cameraStarted) {
      stopCamera();
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { exact: mode } },
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setCameraStarted(true);
        setFacingMode(mode);
      }
    } catch (err: any) {
      setError(err.message || "Unable to access camera.");
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      (videoRef.current.srcObject as MediaStream)
        .getTracks()
        .forEach((track) => track.stop());
      videoRef.current.srcObject = null;
    }
    setCameraStarted(false);
  };

  const takePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataURL = canvas.toDataURL("image/png");
    setPhoto(dataURL);
    stopCamera();
  };

  const uploadPhoto = async () => {
    if (!photo) return;
    setUploading(true);
    setUploadResult(null);
    setError(null);

    try {
      const response = await fetch("/api/upload", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ imageBase64: photo }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Upload failed");
      }

      const data = await response.json();
      setUploadResult(`Upload success! File ID: ${data.fileId}`);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  };

  const toggleCamera = () => {
    startCamera(facingMode === "user" ? "environment" : "user");
  };

  return (
    <div style={{ padding: 20 }}>
      <h1>Oslava 50tky - Monika a Palo</h1>

      <div style={{ marginBottom: 10 }}>
        <button onClick={() => startCamera(facingMode)} disabled={cameraStarted}>
          {cameraStarted ? "Kamera sa zapla" : "Zapni kameru"}
        </button>{" "}
        <button onClick={toggleCamera} disabled={!cameraStarted}>
          {facingMode === "user" ? "Zadná" : "Predná"} Kamera
        </button>{" "}
        <button onClick={takePhoto} disabled={!cameraStarted}>
          Odfoť
        </button>
        {photo && (
          <button onClick={uploadPhoto} disabled={uploading} style={{ marginLeft: 10 }}>
            {uploading ? "Nahráva sa fotka..." : "Nahraj fotku"}
          </button>
        )}
      </div>

      {error && <p style={{ color: "red" }}>Error: {error}</p>}

      {uploadResult && <p style={{ color: "green" }}> Fotka sa nahrala </p>}

      {photo ? (
        <div>
          <h2>Captured Photo:</h2>
          <img src={photo} alt="Captured" style={{ maxWidth: "100%", borderRadius: 8 }} />
        </div>
      ) : (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          style={{
            width: "100%",
            maxWidth: 600,
            borderRadius: 8,
            backgroundColor: "#000",
          }}
        />
      )}

      <canvas ref={canvasRef} style={{ display: "none" }} />
    </div>
  );
}
