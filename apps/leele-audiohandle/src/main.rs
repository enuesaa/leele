use lambda_runtime::{run, service_fn, tracing, Error};
mod audioinput;
mod audiooutput;
mod handle;

#[tokio::main]
async fn main() -> Result<(), Error> {
    rustls::crypto::ring::default_provider()
        .install_default()
        .expect("failed to install rustls crypto provider");
    tracing::init_default_subscriber();
    run(service_fn(handle::handler)).await?;
    Ok(())
}
