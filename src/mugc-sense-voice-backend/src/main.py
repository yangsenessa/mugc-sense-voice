from kybra import update, query
from typing import Optional
import whisper
import os

# 加载模型（建议在 canister 初始化时加载）
try:
    model = whisper.load_model("base")
except Exception as e:
    model = None
    print(f"Failed to load Whisper model: {str(e)}")


@update
def transcribe_audio(audio_data: bytes, file_name: Optional[str] = None) -> str:
    if model is None:
        return "Model is not loaded. Transcription is unavailable."

    # 确保存储路径存在
    resources_path = "./resources"
    os.makedirs(resources_path, exist_ok=True)

    # 使用默认或自定义文件名
    file_name = file_name or "m____ejj.wav"
    audio_path = os.path.join(resources_path, file_name)

    try:
        # 将音频数据保存到文件
        with open(audio_path, "wb") as f:
            f.write(audio_data)

        # 调用 Whisper 模型进行转录
        result = model.transcribe(audio_path)
        return result.get("text", "No transcription result found.")
    except Exception as e:
        return f"Error during transcription: {str(e)}"


@query
def greet(name: str) -> str:
    return f"Hello, {name}!"
