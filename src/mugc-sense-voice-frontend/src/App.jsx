import React, { useState } from "react";
import { initializeVosk, startRecognition, stopRecognition } from "./vosk";

const App = () => {
    const [recognitionStarted, setRecognitionStarted] = useState(false);
    const [recognitionResult, setRecognitionResult] = useState("");
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const [recognitionSession, setRecognitionSession] = useState(null);

    const initializeModel = async () => {
        try {
            await initializeVosk("/models/vosk-model-small-en-us-0.15.tar.gz");
            console.log("Vosk 模型初始化成功！");
        } catch (error) {
            console.error("模型初始化失败：", error);
        }
    };

    const handleStart = async () => {
        try {
            if (!recognitionStarted) {
                const session = await startRecognition(audioContext, setRecognitionResult);
                setRecognitionSession(session);
                setRecognitionStarted(true);
                console.log("语音识别已启动");
            }
        } catch (error) {
            console.error("启动语音识别失败：", error);
        }
    };

    const handleStop = () => {
        try {
            if (recognitionStarted && recognitionSession) {
                stopRecognition(recognitionSession);
                setRecognitionSession(null);
                setRecognitionStarted(false);
                console.log("语音识别已停止");
            }
        } catch (error) {
            console.error("停止语音识别失败：", error);
        }
    };

    React.useEffect(() => {
        initializeModel();
    }, []);

    return (
        <div style={{ textAlign: "center", marginTop: "50px" }}>
            <h1>Vosk Speech Recognition</h1>
            <button
                onClick={handleStart}
                disabled={recognitionStarted}
                style={{ margin: "5px", padding: "10px", fontSize: "16px" }}
            >
                Start Recognition
            </button>
            <button
                onClick={handleStop}
                disabled={!recognitionStarted}
                style={{ margin: "5px", padding: "10px", fontSize: "16px" }}
            >
                Stop Recognition
            </button>
            <div style={{ marginTop: "20px", textAlign: "left", width: "80%", margin: "0 auto" }}>
                <h3>Recognition Results:</h3>
                <textarea
                    value={recognitionResult}
                    readOnly
                    style={{ width: "100%", height: "200px", fontSize: "14px" }}
                />
            </div>
        </div>
    );
};

export default App;
