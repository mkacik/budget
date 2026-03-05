#[macro_use]
extern crate rocket;
use rocket::fs::{relative, FileServer};
use rocket::{Error as RocketError, Ignite, Rocket};

use clap::{Parser, Subcommand};

mod common;
mod controllers;
mod credentials;
mod crypto;
mod database;
mod fairings;
mod genjs;
mod guards;
mod import;
mod migration;
mod passwords;
mod response;
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
            routes![controllers::index::index, controllers::index::not_found,],
        )
        .mount(
            "/api",
            routes![
                controllers::account::get_accounts,
                controllers::account::create_account,
                controllers::account::update_account,
                controllers::account::delete_account,
                controllers::budget::get_budget,
                controllers::budget::clone_budget,
                controllers::budget::get_spending,
                controllers::budget_category::create_budget_category,
                controllers::budget_category::update_budget_category,
                controllers::budget_category::delete_budget_category,
                controllers::budget_item::create_budget_item,
                controllers::budget_item::update_budget_item,
                controllers::budget_item::delete_budget_item,
                controllers::expense::delete_expenses,
                controllers::expense::create_expense,
                controllers::expense::delete_expense,
                controllers::expense::update_expense_category,
                controllers::expense::update_expense_notes,
                controllers::expense::query_expenses,
                controllers::fund::get_funds,
                controllers::fund::get_items,
                controllers::fund::create_fund,
                controllers::fund::update_fund,
                controllers::fund::delete_fund,
                controllers::import::import_expenses,
                controllers::login::me,
                controllers::login::login,
                controllers::login::logout,
                controllers::statement_schema::get_schemas,
                controllers::statement_schema::create_schema,
                controllers::statement_schema::update_schema,
                controllers::statement_schema::delete_schema,
                controllers::statement_schema::test_schema,
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
