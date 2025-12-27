use regex::Regex;
use rocket::form::{Form, FromForm};
use rocket::fs::TempFile;
use rocket::serde::json::Json;
use rocket::{post, State};
use serde::{Deserialize, Serialize};
use tokio::fs::remove_file;
use ts_rs::TS;

use crate::account::Account;
use crate::budget::BudgetItem;
use crate::database::{Database, ID};
use crate::expense::{Expense, ExpenseCategory};
use crate::guards::write_log::WriteLogEntry;
use crate::import::{read_expenses, save_expenses, STATEMENT_UPLOAD_PATH};
use crate::routes::common::{serialize_result, ApiResponse};
use crate::statement_schema::StatementSchema;

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
        return ApiResponse::BadRequest {
            message: String::from("Can't process empty file."),
        };
    }

    let account = match Account::fetch_by_id(db, account_id).await {
        Ok(value) => value,
        Err(_) => {
            return ApiResponse::BadRequest {
                message: format!("Account with id {} could not be found.", account_id),
            }
        }
    };

    let statement_schema_id = match account.fields.statement_schema_id {
        Some(value) => value,
        None => {
            return ApiResponse::BadRequest {
                message: format!(
                    "Account '{}' does not have import schema attached.",
                    account.fields.name
                ),
            }
        }
    };

    let statement_schema = match StatementSchema::fetch_by_id(&db, statement_schema_id).await {
        Ok(value) => value,
        Err(_) => {
            return ApiResponse::BadRequest {
                message: format!("StatementSchema with id {} could not be found.", account_id),
            }
        }
    };

    if form.file.persist_to(STATEMENT_UPLOAD_PATH).await.is_err() {
        return ApiResponse::ServerError;
    };

    let expenses_or_error = read_expenses(
        account_id,
        String::from(STATEMENT_UPLOAD_PATH),
        &statement_schema.fields.record_mapping,
    )
    .await;

    // clean up the temp file before return, regardless of whether import succeeded
    let _ = remove_file(STATEMENT_UPLOAD_PATH).await;

    let expenses = match expenses_or_error {
        Ok(value) => value,
        Err(e) => return ApiResponse::BadRequest { message: e.message },
    };

    let result = save_expenses(account_id, expenses, &db).await;

    match result {
        Ok(_) => ApiResponse::Success,
        Err(_) => ApiResponse::ServerError,
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
        return ApiResponse::BadRequest {
            message: format!("Incorrect date '{}', expected 'yyyy-MM-dd' format", date),
        };
    }

    match Expense::delete_by_account_id_and_date(&db, account_id, &date).await {
        Ok(_) => ApiResponse::Success,
        Err(_) => ApiResponse::ServerError,
    }
}

#[post("/expenses/<expense_id>", format = "json", data = "<json>")]
pub async fn update_expense(
    db: &State<Database>,
    log_entry: &WriteLogEntry,
    expense_id: ID,
    json: Json<ExpenseCategory>,
) -> ApiResponse {
    let request = json.into_inner();
    log_entry.set_content(&request);

    let budget_item_id = request.budget_item_id;
    // If new value of budget item is not None, validate that the id exists in db
    if let Some(id) = budget_item_id {
        if BudgetItem::fetch_by_id(&db, id).await.is_err() {
            return ApiResponse::BadRequest {
                message: format!("BudgetItem with id {} could not be found.", id),
            };
        }
    }

    let mut expense = match Expense::fetch_by_id(&db, expense_id).await {
        Ok(value) => value,
        Err(_) => {
            return ApiResponse::BadRequest {
                message: format!("Expense with id {} could not be found.", expense_id),
            }
        }
    };

    match expense.set_budget_item(&db, budget_item_id).await {
        Ok(_) => ApiResponse::Success,
        Err(_) => ApiResponse::ServerError,
    }
}

#[derive(Debug, Deserialize, Serialize, TS)]
#[serde(tag = "variant", content = "params")]
#[ts(export_to = "Expense.ts", tag = "variant", content = "params")]
pub enum ExpensesQueryRequestCategorySelector {
    All,
    Uncategorized,
    BudgetItem { id: ID },
    BudgetCategory { id: ID },
}

#[derive(Debug, Deserialize, Serialize, TS)]
#[serde(tag = "variant", content = "params")]
#[ts(export_to = "Expense.ts", tag = "variant", content = "params")]
pub enum ExpensesQueryRequest {
    // used on Expenses tab
    ByAccount {
        id: ID,
        year: i32,
    },

    // used on Analyze tab
    ByPeriod {
        period: String, // expected format YYYY or YYYY-mm
        category: ExpensesQueryRequestCategorySelector,
    },
}

fn is_valid_period(period: &str) -> bool {
    if period.len() > 7 {
        return false;
    }

    let re = Regex::new(r"^20\d\d(-(0\d|1[012]))?$").unwrap();

    re.is_match(period)
}

#[post("/expenses/query", format = "json", data = "<json>")]
pub async fn query_expenses(db: &State<Database>, json: Json<ExpensesQueryRequest>) -> ApiResponse {
    let request = json.into_inner();
    let result = match request {
        ExpensesQueryRequest::ByAccount { id, year } => {
            Expense::fetch_by_account_id_and_year(&db, id, year).await
        }
        ExpensesQueryRequest::ByPeriod { period, category } => {
            if !is_valid_period(&period) {
                return ApiResponse::BadRequest {
                    message: format!(
                        "Incorrect period '{}', expected 'YYYY' or 'YYYY-mm'",
                        period
                    ),
                };
            }

            match category {
                ExpensesQueryRequestCategorySelector::BudgetCategory { id } => {
                    Expense::fetch_by_budget_category_id_and_period(&db, id, period).await
                }
                ExpensesQueryRequestCategorySelector::BudgetItem { id } => {
                    Expense::fetch_by_budget_item_id_and_period(&db, id, period).await
                }
                ExpensesQueryRequestCategorySelector::Uncategorized => {
                    Expense::fetch_uncategorized_by_period(&db, period).await
                }
                ExpensesQueryRequestCategorySelector::All => {
                    Expense::fetch_all_non_ignored_by_period(&db, period).await
                }
            }
        }
    };

    match serialize_result(result) {
        Ok(value) => ApiResponse::SuccessWithData { data: value },
        Err(_) => ApiResponse::ServerError,
    }
}
