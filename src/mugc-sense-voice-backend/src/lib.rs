use ic_cdk_macros::update;
use ndarray::{Array2, Array};
use ndarray_rand::RandomExt;
use rand::distributions::Distribution;
// Import RandomExt for `random()`
use rand::thread_rng; // Import thread_rng() to generate random numbers
use rand_distr::Uniform;

pub struct CnnModel {
    weights: Array2<f32>,
    bias: Array2<f32>,
}

impl CnnModel {
    pub fn new(input_dim: usize, output_dim: usize) -> CnnModel {
        let mut rng = thread_rng();
        let uniform = Uniform::new(0.0, 1.0);
        let weights = Array2::from_shape_fn((input_dim, output_dim), |_| uniform.sample(&mut rng));
        let bias = Array2::zeros((output_dim, 1));

        CnnModel { weights, bias }
    }

    pub fn train(&mut self, input: Vec<f32>, labels: Vec<f32>, epochs: usize) -> String {
        let input = Array2::from_shape_vec((input.len() / 784, 784), input).unwrap();
        let labels = Array2::from_shape_vec((labels.len(), 1), labels).unwrap();

        for _ in 0..epochs {
            // Perform forward pass and simple gradient descent
            let output = input.dot(&self.weights) + &self.bias;
            let error = &output - &labels;
            self.weights -= &(input.t().dot(&error) * 0.01); // Update weights
            self.bias -= &(error.sum_axis(ndarray::Axis(0)) * 0.01); // Update bias
        }
        "Training complete".to_string()
    }

    pub fn predict(&self, input: Vec<f32>) -> Vec<f32> {
        let input = Array2::from_shape_vec((input.len() / 784, 784), input).unwrap();
        let output = input.dot(&self.weights) + &self.bias;
        output.into_raw_vec() // Convert the output to a vector for returning
    }
}

#[update]
fn train(input: Vec<f32>, labels: Vec<f32>, epochs: usize) -> String {
    let mut model = CnnModel::new(784, 10); // Example: 28x28 images, 10 classes
    model.train(input, labels, epochs)
}

#[update]
fn predict(input: Vec<f32>) -> Vec<f32> {
    let model = CnnModel::new(784, 10); // Use the same model structure
    model.predict(input)
}


#[ic_cdk::query]
fn greet(name: String) -> String {
    format!("Hello, {}!", name)
}
