#[macro_use]
extern crate rocket;
use rocket::fs::{relative, FileServer};
use rocket::{Error as RocketError, Ignite, Rocket};

use clap::{Parser, Subcommand};

mod credentials;
mod crypto;
mod database;
mod datetime;
mod error;
mod guards;
mod import;
mod passwords;
mod routes;
mod schema;

use crate::crypto::init_crypto;
use crate::database::Database;
use crate::passwords::Command as PasswordsCommand;
use crate::routes::fairings::{GateKeeper, RouteMatcher};

#[derive(Parser)]
#[command(about)]
struct Args {
    #[command(subcommand)]
    command: Command,
}

#[derive(Subcommand)]
enum Command {
    /// Manage users and passwords
    Passwords {
        #[command(subcommand)]
        command: PasswordsCommand,
    },

    /// Starts the server
    Server,
}

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
                routes::index::js,
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
                routes::api::budget::clone_budget,
                routes::api::budget::get_spending,
                routes::api::budget_category::create_budget_category,
                routes::api::budget_category::update_budget_category,
                routes::api::budget_category::delete_budget_category,
                routes::api::budget_item::create_budget_item,
                routes::api::budget_item::update_budget_item,
                routes::api::budget_item::delete_budget_item,
                routes::api::expense::import_expenses,
                routes::api::expense::delete_expenses,
                routes::api::expense::create_expense,
                routes::api::expense::delete_expense,
                routes::api::expense::update_expense_category,
                routes::api::expense::update_expense_notes,
                routes::api::expense::query_expenses,
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
async fn main() -> () {
    if init_crypto().is_err() {
        println!("Error initializing crypto, aborting");
        return;
    }

    let args = Args::parse();
    match args.command {
        Command::Passwords { command } => {
            let database = Database::init().await;
            passwords::manage_passwords(database, command).await;
        }
        Command::Server => {
            let _ = run().await;
        }
    };
}
