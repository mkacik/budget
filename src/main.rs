use clap::Parser;

mod account;
mod budget;
mod database;
mod datetime;
mod expense;
mod import;
mod record_mapping;
mod statement_import_config;

use crate::account::Account;
use crate::database::Database;
use crate::import::process_statement;

#[derive(Parser, Debug)]
struct Args {
    account: String,
    file: String,
}

#[tokio::main]
async fn main() {
    let db = Database::init().await;

    let args = Args::parse();
    let account_name = args.account;

    let account = match Account::fetch_by_name(&db, &account_name).await {
        Ok(value) => value,
        _ => {
            println!("Could not find account '{}'", account_name);
            return;
        }
    };

    match process_statement(&db, &account, args.file).await {
        Ok(_) => {}
        Err(e) => {
            println!("{:?}", e);
            return;
        }
    };
}
