#[macro_use]
extern crate rocket;
use rocket::fs::{relative, FileServer};
use rocket::{Error as RocketError, Ignite, Rocket};

use clap::{Parser, Subcommand};

mod credentials;
mod crypto;
mod database;
mod fairings;
mod genjs;
mod guards;
mod import;
mod migration;
mod passwords;
mod routes;
mod schema;

use crate::crypto::init_crypto;
use crate::database::Database;
use crate::fairings::gatekeeper::GateKeeper;
use crate::fairings::logger::WriteLogger;
use crate::passwords::Command as PasswordsCommand;

#[derive(Parser)]
#[command(about)]
struct Args {
    #[command(subcommand)]
    command: Command,
}

#[derive(Subcommand)]
enum Command {
    /// Generate TypeScript bindings for structs annottated with TS macros
    Genjs,

    /// Manage users and passwords
    Passwords {
        #[command(subcommand)]
        command: PasswordsCommand,
    },

    /// Starts the server
    Server,

    /// Perform data migration
    Migration,
}

async fn run() -> Result<Rocket<Ignite>, RocketError> {
    let db = Database::init().await;

    rocket::build()
        .mount(
            "/",
            routes![routes::index::index, routes::index::not_found,],
        )
        .mount(
            "/api",
            routes![
                routes::api::account::get_accounts,
                routes::api::account::create_account,
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
                routes::api::expense::delete_expenses,
                routes::api::expense::create_expense,
                routes::api::expense::delete_expense,
                routes::api::expense::update_expense_category,
                routes::api::expense::update_expense_notes,
                routes::api::expense::query_expenses,
                routes::api::fund::get_funds,
                routes::api::fund::get_items,
                routes::api::fund::create_fund,
                routes::api::fund::update_fund,
                routes::api::fund::delete_fund,
                routes::api::import::import_expenses,
                routes::login::me,
                routes::login::login,
                routes::login::logout,
                routes::api::statement_schema::get_schemas,
                routes::api::statement_schema::create_schema,
                routes::api::statement_schema::update_schema,
                routes::api::statement_schema::delete_schema,
                routes::api::statement_schema::test_schema,
            ],
        )
        .mount("/static", FileServer::from(relative!("www/static")))
        .manage(db)
        .attach(GateKeeper {})
        .attach(WriteLogger {})
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
        Command::Genjs => {
            genjs::export_types();
        }
        Command::Passwords { command } => {
            let database = Database::init().await;
            passwords::manage_passwords(database, command).await;
        }
        Command::Server => {
            let _ = run().await;
        }
        Command::Migration => {
            if let Err(error) = migration::run().await {
                println!("Migration failed: {:?}", error);
            }
        }
    };
}
