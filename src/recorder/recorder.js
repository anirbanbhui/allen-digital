import "./recorder.css";
import React, { useState, useRef, useEffect } from "react";

const VideoRecorder = () => {
  const [mediaStream, setMediaStream] = useState(null);
  const [recording, setRecording] = useState(false);
  const [paused, setPaused] = useState(false);
  const [recordedChunks, setRecordedChunks] = useState([]);
  const [recordedTime, setRecordedTime] = useState(0);
  const videoRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const timerRef = useRef(null);
  const [showRecordedVideo, setShowRecordedVideo] = useState(false);

  useEffect(() => {
    startPreview();
    // Cleanup function
    return () => {
      if (mediaStream) {
        mediaStream.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  const startPreview = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });
      setMediaStream(stream);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (error) {
      console.error("Error accessing media devices:", error);
    }
  };

  const startRecording = () => {
    if (mediaStream) {
      const recorder = new MediaRecorder(mediaStream);
      mediaRecorderRef.current = recorder;
      const chunks = [];
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunks.push(event.data);
        }
      };
      recorder.onstop = () => {
        setRecording(false);
        setRecordedChunks(chunks);
        setShowRecordedVideo(true);
      };
      recorder.start();
      setRecording(true);
      startTimer();
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      if (timerRef.current) clearInterval(timerRef.current);
      setRecordedTime(0);
      setRecording(false);
      setShowRecordedVideo(false);
    }
  };

  const pauseRecording = () => {
    if (mediaRecorderRef.current && !paused) {
      mediaRecorderRef.current.pause();
      if (timerRef.current) clearInterval(timerRef.current);
      setPaused(true);
    } else if (mediaRecorderRef.current && paused) {
      mediaRecorderRef.current.resume();
      startTimer();
      setPaused(false);
    }
  };

  const startTimer = () => {
    timerRef.current = setInterval(() => {
      setRecordedTime((prevTime) => prevTime + 1);
    }, 1000);
  };

  const downloadVideo = () => {
    if (recordedChunks.length === 0) {
      return;
    }
    const blob = new Blob(recordedChunks, { type: "video/webm" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "recording.webm";
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const handleStartRecording = () => {
    startRecording();
    setShowRecordedVideo(false)
    if (recordedChunks.length > 0) {
      startPreview();
    }
  };

  return (
    <div>
      <div>
        {mediaStream && !showRecordedVideo && (
          <video ref={videoRef} autoPlay muted />
        )}
        {showRecordedVideo && recordedChunks.length > 0 && (
          <video controls src={URL.createObjectURL(new Blob(recordedChunks, { type: "video/webm" }))} />
        )}
      </div>
      <div>
        {!recording && (
          <button className="start-btn" onClick={handleStartRecording}>Start Recording</button>
        )}
        {recording && (
          <button className="stop-btn" onClick={stopRecording}>Stop Recording</button>
        )}
        {recording && (
          <button className="pause-btn" onClick={pauseRecording}>{paused ? "Resume" : "Pause"}</button>
        )}
        {!recording && showRecordedVideo && (
          <button className="dwn-btn" onClick={downloadVideo}>Download</button>
        )}
        {recording && <div>Recording: {recordedTime} seconds</div>}
      </div>
    </div>
  );
};

export default VideoRecorder;
