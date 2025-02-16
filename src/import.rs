use csv::Reader;
use std::cmp::Ordering;

use crate::account::Account;
use crate::database::Database;
use crate::expense::{Expense, LatestTransactions};
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

    let mut deduplicated = match Expense::fetch_latest_transactions(&db, account.id).await? {
        Some(latest_transactions) => deduplicate_expenses(expenses, latest_transactions),
        None => expenses,
    };

    deduplicated.sort_by(|a, b| match a.transaction_date.cmp(&b.transaction_date) {
        Ordering::Equal => a.transaction_time.cmp(&b.transaction_time),
        other => other,
    });

    for mut expense in deduplicated {
        expense.account_id = account.id;
        expense.save(&db).await?;
        println!("{:?}", expense);
    }

    Ok(())
}

async fn read_expenses(mapping: &RecordMapping, path: String) -> anyhow::Result<Vec<Expense>> {
    let mut reader = Reader::from_path(path)?;
    let mut expenses: Vec<Expense> = Vec::new();
    for result in reader.records() {
        let record = result?;
        let expense = mapping.record_to_expense(record)?;
        expenses.push(expense);
    }

    Ok(expenses)
}

fn deduplicate_expenses(
    expenses: Vec<Expense>,
    latest_transactions: LatestTransactions,
) -> Vec<Expense> {
    // 1. Split expenses into 3 groups based on transaction date and the latest expense in db:
    //  * expenses older than last "seen" transactions - throw those away, we already logged them
    //  * expenses from the same date as latest transaction - need to dedup those against db
    //  * expenses newer than last seen transaction - we take them as is, no filtering needed
    let mut maybe_duplicates = vec![];
    let mut new_only = vec![];

    for expense in expenses {
        let expense_date = &expense.transaction_date;
        match expense_date.cmp(&latest_transactions.date) {
            Ordering::Less => {}
            Ordering::Greater => new_only.push(expense),
            Ordering::Equal => maybe_duplicates.push(expense),
        }
    }

    let mut deduplicated = remove_duplicates(maybe_duplicates, latest_transactions.transactions);
    deduplicated.append(&mut new_only);

    deduplicated
}

// TODO: consider vec.dedup_by
fn remove_duplicates(mut new: Vec<Expense>, old: Vec<Expense>) -> Vec<Expense> {
    for old_expense in old {
        let mut dupe_index: Option<usize> = None;
        for (index, new_expense) in new.iter().enumerate() {
            if is_duplicate(&new_expense, &old_expense) {
                dupe_index = Some(index);
                break;
            }
        }
        match dupe_index {
            None => {}
            Some(index) => {
                new.remove(index);
            }
        }
    }

    return new;
}

fn is_duplicate(new: &Expense, old: &Expense) -> bool {
    // this check skips few fields:
    //  - date, because this function is only called when date is the same
    //  - id, because it's None before expense is saved in db
    //  - account_id, because it's set only right before writing to db
    if new.transaction_time != old.transaction_time {
        return false;
    }
    if new.description != old.description {
        return false;
    }
    if new.amount != old.amount {
        return false;
    }
    if new.details != old.details {
        return false;
    }
    return true;
}
