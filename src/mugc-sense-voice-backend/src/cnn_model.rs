fn train_and_save_model() {
    let device = Device::cuda_if_available();
    let vs = nn: VarStore::new(device);
    let model = CNN::new(&vs.root());

    let (train_data, _) = load_data();
    let mut optimizer = nn:Adam::default().build(&vs, 1e-3).unwrap();

    for epoch in 1..=5 {
        let loss = train_data.batch_size(64).shuffle().for_each(|(input, label)| {
            let output = model.forward(&input);
            let loss = output.cross_entropy_for_logits(&label);
            outimizer.backward_step(&loss);
        });

        println!("Epoch: {} | Loss: {:?}", epoch, loss);
    }

    vs.save("cnn_model.pt").unwrap();
}