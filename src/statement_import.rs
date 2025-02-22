use csv::Reader;
use std::cmp::Ordering;

use crate::account::Account;
use crate::database::Database;
use crate::expense::{Expense, LatestExpenses};
use crate::record_mapping::RecordMapping;
use crate::statement_import_config::StatementImportConfig;

pub const STATEMENT_UPLOAD_PATH: &str = "www/upload/tmp.csv";

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

    let expenses = read_expenses(&config.record_mapping, path).await?;

    let mut deduplicated = match Expense::fetch_latest_expenses(&db, account.id).await? {
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
    latest_logged_expenses: LatestExpenses,
) -> Vec<Expense> {
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
    //  - id, because it's None before expense is saved in db
    //  - account_id, because it's set only right before writing to db
    //  - category, because it will always be empty for new import, and user can set it later
    if new.transaction_date != old.transaction_date {
        return false;
    }
    if new.transaction_time != old.transaction_time {
        return false;
    }
    if new.description != old.description {
        return false;
    }
    if new.amount != old.amount {
        return false;
    }
    return true;
}

#[cfg(test)]
mod tests {
    use super::*;

    fn get_expense() -> Expense {
        Expense {
            id: Some(2),
            account_id: Some(1),
            transaction_date: "2025-01-25".to_string(),
            transaction_time: None,
            description: "Some expense".to_string(),
            amount: 13.99,
            budget_item_id: Some(5),
        }
    }

    fn get_expense_with_amount(amount: f64) -> Expense {
        let mut expense = get_expense();
        expense.amount = amount;

        expense
    }

    #[test]
    fn test_is_duplicate_ignores_fields() {
        let mut expense_a = get_expense();
        expense_a.id = None;
        expense_a.account_id = None;
        expense_a.budget_item_id = None;

        let expense_b = get_expense();

        assert!(is_duplicate(&expense_a, &expense_b));
    }

    #[test]
    fn test_is_duplicate_observes_transaction_date_diff() {
        let mut expense_a = get_expense();
        expense_a.transaction_date = "2024-12-16".to_string();

        let expense_b = get_expense();

        assert_ne!(&expense_a.transaction_date, &expense_b.transaction_date);
        assert_eq!(is_duplicate(&expense_a, &expense_b), false);
    }

    #[test]
    fn test_is_duplicate_observes_transaction_time_diff() {
        let mut expense_a = get_expense();
        expense_a.transaction_time = Some("22:30:00".to_string());

        let expense_b = get_expense();

        assert_ne!(&expense_a.transaction_time, &expense_b.transaction_time);
        assert_eq!(is_duplicate(&expense_a, &expense_b), false);
    }

    #[test]
    fn test_is_duplicate_observes_description_diff() {
        let mut expense_a = get_expense();
        expense_a.description = "Different description".to_string();

        let expense_b = get_expense();

        assert_ne!(&expense_a.description, &expense_b.description);
        assert_eq!(is_duplicate(&expense_a, &expense_b), false);
    }

    #[test]
    fn test_is_duplicate_observes_amount_diff() {
        let mut expense_a = get_expense();
        expense_a.amount += 10.0;

        let expense_b = get_expense();

        assert_ne!(&expense_a.amount, &expense_b.amount);
        assert_eq!(is_duplicate(&expense_a, &expense_b), false);
    }

    #[test]
    fn test_remove_duplicates_only_dupes() {
        let new = vec![
            get_expense_with_amount(13.00),
            get_expense_with_amount(5.00),
        ];

        let old = vec![
            get_expense_with_amount(5.00),
            get_expense_with_amount(13.00),
        ];

        assert_eq!(remove_duplicates(new, old).len(), 0);
    }

    #[test]
    fn test_remove_duplicates_removes_first_matching_dupe_only() {
        let new = vec![
            get_expense_with_amount(13.00),
            get_expense_with_amount(13.00),
            get_expense_with_amount(5.00),
        ];

        let old = vec![
            get_expense_with_amount(5.00),
            get_expense_with_amount(13.00),
        ];

        let result = remove_duplicates(new, old);
        assert_eq!(result.len(), 1);
        assert_eq!(result[0].amount, 13.00);
    }
}
