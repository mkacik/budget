use clap::{Parser, Subcommand};

use budget::database::Database;
use budget::record_mapping::{bank_mapping_for_testing, shop_mapping_for_testing};
use budget::statement_import_config::StatementImportConfig;

#[derive(Parser, Debug)]
struct Args {
    #[clap(subcommand)]
    command: Command,
}

#[derive(Debug, Subcommand)]
enum Command {
    Seed,
}

#[tokio::main]
async fn main() {
    let db = Database::init().await;

    let args = Args::parse();
    let _ = match args.command {
        Command::Seed => add_statement_import_configs(db).await,
    };
}

async fn add_statement_import_configs(db: Database) -> anyhow::Result<()> {
    let mut bank = StatementImportConfig {
        id: None,
        name: String::from("bank"),
        record_mapping: bank_mapping_for_testing(),
    };
    bank.save(&db).await?;

    let mut shop = StatementImportConfig {
        id: None,
        name: String::from("shop"),
        record_mapping: shop_mapping_for_testing(),
    };
    shop.save(&db).await?;

    Ok(())
}
