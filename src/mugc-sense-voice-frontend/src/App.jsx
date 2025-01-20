import React, { useState, useRef } from "react";
import { initializeVosk, startRecognition, stopRecognition } from "./vosk";

const App = () => {
    const [isRecording, setIsRecording] = useState(false);
    const [result, setResult] = useState("");
    const recognizerSession = useRef(null);
    const audioContextRef = useRef(null);

    const handleStart = async () => {
        try {
            const model = await initializeVosk();
            if (!audioContextRef.current) {
                audioContextRef.current = new AudioContext();
            }
            recognizerSession.current = await startRecognition(audioContextRef.current, setResult);
            setIsRecording(true);
        } catch (error) {
            console.error("启动语音识别失败: ", error);
        }
    };

    const handleStop = () => {
        try {
            if (recognizerSession.current) {
                stopRecognition(recognizerSession.current);
                recognizerSession.current = null;
            }
            if (audioContextRef.current) {
                audioContextRef.current.close();
                audioContextRef.current = null;
            }
            setIsRecording(false);
        } catch (error) {
            console.error("停止语音识别失败: ", error);
        }
    };

    return (
        <div className="app">
            <h1>Vosk Speech Recognition</h1>
            <button onClick={handleStart} disabled={isRecording}>
                Start Recognition
            </button>
            <button onClick={handleStop} disabled={!isRecording}>
                Stop Recognition
            </button>
            <pre>{result}</pre>
        </div>
    );
};

export default App;
