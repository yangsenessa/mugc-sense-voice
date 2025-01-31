use ic_cdk_macros::*;
use tch::{nn, nn::Module, Device, Tensor};
use std::fs::File;
use std::io::Read;

static MODEL_PATH: &str = "../models/cnn_model.pt";

#[init]
fn init_model() {
    let device = Device::Cpu;
    let mut vs = nn::VarStore::new(device);

    let mut file = File::open(MODEL_PATH).expect("model file does not exist");
    let mut buffer = Vec::new();
    file.read_to_end(&mut buffer).expect("can not read model file");
    vs.load_from_stream(&buffer).expect("load model fail");

    println!("load CNN Model successfully");
}

#[update]
fn classify_image(image_data: Vec<u8>) -> String {
    let device = Device::Cpu;
    let vs = nn::VarStore::new(device);
    let model = CNN::new(&vs.root());

    let input_tensor = Tensor::of_slice(&image_data).view([1, 3, 32, 32]).to_kind(tch::Kind::Float) / 255.0;
    let output = model.forward(&input_tensor);
    let predicted_index = output.argmax(-1, false).int64_value(&[]);
    let labels = ["cat", "dog", "bird", "car", "plane", "frog", "deer", "horse", "ship", "truck"];
    labels[predicted_index as usize].to_string();
}

#[ic_cdk::query]
fn greet(name: String) -> String {
    format!("Hello, {}!", name)
}
