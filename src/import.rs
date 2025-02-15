use csv::{Reader, StringRecord};
use std::cmp::Ordering;

use crate::account::Account;
use crate::database::Database;
use crate::expense::Expense;
use crate::record_mapping::RecordMapping;
use crate::statement_import_config::StatementImportConfig;

pub async fn process_statement(
    db: &Database,
    account: &Account,
    path: String,
) -> anyhow::Result<()> {
    let config_id = account.statement_import_config_id;
    let config = match StatementImportConfig::fetch_by_id(&db, config_id).await {
        Ok(Some(value)) => value,
        Ok(None) => {
            let err = anyhow::anyhow!(
                "Statement Import Config for account '{}' not found",
                account.name,
            );
            return Err(err);
        }
        Err(e) => return Err(e),
    };

    let mut expenses = read_expenses(&config.record_mapping, path).await?;
    expenses.sort_by(|a, b| match a.transaction_date.cmp(&b.transaction_date) {
        Ordering::Equal => a.transaction_time.cmp(&b.transaction_time),
        other => other,
    });

    let mut saved_expenses = vec![];
    for mut expense in expenses {
        expense.account_id = account.id;
        expense.save(&db).await?;
        println!("{:?}", expense);
        saved_expenses.push(expense);
    }

    Ok(())
}

pub async fn read_expenses(mapping: &RecordMapping, path: String) -> anyhow::Result<Vec<Expense>> {
    let mut reader = Reader::from_path(path)?;
    let mut expenses: Vec<Expense> = Vec::new();
    for result in reader.records() {
        let record = result?;
        let expense = mapping.record_to_expense(record)?;
        expenses.push(expense);
    }

    Ok(expenses)
}
