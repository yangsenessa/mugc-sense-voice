use tch::{nn, nn::Module, nn::OptimizerConfig, Device, Tensor};

#[derive(Debug)]
pub struct CNN {
    conv1: nn::Conv2D,
    conv2: nn::Conv2D,
    fc1: nn::Linear,
    fc2: nn::Linear,
}

impl CNN {
    pub fn new(vs: &nn::Path) -> Self {
        CNN {
            conv1: nn::conv2d(vs, 3, 32, 5, Default::default()),
            conv2: nn::conv2d(vs, 32, 64, 5, Default::default()),
            fc1: nn::linear(vs, 64 * 5 * 5, 128, Default::default()),
            fc2: nn::linear(vs, 128, 10, Default::default()),
        }
    }

    pub fn forward(&self, xs: &Tensor) -> Tensor {
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

pub fn train_and_save_model() {
    let device = Device::cuda_if_available();
    let vs = nn::VarStore::new(device);
    let model = CNN::new(&vs.root());

    let mut optimizer = nn::Adam::default().build(&vs, 1e-3).unwrap();

    for epoch in 1..=5 {
        let input = Tensor::randn(&[64, 3, 32, 32], (tch::Kind::Float, device));
        let label = Tensor::randint(10, &[64], (tch::Kind::Int64, device));

        let output = model.forward(&input);
        let loss = output.cross_entropy_for_logits(&label);
        optimizer.backward_step(&loss);

        println!("Epoch: {} | Loss: {:?}", epoch, loss.double_value(&[]));
    }

    vs.save("cnn_model.pt").unwrap();
    println!("Model saved as cnn_model.pt");
}
