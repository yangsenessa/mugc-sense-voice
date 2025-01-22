import { createModel } from "vosk-browser";

let modelInstance = null;

export async function initializeVosk(modelUrl) {
    try {
        console.log("初始化 Vosk 模型...");
        console.log(`模型路径: ${modelUrl}`);
        modelInstance = await createModel(modelUrl);
        console.log("模型实例: ", modelInstance);
        console.log("Vosk 模型加载成功");
    } catch (error) {
        console.error("初始化 Vosk 或加载模型时出错: ", error);
        throw error;
    }
}

export async function startRecognition(audioContext, setResult) {
    try {
        if (!modelInstance) {
            throw new Error("模型尚未加载");
        }

        // 使用 KaldiRecognizer 创建识别器
        const recognizer = new modelInstance.KaldiRecognizer();

        // 处理识别结果事件
        recognizer.on("result", (message) => {
            setResult((prev) => `${prev}\n${message.result.text}`);
        });

        recognizer.on("partialresult", (message) => {
            console.log(`Partial result: ${message.result.partial}`);
        });

        // 请求用户媒体流
        const mediaStream = await navigator.mediaDevices.getUserMedia({
            video: false,
            audio: {
                echoCancellation: true,
                noiseSuppression: true,
                channelCount: 1,
                sampleRate: 16000, // 确保采样率与模型一致
            },
        });

        // 设置音频流处理
        const recognizerNode = audioContext.createScriptProcessor(4096, 1, 1);
        recognizerNode.onaudioprocess = (event) => {
            try {
                recognizer.acceptWaveform(event.inputBuffer);
            } catch (error) {
                console.error("acceptWaveform failed", error);
            }
        };

        // 连接音频源和处理器
        const source = audioContext.createMediaStreamSource(mediaStream);
        source.connect(recognizerNode);

        return { recognizer, mediaStream, recognizerNode };
    } catch (error) {
        console.error("启动语音识别失败: ", error);
        throw error;
    }
}

export function stopRecognition({ mediaStream, recognizerNode }) {
    try {
        if (mediaStream && recognizerNode) {
            recognizerNode.disconnect();
            mediaStream.getTracks().forEach((track) => track.stop());
            console.log("语音识别已停止");
        }
    } catch (error) {
        console.error("停止语音识别失败: ", error);
    }
}
