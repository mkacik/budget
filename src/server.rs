use rocket::fs::{relative, FileServer};
use rocket::{Error as RocketError, Ignite, Rocket};

use crate::routes;

pub async fn run() -> Result<Rocket<Ignite>, RocketError> {
    rocket::build()
        .mount("/", routes![routes::index])
        .mount("/static", FileServer::from(relative!("www/static")))
        .launch()
        .await
}
