import React, { useState, useRef, useEffect } from "react";
import { initializeVosk, startRecognition, stopRecognition } from "./vosk";

const App = () => {
    const [isRecognizing, setIsRecognizing] = useState(false);
    const [recognitionResult, setRecognitionResult] = useState("");
    const [isModelInitialized, setIsModelInitialized] = useState(false);

    const mediaStreamRef = useRef(null);
    const recognizerNodeRef = useRef(null);
    const audioContextRef = useRef(null);
    const recognizerRef = useRef(null);

    const initializeModel = async () => {
        try {
            await initializeVosk("/models/vosk-model-small-en-us-0.15.tar.gz");
            setIsModelInitialized(true);
        } catch (error) {
            console.error("Model initialization failed：", error);
        }
    };

    const handleStart = async () => {
        try {
            if (!isModelInitialized) {
                alert("Please initialize the model first");
                return;
            }

            console.log("Start speech recognition");
            audioContextRef.current = new AudioContext();
            const { recognizer, mediaStream, recognizerNode } = await startRecognition(
                audioContextRef.current,
                setRecognitionResult
            );

            mediaStreamRef.current = mediaStream;
            recognizerNodeRef.current = recognizerNode;
            recognizerRef.current = recognizer;

            setIsRecognizing(true);
        } catch (error) {
            console.error("Failed to start speech recognition：", error);
        }
    };

    const handleStop = () => {
        try {
            console.log("Stop speech recognition...");
            stopRecognition({
                mediaStream: mediaStreamRef.current,
                recognizerNode: recognizerNodeRef.current,
            });

            recognizerRef.current = null;
            audioContextRef.current = null;
            mediaStreamRef.current = null;
            recognizerNodeRef.current = null;

            setIsRecognizing(false);
        } catch (error) {
            console.error("Stopping speech recognition failed：", error);
        }
    };

    useEffect(() => {
        initializeModel();
    }, []);

    return (
        <div style={styles.container}>
            <h1 style={styles.header}>Vosk Speech Recognition</h1>
            <div style={styles.buttonGroup}>
                <button
                    onClick={handleStart}
                    disabled={isRecognizing}
                    style={{ ...styles.button, backgroundColor: isRecognizing ? "#ccc" : "#4CAF50" }}
                >
                    Start Recognition
                </button>
                <button
                    onClick={handleStop}
                    disabled={!isRecognizing}
                    style={{ ...styles.button, backgroundColor: isRecognizing ? "#F44336" : "#ccc" }}
                >
                    Stop Recognition
                </button>
            </div>
            <div style={styles.resultContainer}>
                <h3 style={styles.resultHeader}>Recognition Results:</h3>
                <textarea
                    value={recognitionResult}
                    readOnly
                    style={styles.resultArea}
                />
            </div>
        </div>
    );
};

const styles = {
    container: {
        textAlign: "center",
        marginTop: "50px",
        fontFamily: "'Roboto', sans-serif",
    },
    header: {
        fontSize: "2rem",
        color: "#333",
    },
    buttonGroup: {
        marginTop: "20px",
        display: "flex",
        justifyContent: "center",
        gap: "10px",
    },
    button: {
        padding: "10px 20px",
        fontSize: "16px",
        borderRadius: "5px",
        border: "none",
        color: "white",
        cursor: "pointer",
        transition: "background-color 0.3s",
    },
    resultContainer: {
        marginTop: "30px",
        width: "80%",
        margin: "0 auto",
        textAlign: "left",
    },
    resultHeader: {
        fontSize: "1.2rem",
        marginBottom: "10px",
        color: "#555",
    },
    resultArea: {
        width: "100%",
        height: "200px",
        fontSize: "14px",
        padding: "10px",
        border: "1px solid #ddd",
        borderRadius: "5px",
        backgroundColor: "#f9f9f9",
        resize: "none",
    },
};

export default App;
