use clap::Parser;

use budget::account::Account;
use budget::database::Database;
use budget::statement_import::process_statement;
use budget::statement_schema::StatementSchema;

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

    let mut accounts = Account::fetch_all(&db)
        .await
        .expect("Fetching accounts from db failed")
        .accounts;
    accounts.retain(|account| account.fields.name == account_name);

    if accounts.len() != 1 {
        println!("Could not find account '{}'", account_name);
        return;
    }

    let account = &accounts[0];

    let config = match account.fields.statement_schema_id {
        Some(value) => StatementSchema::fetch_by_id(&db, value)
            .await
            .expect("Fetching config failed."),
        None => {
            println!(
                "Account {} does not have import config attached",
                account_name
            );
            return;
        }
    };

    match process_statement(&db, account.id, config, file_path).await {
        Ok(_) => {}
        Err(e) => {
            println!("{:?}", e);
            return;
        }
    };
}
