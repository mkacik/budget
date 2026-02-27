use std::env;
use std::fs;
use std::io;
use ts_rs::{ExportError, TS};

use crate::routes::api::budget::BudgetCloneRequest;
use crate::routes::api::expense::ExpensesQueryRequest;
use crate::routes::api::fund::GetAllFundsResponse;

use crate::schema::account::{AccountFields, Accounts};
use crate::schema::budget::Budget;
use crate::schema::budget_category::BudgetCategoryFields;
use crate::schema::budget_item::BudgetItemFields;
use crate::schema::expense::Expenses;
use crate::schema::fund::BudgetFundFields;
use crate::schema::spending_data::SpendingData;
use crate::schema::statement_schema::{StatementSchemaFields, StatementSchemas};
use crate::schema::statement_schema_test::{TestSchemaRequest, TestSchemaResponse};

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

    BudgetCloneRequest::export_all()?;

    ExpensesQueryRequest::export_all()?;

    GetAllFundsResponse::export_all()?;
    BudgetFundFields::export_all()?;

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

pub fn export_types() {
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
