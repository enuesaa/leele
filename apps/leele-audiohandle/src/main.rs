use lambda_runtime::{run, service_fn, tracing, Error};
mod audioinput;
mod audioinputs;
mod audiooutput;
mod handle;

#[tokio::main]
async fn main() -> Result<(), Error> {
    tracing::init_default_subscriber();
    run(service_fn(handle::handler)).await?;
    Ok(())
}
