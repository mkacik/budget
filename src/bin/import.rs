use clap::Parser;

use budget::account::Account;
use budget::database::Database;
use budget::statement_import::process_statement;

#[derive(Debug, Parser)]
struct Args {
    account_name: String,
    file_path: String,
}

#[tokio::main]
async fn main() {
    let args = Args::parse();

    let account_name = args.account_name;
    let file_path = args.file_path;

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
