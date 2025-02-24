use ts_rs::{ExportError, TS};

use budget::account::{AccountFields, Accounts};
use budget::budget::Budget;
use budget::expense::Expenses;

fn export() -> Result<(), ExportError> {
    // exports type with all dependencies, see https://docs.rs/ts-rs/latest/src/ts_rs/lib.rs.html
    Accounts::export_all()?;
    AccountFields::export_all()?;
    Budget::export_all()?;
    Expenses::export_all()?;

    Ok(())
}

fn main() {
    match export() {
        Ok(_) => {}
        Err(e) => println!("{:?}", e),
    }
}
