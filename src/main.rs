#[macro_use]
extern crate rocket;

use clap::{Parser, Subcommand};

mod account;
mod api_routes;
mod budget;
mod database;
mod database_enum;
mod datetime;
mod expense;
mod import;
mod record_mapping;
mod routes;
mod server;
mod statement_import_config;

use crate::account::Account;
use crate::database::Database;
use crate::import::process_statement;

#[derive(Debug, Parser)]
struct Args {
    #[clap(subcommand)]
    command: Command,
}

#[derive(Debug, Subcommand)]
enum Command {
    Import {
        account_name: String,
        file_path: String,
    },
    Server,
}

#[rocket::main]
async fn main() {
    let args = Args::parse();

    match args.command {
        Command::Import {
            account_name,
            file_path,
        } => {
            let db = Database::init().await;
            let account = match Account::fetch_by_name(&db, &account_name).await {
                Ok(value) => value,
                _ => {
                    println!("Could not find account '{}'", account_name);
                    return;
                }
            };

            match process_statement(&db, &account, file_path).await {
                Ok(_) => {}
                Err(e) => {
                    println!("{:?}", e);
                    return;
                }
            };
        }
        Command::Server => {
            let rocket = server::run().await;

            match rocket {
                Ok(_) => {}
                Err(e) => {
                    println!("{:?}", e);
                    return;
                }
            }
        }
    }
}
