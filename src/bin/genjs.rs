use std::env;
use std::fs;
use std::io;
use ts_rs::{ExportError, TS};

use budget::account::{AccountFields, Accounts};
use budget::budget::{Budget, BudgetCategoryFields, BudgetItemFields};
use budget::expense::Expenses;
use budget::schema_test::{TestSchemaRequest, TestSchemaResponse};
use budget::spending::SpendingData;
use budget::statement_schema::{StatementSchemaFields, StatementSchemas};

fn export() -> Result<(), ExportError> {
    // exports type with all dependencies, see https://docs.rs/ts-rs/latest/src/ts_rs/lib.rs.html
    AccountFields::export_all()?;
    Accounts::export_all()?;

    Budget::export_all()?;
    BudgetCategoryFields::export_all()?;
    BudgetItemFields::export_all()?;

    Expenses::export_all()?;

    SpendingData::export_all()?;

    StatementSchemaFields::export_all()?;
    StatementSchemas::export_all()?;

    TestSchemaRequest::export_all()?;
    TestSchemaResponse::export_all()?;

    Ok(())
}

fn prepare(export_dir: &str) -> io::Result<()> {
    for entry in fs::read_dir(export_dir)? {
        let path = entry?.path();
        if path.extension().unwrap() == "ts" {
            println!("Removing {}", path.display());
            let _ = fs::remove_file(path);
        }
    }

    Ok(())
}

fn main() {
    let export_dir = match env::var("TS_RS_EXPORT_DIR") {
        Ok(value) => value,
        Err(_) => {
            println!("This script is moot if TS_RS_EXPORT_DIR var is unset");
            return;
        }
    };

    if fs::exists(&export_dir).is_ok() {
        println!("Directory exists, clearing all ts files first.");
        let _ = prepare(&export_dir);
    }

    match export() {
        Ok(_) => {}
        Err(e) => println!("{:?}", e),
    }
}
