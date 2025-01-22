import React, { useState } from "react";
import { initializeVosk, startRecognition, stopRecognition } from "./vosk";

const App = () => {
    const [recognizer, setRecognizer] = useState(null);

    const handleStart = async () => {
        try {
            const model = await initializeVosk("/models/vosk-model-small-en-us-0.15.tar.gz");
            const rec = startRecognition(model);
            setRecognizer(rec);
            console.log("语音识别器已启动");
        } catch (error) {
            console.error("启动语音识别失败: ", error);
        }
    };

    const handleStop = () => {
        stopRecognition(recognizer);
        setRecognizer(null);
    };

    return (
        <div>
            <h1>Vosk Speech Recognition</h1>
            <button onClick={handleStart}>Start Recognition</button>
            <button onClick={handleStop} disabled={!recognizer}>
                Stop Recognition
            </button>
        </div>
    );
};

export default App;
