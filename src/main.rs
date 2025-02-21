#[macro_use]
extern crate rocket;
use rocket::fs::{relative, FileServer};
use rocket::{Error as RocketError, Ignite, Rocket};

mod account;
mod api_routes;
mod budget;
mod database;
mod database_enum;
mod datetime;
mod expense;
mod record_mapping;
mod routes;
mod statement_import;
mod statement_import_config;

use crate::database::Database;

async fn run() -> Result<Rocket<Ignite>, RocketError> {
    let db = Database::init().await;

    rocket::build()
        .mount(
            "/",
            routes![routes::index, routes::favicon, routes::default],
        )
        .mount(
            "/api",
            routes![
                api_routes::get_budget,
                api_routes::get_accounts,
                api_routes::get_expenses,
            ],
        )
        .mount("/static", FileServer::from(relative!("www/static")))
        .manage(db)
        .launch()
        .await
}

#[rocket::main]
async fn main() {
    match run().await {
        Ok(_) => {}
        Err(e) => {
            println!("{:?}", e);
            return;
        }
    }
}
