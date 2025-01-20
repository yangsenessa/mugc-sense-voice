import { createModel } from "vosk-browser";

let modelInstance = null;

export async function initializeVosk(modelUrl) {
    try {
        console.log("初始化 Vosk 模型...");
        modelInstance = await createModel(modelUrl);
        console.log(modelInstance);
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

        const recognizer = await modelInstance.createRecognizer(16000); // 假设 createRecognizer 是方法
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const source = audioContext.createMediaStreamSource(stream);
        const processor = audioContext.createScriptProcessor(4096, 1, 1);

        source.connect(processor);
        processor.connect(audioContext.destination);

        processor.onaudioprocess = async (event) => {
            const audioData = event.inputBuffer.getChannelData(0);
            const result = await recognizer.acceptWaveform(audioData);
            if (result.text) {
                setResult((prev) => `${prev}\n${result.text}`);
            }
        };

        return { recognizer, stream, processor };
    } catch (error) {
        console.error("启动语音识别失败: ", error);
        throw error;
    }
}

export function stopRecognition({ stream, processor }) {
    try {
        processor.disconnect();
        stream.getTracks().forEach((track) => track.stop());
        console.log("语音识别已停止");
    } catch (error) {
        console.error("停止语音识别失败: ", error);
    }
}
