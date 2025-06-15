// src/components/emotion-analysis/Camera.tsx
import React, { useRef, useEffect } from "react";

interface CameraProps {
  onCapture: (blob: Blob) => void;
  onError: (error: string) => void;
}

export const CameraCap: React.FC<CameraProps> = ({ onCapture, onError }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    startCamera();
    return () => stopCamera();
  }, []);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user" },
        audio: false,
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        setTimeout(captureImage, 3000);
      }
    } catch (err) {
      onError(
        "Failed to access camera. Please ensure camera permissions are granted."
      );
    }
  };

  const stopCamera = () => {
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((track) => track.stop());
    }
  };

  const captureImage = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const context = canvasRef.current.getContext("2d");
    if (!context) return;

    canvasRef.current.width = videoRef.current.videoWidth;
    canvasRef.current.height = videoRef.current.videoHeight;
    context.drawImage(videoRef.current, 0, 0);

    canvasRef.current.toBlob((blob) => {
      if (blob) onCapture(blob);
    }, "image/jpeg");

    stopCamera();
  };

  return (
    <div className="hidden">
      <video ref={videoRef} playsInline muted />
      <canvas ref={canvasRef} />
    </div>
  );
};
