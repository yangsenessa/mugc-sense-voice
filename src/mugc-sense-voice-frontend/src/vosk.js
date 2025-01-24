import {createModel} from "vosk-browser";

let modelInstance = null;

export async function initializeVosk(modelUrl) {
    try {
        console.log("Initializing Vosk Model...");
        console.log(`Model Path: ${modelUrl}`);
        modelInstance = await createModel(modelUrl);
        console.log("Model Instance: ", modelInstance);
        console.log("Vosk Model load successfully");
    } catch (error) {
        console.error("Initializing Vosk Error: ", error);
        throw error;
    }
}

export async function startRecognition(audioContext, setResult) {
    try {
        if (!modelInstance) {
            throw new Error("Model not loaded...");
        }

        const recognizer = new modelInstance.KaldiRecognizer(16000);
        console.log("Recognizer instance:", recognizer);

        recognizer.on("result", (message) => {
            console.log(`Result: ${message.result.text}`);
            setResult((prev) => `${prev}\n${message.result.text}`);
        });

        recognizer.on("partialresult", (message) => {
            console.log(`Partial result: ${message.result.partial}`);
        });

        recognizer.on("error", (error) => {
            console.error("Error: ", error);
        });

        const mediaStream = await navigator.mediaDevices.getUserMedia({
            // video: false,
            audio: {
                echoCancellation: true,
                noiseSuppression: true,
                channelCount: 1,
                sampleRate: 16000,
            },
        });

        const source = audioContext.createMediaStreamSource(mediaStream);
        const recognizerNode = audioContext.createScriptProcessor(4096, 1, 1);

        recognizerNode.onaudioprocess = (event) => {
            try {
                const audioData = event.inputBuffer.getChannelData(0);
                console.log("Audio data: ", audioData);
                recognizer.acceptWaveform(event.inputBuffer);
            } catch (error) {
                console.error("acceptWaveform failed", error);
            }
        };

        source.connect(recognizerNode);
        recognizerNode.connect(audioContext.destination);

        console.log("Speech recognition activated");
        return {recognizer, mediaStream, recognizerNode};
    } catch (error) {
        console.error("Failed to start speech recognition: ", error);
        throw error;
    }
}

export function stopRecognition({mediaStream, recognizerNode}) {
    try {
        if (recognizerNode) {
            recognizerNode.disconnect();
            recognizerNode.onaudioprocess = null;
        }

        if (mediaStream) {
            mediaStream.getTracks().forEach((track) => track.stop());
        }

        console.log("Speech recognition stopped");
    } catch (error) {
        console.error("Stopping speech recognition failed: ", error);
    }
}
