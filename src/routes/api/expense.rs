use rocket::form::{Form, FromForm};
use rocket::fs::TempFile;
use rocket::serde::json::Json;
use rocket::{get, post, State};
use serde::Deserialize;
use tokio::fs::remove_file;

use crate::account::Account;
use crate::budget::BudgetItem;
use crate::database::{Database, ID};
use crate::expense::Expense;
use crate::routes::common::{serialize_result, ApiResponse};
use crate::statement_import::{process_statement, STATEMENT_UPLOAD_PATH};
use crate::statement_import_config::StatementImportConfig;

#[get("/accounts/<account_id>/expenses")]
pub async fn get_expenses(db: &State<Database>, account_id: ID) -> ApiResponse {
    let result = Expense::fetch_by_account_id(&db, account_id).await;

    match serialize_result(result) {
        Ok(value) => ApiResponse::SuccessWithData { data: value },
        Err(_) => ApiResponse::ServerError,
    }
}

#[derive(FromForm)]
pub struct UploadStatementForm<'f> {
    file: TempFile<'f>,
}

#[post("/accounts/<account_id>/expenses", data = "<form>")]
pub async fn import_expenses(
    db: &State<Database>,
    account_id: ID,
    mut form: Form<UploadStatementForm<'_>>,
) -> ApiResponse {
    let account = match Account::fetch_by_id(db, account_id).await {
        Ok(value) => value,
        Err(_) => {
            return ApiResponse::BadRequest {
                message: format!("Account with id {} could not be found.", account_id),
            }
        }
    };

    let statement_import_config_id = match account.fields.statement_import_config_id {
        Some(value) => value,
        None => {
            return ApiResponse::BadRequest {
                message: format!(
                    "Account '{}' does not have import config attached.",
                    account.fields.name
                ),
            }
        }
    };

    let statement_import_config =
        match StatementImportConfig::fetch_by_id(&db, statement_import_config_id).await {
            Ok(value) => value,
            Err(_) => {
                return ApiResponse::BadRequest {
                    message: format!(
                        "StatementImportConfig with id {} could not be found.",
                        account_id
                    ),
                }
            }
        };

    if form.file.persist_to(STATEMENT_UPLOAD_PATH).await.is_err() {
        return ApiResponse::ServerError;
    };

    let result = process_statement(
        &db,
        account_id,
        statement_import_config,
        String::from(STATEMENT_UPLOAD_PATH),
    )
    .await;

    // clean up the temp file before return, regardless of whether import succeeded
    let _ = remove_file(STATEMENT_UPLOAD_PATH).await;

    match result {
        Ok(_) => ApiResponse::Success,
        Err(_) => ApiResponse::ServerError,
    }
}

#[derive(Deserialize, Debug)]
pub struct UpdateExpenseRequest {
    budget_item_id: Option<ID>,
}

#[post("/expenses/<expense_id>", format = "json", data = "<request>")]
pub async fn update_expense(
    db: &State<Database>,
    expense_id: ID,
    request: Json<UpdateExpenseRequest>,
) -> ApiResponse {
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
