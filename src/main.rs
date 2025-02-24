#[macro_use]
extern crate rocket;
use rocket::fs::{relative, FileServer};
use rocket::{Error as RocketError, Ignite, Rocket};

mod account;
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
            routes![
                routes::base::index,
                routes::base::favicon,
                routes::base::default
            ],
        )
        .mount(
            "/api",
            routes![
                routes::api::get_accounts,
                routes::api::add_account,
                routes::api::update_account,
                routes::api::delete_account,
                routes::api::get_budget,
                routes::api::get_expenses,
                routes::api::import_expenses,
                routes::api::update_expense,
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
