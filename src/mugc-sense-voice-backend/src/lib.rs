use ic_cdk_macros::update;
use candid::Nat;
use num_traits::ToPrimitive;
use ndarray::{Array2, Array};
use ndarray_rand::RandomExt;
use rand::distributions::Distribution;
use rand::thread_rng;
use rand_distr::Uniform;
use rand::SeedableRng;
use rand::rngs::StdRng;

use core::result::Result;
use core::num::NonZeroU32;
use getrandom::{register_custom_getrandom, Error};
use rand_distr::weighted_alias::AliasableWeight;

const MY_CUSTOM_ERROR_CODE: u32 = Error::CUSTOM_START + 42;
pub fn always_fail(_buf: &mut [u8]) -> Result<(), Error> {
    let code = NonZeroU32::new(MY_CUSTOM_ERROR_CODE).unwrap();
    Err(Error::from(code))
}
register_custom_getrandom!(always_fail);

pub struct CnnModel {
    weights: Array2<f32>,
    bias: Array2<f32>,
}

impl CnnModel {
    pub fn new(input_dim: usize, output_dim: usize) -> CnnModel {
        let mut rng = StdRng::from_seed([0; 32]);
        let uniform = Uniform::new(0.0, 1.0);
        let weights = Array2::from_shape_fn((input_dim, output_dim), |_| uniform.sample(&mut rng));
        let bias = Array2::zeros((1, output_dim));

        CnnModel { weights, bias }
    }

    pub fn train(&mut self, input: Vec<f32>, labels: Vec<f32>, epochs: Nat) -> String {
        let batch_size = input.len() / 784;
        let input = match Array2::from_shape_vec((batch_size, 784), input) {
            Ok(arr) => arr,
            Err(_) => return "Error: Invalid input shape.".to_string(),
        };

        let labels = match Array2::from_shape_vec((batch_size, 10), labels) {
            Ok(arr) => arr,
            Err(_) => return "Error: Invalid label shape.".to_string(),
        };

        let epochs_usize: usize = match epochs.0.to_u64() {
            Some(value) if value <= usize::MAX as u64 => value as usize,
            _ => return "Error: Epochs value too large.".to_string(),
        };

        for _ in 0..epochs_usize {
            let output = input.dot(&self.weights) + &self.bias;
            let error = &output - &labels;
            self.weights -= &(input.t().dot(&error) * 0.01);
            self.bias -= &(error.sum_axis(ndarray::Axis(0)) * 0.01);
        }

        "Training complete".to_string()
    }

    pub fn predict(&self, input: Vec<f32>) -> Vec<f32> {
        let input = match Array2::from_shape_vec((input.len() / 784, 784), input) {
            Ok(arr) => arr,
            Err(_) => return vec![],
        };

        let output = input.dot(&self.weights) + &self.bias;
        output.into_raw_vec()
    }
}

#[update]
fn train(input: Vec<f32>, labels: Vec<f32>, epochs: Nat) -> String {
    let mut model = CnnModel::new(784, 10);
    model.train(input, labels, epochs)
}

#[update]
fn predict(input: Vec<f32>) -> Vec<f32> {
    let model = CnnModel::new(784, 10);
    model.predict(input)
}
