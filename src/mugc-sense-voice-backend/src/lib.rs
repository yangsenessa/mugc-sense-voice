extern crate core;

use core::panicking::panic;
use ic_cdk::export::candid::{CandidType, Deserialize};
use ic_cdk_macros::*;
use tch::{nn, nn::Module, Device, Tensor};
use std::sync::Mutex;
use std::fs::File;
use std::io::Read;
use ic_cdk::{init, update};
use image::codecs::png::CompressionType::Default;

static MODEL: once_cell::sync::Lazy<Mutex<Option<nn::VarStore>>> = once_cell::sync::Lazy::new(|| Mutex::new(None));

#[derive(CandidType, Deserialize)]
struct ImageInput {
    image_data: Vec<u8>,
}

#[derive(CanididType, Deserialize)]
struct PredictionResult {
    label: String,
    confidence: f64,
}

// keep same with the trained CNN model
#[derive(Debug)]
struct CNN {
    conv1: nn::Conv2D,
    conv2: nn::Conv2D,
    fc1: nn::Linear,
    fc2: nn::Linear,
}

impl CNN {
    fn new(vs: &nn::Path) -> Self {
        CNN {
            conv1: nn::conv2d(vs, 3, 32, 5, Default::default()),
            conv2: nn::conv2d(vs, 32, 64, 5, Default::default()),
            fc1: nn::Linear(vs, 64 * 5 * 5, 128, Default::default()),
            fc2: nn::Linear(vs, 128, 10, Default::default()),
        }
    }
}

impl nn::Module for CNN {
    fn forward(&self, xs: &Tensor) -> Tensor {
        xs.view([-1, 3, 32, 32])
            .apply(&self.conv1)
            .relu()
            .max_pool2d_default(2)
            .apply(&self.conv2)
            .relu()
            .max_pool2d_default(2)
            .view([-1, 64 * 5 * 5])
            .apply(&self.fc1)
            .relu()
            .apply(&self.fc2)
    }
}

#[init]
fn init_model() {
    let device = Device::cuda_if_available();
    let vs = nn::VarStore::new(device);
    let model = CNN::new(&vs.root());

    let mut file = File::open("cnn_model.pt").expect("cnn_model.pt does not exist");
    let mut buffer = Vec::new();
    file.read_to_end(&mut buffer).expect("can't access cnn_model.pt file");
    vs.load_from_buffer(&buffer).expect("load cnn_model.pt failed");
    *MODEL.lock().unwrap() = Some(vs);
}

#[update]
fn classify_image(input: ImageInput) -> PredictionResult {
    let img_tensor = Tensor::of_slice(&input.image_data)
        .view([1, 3, 32, 32])
        .to_device(Device::Cpu)
        .to_kind(tch::Kind::Float) / 255.0;

    let model_guard = MODEL.lock().unwrap();
    if let Some(ref vs) = *model_guard {
        let model = CNN::new(&vs.root());
        let output = model.forward(&img_tensor);

        let predicted_index = output.argmax(-1, false).int64_value(&[]);
        let labels = ["cat", "dog", "bird", "car", "plane", "frog", "deer", "horse", "ship", "truck"];
        let label = labels[predicted_index as usize].to_string();

        PredictionResult {
            label,
            confidence: output.softmax(-1, tch::Kind::Float).max().double_value(&[]),
        }
    } else {
        panic!("load CNN model first");
    }
}

#[ic_cdk::query]
fn greet(name: String) -> String {
    format!("Hello, {}!", name)
}
