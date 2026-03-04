use regex::Regex;
use rocket::form::{Form, FromForm};
use rocket::fs::TempFile;
use rocket::serde::json::Json;
use rocket::{delete, post, State};
use serde::{Deserialize, Serialize};
use tokio::fs::remove_file;
use ts_rs::TS;

use crate::database::{Database, ID};
use crate::guards::write_log::WriteLogEntry;
use crate::import::{read_expenses, save_expenses, STATEMENT_UPLOAD_PATH};
use crate::routes::response::ApiResponse;

use crate::schema::account::{Account, AccountType};
use crate::schema::budget_item::BudgetItem;
use crate::schema::expense::{Expense, ExpenseCategory, ExpenseFields, ExpenseNotes};
use crate::schema::statement_schema::StatementSchema;

#[derive(FromForm)]
pub struct UploadStatementForm<'f> {
    file: TempFile<'f>,
}

#[post("/accounts/<account_id>/expenses", data = "<form>")]
pub async fn import_expenses(
    db: &State<Database>,
    log_entry: &WriteLogEntry,
    account_id: ID,
    mut form: Form<UploadStatementForm<'_>>,
) -> ApiResponse {
    log_entry.set_content(format!("File of length {}", form.file.len()));

    if form.file.len() == 0 {
        return ApiResponse::bad("Can't process empty file.");
    }

    let account = match Account::fetch_by_id(db, account_id).await {
        Ok(value) => value,
        Err(_) => {
            let message = format!("Account with id {} could not be found.", account_id);
            return ApiResponse::bad(&message);
        }
    };

    let statement_schema_id = match account.fields.statement_schema_id {
        Some(value) => value,
        None => {
            let message = format!(
                "Account '{}' does not have import schema attached.",
                account.fields.name
            );
            return ApiResponse::bad(&message);
        }
    };

    let statement_schema = match StatementSchema::fetch_by_id(&db, statement_schema_id).await {
        Ok(value) => value,
        Err(_) => {
            let message = format!("StatementSchema with id {} could not be found.", account_id);
            return ApiResponse::bad(&message);
        }
    };

    if let Err(e) = form.file.persist_to(STATEMENT_UPLOAD_PATH).await {
        // std::io::Error -> anyhow::Error
        return ApiResponse::error(anyhow::anyhow!(e));
    };

    let expenses_or_import_error = read_expenses(
        account_id,
        String::from(STATEMENT_UPLOAD_PATH),
        &statement_schema.fields.record_mapping,
    )
    .await;

    // clean up the temp file before return, regardless of whether import succeeded
    let _ = remove_file(STATEMENT_UPLOAD_PATH).await;

    // ImportError is always user error and contains a message to display in UI
    let expenses = match expenses_or_import_error {
        Ok(value) => value,
        Err(e) => return ApiResponse::bad(&e.message),
    };

    match save_expenses(account_id, expenses, &db).await {
        Ok(_) => ApiResponse::ok(),
        Err(e) => ApiResponse::error(e),
    }
}

#[derive(Debug, Deserialize, Serialize)]
pub struct DeleteExpensesRequest {
    newer_than_date: String,
}

#[post(
    "/accounts/<account_id>/expenses/delete",
    format = "json",
    data = "<json>"
)]
pub async fn delete_expenses(
    db: &State<Database>,
    log_entry: &WriteLogEntry,
    account_id: ID,
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

    match Expense::delete_by_account_id_and_date(&db, account_id, &date).await {
        Ok(_) => ApiResponse::ok(),
        Err(e) => ApiResponse::error(e),
    }
}

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

#[post("/expenses/create", format = "json", data = "<json>")]
pub async fn create_expense(
    db: &State<Database>,
    log_entry: &WriteLogEntry,
    json: Json<ExpenseFields>,
) -> ApiResponse {
    let mut request = json.into_inner();
    log_entry.set_content(&request);

    let account = match Account::fetch_by_id(db, request.account_id).await {
        Ok(value) => value,
        Err(_) => {
            let message = format!("Account with id {} could not be found.", request.account_id);
            return ApiResponse::bad(&message);
        }
    };

    if account.fields.account_type != AccountType::Cash {
        return ApiResponse::bad("Manually adding expenses only allowed for Cash accounts.");
    }

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
    // existing expenses
    let expense = match Expense::fetch_by_id(&db, id).await {
        Ok(value) => value,
        Err(_) => {
            let message = format!("Expense with id {} could not be found.", id);
            return ApiResponse::bad(&message);
        }
    };

    let account_id = expense.fields.account_id;
    let account = match Account::fetch_by_id(&db, account_id).await {
        Ok(value) => value,
        Err(_) => {
            let message = format!("Account with id {} could not be found.", account_id);
            return ApiResponse::bad(&message);
        }
    };

    if account.fields.account_type != AccountType::Cash {
        return ApiResponse::bad("Manually deleting expenses only allowed for Cash accounts.");
    }

    match Expense::delete_by_id(&db, id).await {
        Ok(_) => ApiResponse::ok(),
        Err(e) => ApiResponse::error(e),
    }
}

#[post("/expenses/<expense_id>/category", format = "json", data = "<json>")]
pub async fn update_expense_category(
    db: &State<Database>,
    log_entry: &WriteLogEntry,
    expense_id: ID,
    json: Json<ExpenseCategory>,
) -> ApiResponse {
    let request = json.into_inner();
    log_entry.set_content(&request);

    let mut expense = match Expense::fetch_by_id(&db, expense_id).await {
        Ok(value) => value,
        Err(_) => {
            let message = format!("Expense with id {} could not be found.", expense_id);
            return ApiResponse::bad(&message);
        }
    };

    let budget_item_id = request.budget_item_id;
    // If new value of budget item is not None, validate that the id exists in db
    if let Some(id) = budget_item_id {
        if BudgetItem::fetch_by_id(&db, id).await.is_err() {
            let message = format!("BudgetItem with id {} could not be found.", id);
            return ApiResponse::bad(&message);
        }
    }

    match expense.set_budget_item_id(&db, budget_item_id).await {
        Ok(_) => ApiResponse::ok(),
        Err(e) => ApiResponse::error(e),
    }
}

#[post("/expenses/<expense_id>/notes", format = "json", data = "<json>")]
pub async fn update_expense_notes(
    db: &State<Database>,
    log_entry: &WriteLogEntry,
    expense_id: ID,
    json: Json<ExpenseNotes>,
) -> ApiResponse {
    let request = json.into_inner();
    log_entry.set_content(&request);

    let mut expense = match Expense::fetch_by_id(&db, expense_id).await {
        Ok(value) => value,
        Err(_) => {
            let message = format!("Expense with id {} could not be found.", expense_id);
            return ApiResponse::bad(&message);
        }
    };

    match expense.set_notes(&db, request.notes).await {
        Ok(_) => ApiResponse::ok(),
        Err(e) => ApiResponse::error(e),
    }
}

#[derive(Debug, Deserialize, Serialize, TS)]
#[serde(tag = "variant")]
#[ts(export_to = "Expense.ts", tag = "variant")]
pub enum ExpensesQuerySelector {
    AllNotIgnored,
    Uncategorized,
    Account { id: ID },
    BudgetItem { id: ID },
    BudgetCategory { id: ID },
}

#[derive(Debug, Deserialize, Serialize, TS)]
#[ts(export_to = "Expense.ts")]
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
