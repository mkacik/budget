use csv::Reader;
use std::cmp::Ordering;

use crate::database::{Database, ID};
use crate::error::ImportError;
use crate::expense::{Expense, ExpenseFields, LatestExpenses};
use crate::record_mapping::{ImportResult, RecordMapping};

pub const STATEMENT_UPLOAD_PATH: &str = "www/upload/tmp.csv";

pub async fn read_expenses(
    account_id: ID,
    path: String,
    mapping: &RecordMapping,
) -> anyhow::Result<Vec<ExpenseFields>, ImportError> {
    let mut reader = match Reader::from_path(path) {
        Ok(value) => value,
        Err(_) => {
            return Err(ImportError::new(format!(
                "Statement could not be read for import."
            )))
        }
    };
    let mut expenses: Vec<ExpenseFields> = Vec::new();
    let mut row_index = 0;
    for result in reader.records() {
        let record = match result {
            Ok(value) => value,
            Err(_) => return Err(ImportError::new(format!("Malformed row in statement."))),
        };
        match mapping.record_to_expense(record, account_id) {
            Ok(value) => expenses.push(value),
            Err(ImportResult::Skip) => {}
            Err(ImportResult::Error { message }) => {
                let error = ImportError::new(format!("{} in row {}", message, row_index));
                return Err(error);
            }
        };
        row_index += 1;
        println!("Processed row {}", row_index);
    }

    Ok(expenses)
}

pub async fn save_expenses(
    account_id: ID,
    expenses: Vec<ExpenseFields>,
    db: &Database,
) -> anyhow::Result<()> {
    let mut deduplicated = match Expense::fetch_latest_expenses(&db, account_id).await? {
        Some(latest_transactions) => deduplicate_expenses(expenses, latest_transactions),
        None => expenses,
    };

    deduplicated.sort_by(|a, b| match a.transaction_date.cmp(&b.transaction_date) {
        Ordering::Equal => a.transaction_time.cmp(&b.transaction_time),
        other => other,
    });

    for expense in deduplicated {
        Expense::create(&db, expense).await?;
    }

    Ok(())
}

fn deduplicate_expenses(
    expenses: Vec<ExpenseFields>,
    latest_logged_expenses: LatestExpenses,
) -> Vec<ExpenseFields> {
    let mut maybe_duplicates = vec![];
    let mut new_expenses = vec![];

    // 1. Split expenses into 3 groups based on transaction date and the latest expense in db:
    //  * expenses older than last "seen" transactions - throw those away, we already logged them
    //  * expenses from the same date as latest transaction - need to dedup those against db
    //  * expenses newer than last seen transaction - we take them as is, no filtering needed
    for expense in expenses {
        let expense_date = &expense.transaction_date;
        match expense_date.cmp(&latest_logged_expenses.date) {
            Ordering::Less => {}
            Ordering::Equal => maybe_duplicates.push(expense),
            Ordering::Greater => new_expenses.push(expense),
        }
    }

    // 2. Only for expenses that occured on last logged day, go one by one and deduplicate. The
    // resulting list only contains expenses from that day that were not already found in db.
    let mut deduplicated = remove_duplicates(maybe_duplicates, latest_logged_expenses.transactions);

    // 3. Finally, add the deduplicated expenses to the end of new_expenses list. The list is going
    // to be sorted later, so can just dump them at the end;
    new_expenses.append(&mut deduplicated);

    new_expenses
}

fn remove_duplicates(mut new: Vec<ExpenseFields>, old: Vec<Expense>) -> Vec<ExpenseFields> {
    for old_expense in old {
        let mut dupe_index: Option<usize> = None;
        for (index, new_expense_fields) in new.iter().enumerate() {
            if new_expense_fields == &old_expense.fields {
                dupe_index = Some(index);
                break;
            }
        }

        if let Some(index) = dupe_index {
            new.remove(index);
        }
    }

    return new;
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::expense::ExpenseCategory;

    fn get_expense_fields(amount: f64) -> ExpenseFields {
        ExpenseFields {
            account_id: 8,
            transaction_date: "2025-01-25".to_string(),
            transaction_time: None,
            description: "Some expense".to_string(),
            amount: amount,
            raw_csv: None,
        }
    }

    fn get_expense(amount: f64) -> Expense {
        Expense {
            id: 2,
            fields: get_expense_fields(amount),
            category: ExpenseCategory {
                budget_item_id: None,
            },
        }
    }

    #[test]
    fn test_remove_duplicates_only_dupes() {
        let new = vec![get_expense_fields(13.00), get_expense_fields(5.00)];

        let old = vec![get_expense(5.00), get_expense(13.00)];

        assert_eq!(remove_duplicates(new, old).len(), 0);
    }

    #[test]
    fn test_remove_duplicates_removes_first_matching_dupe_only() {
        let new = vec![
            get_expense_fields(13.00),
            get_expense_fields(13.00),
            get_expense_fields(5.00),
        ];

        let old = vec![get_expense(5.00), get_expense(13.00)];

        let result = remove_duplicates(new, old);
        assert_eq!(result.len(), 1);
        assert_eq!(result[0].amount, 13.00);
    }
}
