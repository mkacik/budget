use regex::Regex;
use rocket::serde::json::Json;
use rocket::{delete, post, State};
use serde::{Deserialize, Serialize};
use ts_rs::TS;

use crate::common::TS_FILE;
use crate::database::{Database, ID};
use crate::guards::write_log::WriteLogEntry;
use crate::response::ApiResponse;

use crate::schema::account::{Account, AccountType};
use crate::schema::expense::{Expense, ExpenseCategory, ExpenseFields, ExpenseNotes};

fn to_simple_csv_row(
    transaction_date: &str,
    amount: i32,
    description: &str,
) -> anyhow::Result<String> {
    let mut wtr = csv::WriterBuilder::new()
        .has_headers(false)
        .from_writer(vec![]);
    wtr.serialize((transaction_date, amount, description))?;
    let data = wtr.into_inner()?;
    let string = String::from_utf8(data)?;

    Ok(string.trim().to_string())
}

async fn is_cash_account(db: &Database, account_id: ID) -> anyhow::Result<bool> {
    let account = Account::fetch_by_id(db, account_id).await?;

    Ok(account.fields.account_type == AccountType::Cash)
}

#[post("/expenses", format = "json", data = "<json>")]
pub async fn create_expense(
    db: &State<Database>,
    log_entry: &WriteLogEntry,
    json: Json<ExpenseFields>,
) -> ApiResponse {
    let mut request = json.into_inner();
    log_entry.set_content(&request);

    match is_cash_account(&db, request.account_id).await {
        Ok(true) => (),
        Ok(false) => {
            let message = "Manually deleting expenses only allowed for Cash accounts.";
            return ApiResponse::bad(&message);
        }
        Err(e) => return ApiResponse::error(e),
    };

    let raw_csv = match to_simple_csv_row(
        &request.transaction_date,
        request.amount,
        &request.description,
    ) {
        Ok(value) => value,
        Err(e) => return ApiResponse::error(e),
    };
    request.raw_csv = Some(raw_csv);

    match Expense::create(&db, request).await {
        Ok(_) => ApiResponse::ok(),
        Err(e) => ApiResponse::error(e),
    }
}

#[delete("/expenses/<id>")]
pub async fn delete_expense(
    db: &State<Database>,
    _log_entry: &WriteLogEntry,
    id: ID,
) -> ApiResponse {
    // The extra validation here is to prevent manually deleting imported expenses,
    // which will later be impossible to import through normal flow if surrounded by
    // existing expenses; UI will only allow for triggering this operation for existing
    // expense and account, so depending on sl errors is fine.
    let expense = match Expense::fetch_by_id(&db, id).await {
        Ok(value) => value,
        Err(e) => return ApiResponse::error(e),
    };

    match is_cash_account(&db, expense.fields.account_id).await {
        Ok(true) => (),
        Ok(false) => {
            let message = "Manually deleting expenses only allowed for Cash accounts.";
            return ApiResponse::bad(&message);
        }
        Err(e) => return ApiResponse::error(e),
    };

    match Expense::delete(&db, id).await {
        Ok(_) => ApiResponse::ok(),
        Err(e) => ApiResponse::error(e),
    }
}

#[put("/expenses/<id>/category", format = "json", data = "<json>")]
pub async fn update_expense_category(
    db: &State<Database>,
    log_entry: &WriteLogEntry,
    id: ID,
    json: Json<ExpenseCategory>,
) -> ApiResponse {
    let request = json.into_inner();
    log_entry.set_content(&request);

    match Expense::update_budget_item_id(&db, id, request.budget_item_id).await {
        Ok(_) => ApiResponse::ok(),
        Err(e) => ApiResponse::error(e),
    }
}

#[put("/expenses/<id>/notes", format = "json", data = "<json>")]
pub async fn update_expense_notes(
    db: &State<Database>,
    log_entry: &WriteLogEntry,
    id: ID,
    json: Json<ExpenseNotes>,
) -> ApiResponse {
    let request = json.into_inner();
    log_entry.set_content(&request);

    match Expense::update_notes(&db, id, request.notes).await {
        Ok(_) => ApiResponse::ok(),
        Err(e) => ApiResponse::error(e),
    }
}

#[derive(Debug, Deserialize, Serialize, TS)]
#[serde(tag = "variant")]
#[ts(export_to = TS_FILE, tag = "variant")]
pub enum ExpensesQuerySelector {
    AllNotIgnored,
    Uncategorized,
    Account { id: ID },
    BudgetItem { id: ID },
    BudgetCategory { id: ID },
}

#[derive(Debug, Deserialize, Serialize, TS)]
#[ts(export_to = TS_FILE)]
pub struct ExpensesQuery {
    period: String, // expected format YYYY or YYYY-mm
    selector: ExpensesQuerySelector,
}

fn looks_like_valid_period(period: &str) -> bool {
    let re = Regex::new(r"^20\d\d(-(0\d|1[012]))?$").unwrap();

    re.is_match(period)
}

#[post("/expenses/query", format = "json", data = "<json>")]
pub async fn query_expenses(db: &State<Database>, json: Json<ExpensesQuery>) -> ApiResponse {
    let query = json.into_inner();
    if !looks_like_valid_period(&query.period) {
        let message = format!("Incorrect period: '{}'. Expected 'YYYY[-mm]'", query.period);
        return ApiResponse::bad(&message);
    }

    let period = query.period;
    let expenses = match query.selector {
        ExpensesQuerySelector::AllNotIgnored => {
            Expense::fetch_all_not_ignored_by_period(&db, period).await
        }
        ExpensesQuerySelector::Uncategorized => {
            Expense::fetch_uncategorized_by_period(&db, period).await
        }
        ExpensesQuerySelector::Account { id } => {
            Expense::fetch_by_account_id_and_period(&db, id, period).await
        }
        ExpensesQuerySelector::BudgetItem { id } => {
            Expense::fetch_by_budget_item_id_and_period(&db, id, period).await
        }
        ExpensesQuerySelector::BudgetCategory { id } => {
            Expense::fetch_by_budget_category_id_and_period(&db, id, period).await
        }
    };

    match expenses {
        Ok(value) => ApiResponse::data(value),
        Err(e) => ApiResponse::error(e),
    }
}

#[derive(Debug, Deserialize, Serialize)]
pub struct DeleteExpensesRequest {
    account_id: ID,
    newer_than_date: String,
}

#[post("/expenses/bulk_delete", format = "json", data = "<json>")]
pub async fn delete_expenses(
    db: &State<Database>,
    log_entry: &WriteLogEntry,
    json: Json<DeleteExpensesRequest>,
) -> ApiResponse {
    let request = json.into_inner();
    log_entry.set_content(&request);

    let date = request.newer_than_date;
    let re = Regex::new(r"^20\d\d-[01]\d-[0123]\d$").unwrap();
    if !re.is_match(&date) {
        let message = format!("Incorrect date '{}', expected 'yyyy-MM-dd' format", date);
        return ApiResponse::bad(&message);
    }

    match Expense::delete_by_account_id_and_date(&db, request.account_id, &date).await {
        Ok(_) => ApiResponse::ok(),
        Err(e) => ApiResponse::error(e),
    }
}
