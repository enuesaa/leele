fn main() -> Result<(), Box<dyn std::error::Error>> {
    tonic_build::configure()
        .build_server(false)
        .compile_protos(
            &["proto/google/cloud/speech/v1/cloud_speech.proto"],
            &["proto"],
        )?;
    Ok(())
}
