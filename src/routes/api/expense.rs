use rocket::{get, post, State};
use rocket::serde::json::Json;
use rocket::form::{Form, FromForm};
use rocket::fs::TempFile;
use serde::Deserialize;
use tokio::fs::remove_file;

use crate::account::{Account};
use crate::budget::BudgetItem;
use crate::database::{Database, ID};
use crate::expense::Expense;
use crate::routes::common::{serialize_result, ApiResponse};
use crate::statement_import::{process_statement, STATEMENT_UPLOAD_PATH};

#[get("/accounts/<account_id>/expenses")]
pub async fn get_expenses(db: &State<Database>, account_id: i32) -> ApiResponse {
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

async fn import_expenses_from_uploaded_statement(
    db: &Database,
    account_id: i32,
    mut form: Form<UploadStatementForm<'_>>,
) -> anyhow::Result<()> {
    let account = Account::fetch_by_id(db, account_id).await?;
    form.file.persist_to(STATEMENT_UPLOAD_PATH).await?;
    process_statement(&db, &account, String::from(STATEMENT_UPLOAD_PATH)).await?;
    remove_file(STATEMENT_UPLOAD_PATH).await?;

    Ok(())
}

#[post("/accounts/<account_id>/expenses", data = "<form>")]
pub async fn import_expenses(
    db: &State<Database>,
    account_id: i32,
    form: Form<UploadStatementForm<'_>>,
) -> ApiResponse {
    match import_expenses_from_uploaded_statement(db, account_id, form).await {
        Ok(_) => ApiResponse::Success,
        Err(_) => ApiResponse::ServerError,
    }
}

#[derive(Deserialize, Debug)]
pub struct UpdateExpenseRequest {
    budget_item_id: ID,
}

async fn update_expense_budget_item_id(
    db: &Database,
    expense_id: i32,
    budget_item_id: ID,
) -> anyhow::Result<()> {
    // validate that budget_item_id exists, if it's not None
    match budget_item_id {
        Some(id) => {
            BudgetItem::fetch_by_id(&db, id).await?;
        }
        None => {}
    };
    let mut expense = Expense::fetch_by_id(&db, expense_id).await?;
    expense.set_budget_item(&db, budget_item_id).await?;

    Ok(())
}

#[post("/expenses/<expense_id>", format = "json", data = "<request>")]
pub async fn update_expense(
    db: &State<Database>,
    expense_id: i32,
    request: Json<UpdateExpenseRequest>,
) -> ApiResponse {
    match update_expense_budget_item_id(&db, expense_id, request.budget_item_id).await {
        Ok(_) => ApiResponse::Success,
        Err(_) => ApiResponse::ServerError,
    }
}
