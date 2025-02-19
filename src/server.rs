use rocket::fs::{relative, FileServer};
use rocket::{Error as RocketError, Ignite, Rocket};

use crate::api_routes;
use crate::database::Database;
use crate::routes;

pub async fn run() -> Result<Rocket<Ignite>, RocketError> {
    let db = Database::init().await;

    rocket::build()
        .mount("/", routes![routes::index])
        .mount("/api", routes![api_routes::get_budget])
        .mount("/static", FileServer::from(relative!("www/static")))
        .manage(db)
        .launch()
        .await
}
