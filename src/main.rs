use clap::Parser;

mod account;
mod database;
mod datetime;
mod expense;
mod record_mapping;
mod statement_import_config;

use crate::account::Account;
use crate::database::Database;
use crate::record_mapping::parse_statement;
use crate::statement_import_config::StatementImportConfig;

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

    let statement_import_config =
        match StatementImportConfig::fetch_by_id(&db, account.statement_import_config_id).await {
            Ok(Some(value)) => value,
            _ => {
                println!(
                    "Statement Import Config for account '{}' not found",
                    account_name
                );
                return;
            }
        };

    let _ = parse_statement(&statement_import_config.record_mapping, args.file);
}
