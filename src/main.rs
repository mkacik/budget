use clap::Parser;

mod database;
mod datetime;
mod expense;
mod record_mapping;
mod statement_import_config;

use crate::database::Database;
use crate::record_mapping::parse_statement;
use crate::statement_import_config::StatementImportConfig;

#[derive(Parser, Debug)]
struct Args {
    file: String,

    #[arg(short)]
    shop: bool,
}

#[tokio::main]
async fn main() {
    let db = Database::init().await;

    let args = Args::parse();
    let mapping_name = match args.shop {
        false => "bank",
        true => "shop",
    };

    let import_config = StatementImportConfig::fetch_by_name(&db, mapping_name)
        .await
        .unwrap();
    let _ = parse_statement(&import_config.record_mapping, args.file);
}
