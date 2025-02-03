mod whisper;
use ic_cdk_macros::*;

fn recognize_speech(audio_data: Vec<u8>) -> String {
    match whisper::transcribe(audio_data) {
        Ok(text) => text,
        Err(err) => format!("Error: {}", err),
    }
}


#[ic_cdk::query]
fn greet(name: String) -> String {
    format!("Hello, {}!", name)
}
