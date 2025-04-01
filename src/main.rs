#[macro_use]
extern crate rocket;
use rocket::fs::{relative, FileServer};
use rocket::{Error as RocketError, Ignite, Rocket};

mod account;
mod budget;
mod credentials;
mod crypto;
mod database;
mod database_enum;
mod datetime;
mod error;
mod expense;
mod import;
mod record_mapping;
mod routes;
mod schema_test;
mod spending;
mod statement_schema;
mod write_log;

use crate::crypto::init_crypto;
use crate::database::Database;
use crate::routes::fairings::{GateKeeper, RouteMatcher};

async fn run() -> Result<Rocket<Ignite>, RocketError> {
    let db = Database::init().await;
    let gk = GateKeeper {
        allow_logged_out_access: vec![
            RouteMatcher::Exact("/"),
            RouteMatcher::Exact("/login"),
            RouteMatcher::Prefix("/static"),
        ],
    };

    rocket::build()
        .mount(
            "/",
            routes![
                routes::index::index_logged_in,
                routes::index::index_logged_out,
                routes::login::login,
                routes::login::logout,
            ],
        )
        .mount(
            "/api",
            routes![
                routes::api::account::get_accounts,
                routes::api::account::add_account,
                routes::api::account::update_account,
                routes::api::account::delete_account,
                routes::api::budget::get_budget,
                routes::api::budget::get_spending,
                routes::api::budget_category::add_budget_category,
                routes::api::budget_category::update_budget_category,
                routes::api::budget_category::delete_budget_category,
                routes::api::budget_item::add_budget_item,
                routes::api::budget_item::update_budget_item,
                routes::api::budget_item::delete_budget_item,
                routes::api::expense::get_expenses,
                routes::api::expense::import_expenses,
                routes::api::expense::update_expense,
                routes::api::statement_schema::get_schemas,
                routes::api::statement_schema::add_schema,
                routes::api::statement_schema::update_schema,
                routes::api::statement_schema::delete_schema,
                routes::api::statement_schema::test_schema,
            ],
        )
        .mount("/static", FileServer::from(relative!("www/static")))
        .manage(db)
        .attach(gk)
        .launch()
        .await
}

#[rocket::main]
async fn main() {
    if init_crypto().is_err() {
        println!("Error initializing crypto, aborting");
        return;
    }

    match run().await {
        Ok(_) => {}
        Err(e) => {
            println!("{:?}", e);
            return;
        }
    }
}
