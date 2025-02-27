use clap::Parser;

use budget::account::Account;
use budget::database::Database;
use budget::import::{read_expenses, save_expenses};
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

    let schema = match account.fields.statement_schema_id {
        Some(value) => StatementSchema::fetch_by_id(&db, value)
            .await
            .expect("Fetching schema failed."),
        None => {
            println!(
                "Account {} does not have import schema attached",
                account_name
            );
            return;
        }
    };

    let expenses = match read_expenses(account.id, file_path, &schema.fields.record_mapping).await {
        Ok(value) => value,
        Err(e) => {
            println!("{:?}", e);
            return;
        }
    };

    match save_expenses(account.id, expenses, &db).await {
        Ok(_) => {}
        Err(e) => {
            println!("{:?}", e);
            return;
        }
    };
}
