use candle_core::{Device, Tensor};
use candle_transformers::models::whisper::{Config, Model};
use std::vec::Vec;
use ic_cdk_macros::*;

#[update]
pub fn transcribe(audio_data: Vec<u8>) -> String {
    let device = Device::Cpu;

    let config = Config::default();
    let model = Model::new(&config, device).expect("Can not load Whisper Model");

    let audio_tensor = Tensor::from_vec(audio_data, (1, audio_data.len()), &device)
        .expect("Can not transfer audio data");

    match model.generate(&audio_tensor) {
        Ok(transcription) => transcription,
        Err(_) => "Whisper Speech recognition failed".to_string(),
    }
}
