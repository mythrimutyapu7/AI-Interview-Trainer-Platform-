import { useState, useRef, useEffect } from "react";

// Get API URL from environment or fallback to localhost
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export default function StartInterview() {
  const [role, setRole] = useState("");
  const [difficulty, setDifficulty] = useState("");
  const [allowAccess, setAllowAccess] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [recorder, setRecorder] = useState(null);
  const [stream, setStream] = useState(null);
  const [isRecordingMode, setIsRecordingMode] = useState(false);
  const [timer, setTimer] = useState(0);

  const videoRef = useRef(null);
  const overlayRef = useRef(null);
  const timerRef = useRef(null);
  const isReady = role && difficulty && allowAccess && agreeTerms;

  // Attach stream to video and ensure it plays
  useEffect(() => {
    if (videoRef.current && stream) {
      try {
        videoRef.current.srcObject = stream;
        // play() returns a promise; catch to avoid unhandled rejections
        videoRef.current.play().catch((err) => {
          console.error("Error playing video:", err);
        });
      } catch (err) {
        console.error("Failed to attach stream to video:", err);
      }
    }
  }, [stream]);

  // Timer while recording
  useEffect(() => {
    if (recorder) {
      timerRef.current = setInterval(() => setTimer((t) => t + 1), 1000);
    } else {
      clearInterval(timerRef.current);
      timerRef.current = null;
      setTimer(0);
    }
    return () => clearInterval(timerRef.current);
  }, [recorder]);

  // Try to enter fullscreen and prevent body scroll when recording mode starts
  useEffect(() => {
    if (isRecordingMode) {
      // hide page scroll
      document.body.style.overflow = "hidden";
      // try to request fullscreen on overlay (may fail if not allowed)
      const el = overlayRef.current || document.documentElement;
      if (el && el.requestFullscreen) {
        el.requestFullscreen().catch(() => {
          /* ignore fullscreen failures (not critical) */
        });
      }
    } else {
      document.body.style.overflow = "";
      // Try to exit fullscreen if active
      if (document.fullscreenElement) {
        document.exitFullscreen().catch(() => {});
      }
    }

    // cleanup on unmount
    return () => {
      document.body.style.overflow = "";
    };
  }, [isRecordingMode]);

  const startRecording = async () => {
    if (!isReady) return;

    try {
      // get media
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: true,
      });

      setStream(mediaStream);
      // open the overlay (try to go fullscreen)
      setIsRecordingMode(true);

      // It's OK if requestFullscreen fails — handled in useEffect — but we can
      // also attempt it here while still in the user gesture.
      try {
        const el = overlayRef.current || document.documentElement;
        if (el && el.requestFullscreen) {
          await el.requestFullscreen();
        }
      } catch (err) {
        // ignore fullscreen errors
        console.warn("Fullscreen request failed:", err);
      }

      const mediaRecorder = new MediaRecorder(mediaStream, { mimeType: "video/webm" });
      let chunks = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) chunks.push(e.data);
      };

      mediaRecorder.onstop = async () => {
        try {
          const blob = new Blob(chunks, { type: "video/webm" });
          const formData = new FormData();
          formData.append("file", blob, "interview.webm");
          formData.append("role", role);
          formData.append("difficulty", difficulty);

          // upload
          await fetch(`${API_BASE_URL}/api/recordings`, {
            method: "POST",
            body: formData,
          });
        } catch (uploadErr) {
          console.error("Upload error:", uploadErr);
          alert("Upload failed. See console for details.");
        } finally {
          // cleanup streams/tracks
          chunks = [];
          try {
            mediaStream.getTracks().forEach((t) => t.stop());
          } catch (err) {
            console.warn("Error stopping tracks:", err);
          }
          setStream(null);
          setIsRecordingMode(false);
          alert("Recording uploaded successfully!");
        }
      };

      mediaRecorder.start();
      setRecorder(mediaRecorder);
    } catch (err) {
      console.error("Error starting recording:", err);
      alert("Could not access camera/microphone. Please check permissions.");
    }
  };

  const stopRecording = () => {
    if (recorder) {
      // stopping triggers onstop handler where cleanup + upload happen
      recorder.stop();
      setRecorder(null);
    } else {
      // fallback: stop tracks if anything left
      if (stream) {
        stream.getTracks().forEach((t) => t.stop());
        setStream(null);
        setIsRecordingMode(false);
      }
    }
  };

  // mm:ss
  const formatTime = (t) => {
    const mm = String(Math.floor(t / 60)).padStart(2, "0");
    const ss = String(t % 60).padStart(2, "0");
    return `${mm}:${ss}`;
  };

  return (
    <>
      {/* Main page (hidden when recording mode on, but kept for a11y) */}
      <main className="max-w-3xl mx-auto p-6 space-y-6 font-sans" aria-hidden={isRecordingMode}>
        {!isRecordingMode && (
          <>
            <h1 className="text-3xl font-bold text-center">Take The Interview</h1>

            {/* Role */}
            <div className="bg-gray-100 border border-gray-300 rounded-lg p-4">
              <label className="block font-semibold mb-2">Select Role</label>
              <select
                className="w-full p-2 rounded border border-gray-400"
                value={role}
                onChange={(e) => setRole(e.target.value)}
              >
                <option value="">Select</option>
                <option value="frontend">Frontend Developer</option>
                <option value="backend">Backend Developer</option>
                <option value="fullstack">Full Stack Engineer</option>
                <option value="data-scientist">Data Scientist</option>
              </select>
            </div>

            {/* Difficulty */}
            <div className="bg-gray-100 border border-gray-300 rounded-lg p-4">
              <label className="block font-semibold mb-2">Select Difficulty</label>
              <select
                className="w-full p-2 rounded border border-gray-400"
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value)}
              >
                <option value="">Select</option>
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
            </div>

            {/* Checkboxes */}
            <div className="bg-gray-100 border border-gray-300 rounded-lg p-4 space-y-2">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={allowAccess}
                  onChange={(e) => setAllowAccess(e.target.checked)}
                />
                Allow Camera & Microphone
              </label>

              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={agreeTerms}
                  onChange={(e) => setAgreeTerms(e.target.checked)}
                />
                I Agree to Terms & Conditions
              </label>
            </div>

            {/* Start Button */}
            <div className="flex justify-center gap-4">
              <button
                disabled={!isReady}
                onClick={startRecording}
                className={`px-4 py-2 font-semibold rounded text-white ${
                  !isReady ? "bg-gray-400 cursor-not-allowed" : "bg-indigo-600 hover:bg-indigo-700"
                }`}
              >
                Start Interview
              </button>
            </div>
          </>
        )}
      </main>

      {/* Full-screen overlay for recording */}
      {isRecordingMode && (
        <div
          ref={overlayRef}
          className="fixed inset-0 bg-black flex items-center justify-center"
          style={{
            zIndex: 99999, // extremely high to cover headers/footers
          }}
          role="dialog"
          aria-modal="true"
        >
          {/* video fills overlay */}
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover"
            style={{ backgroundColor: "black" }}
          />

          {/* Top-left timer */}
          <div
            className="absolute top-4 left-4 text-white text-lg font-bold"
            style={{ zIndex: 100000 }}
          >
            {formatTime(timer)}
          </div>

          {/* Top-right small exit (in case) */}
          <button
            onClick={() => {
              // allow quick exit if they accidentally opened the mode
              if (!recorder) {
                setIsRecordingMode(false);
                setStream((s) => {
                  if (s) s.getTracks().forEach((t) => t.stop());
                  return null;
                });
              }
            }}
            className="absolute top-4 right-4 px-3 py-1 bg-gray-800/60 text-white rounded"
            style={{ zIndex: 100000 }}
            aria-hidden={false}
          >
            Close
          </button>

          {/* End recording button */}
          <button
            onClick={stopRecording}
            className="absolute bottom-8 px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-semibold rounded"
            style={{ zIndex: 100000 }}
          >
            End Interview
          </button>
        </div>
      )}
    </>
  );
}
