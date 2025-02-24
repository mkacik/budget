use rocket::http::{ContentType, Status};
use rocket::serde::json::Json;
use rocket::{delete, get, post, State};
use serde::Deserialize;

// statement upload
use rocket::form::{Form, FromForm};
use rocket::fs::TempFile;
use tokio::fs::remove_file;

use crate::account::{Account, AccountFields};
use crate::budget::{Budget, BudgetItem};
use crate::database::{Database, ID};
use crate::expense::Expense;
use crate::routes::common::{
    failure, failure_server_error, query_result_to_api_response, success_empty, success_with_data,
    ApiResponse,
};
use crate::routes::common::{ok_empty, result_to_json_string};
use crate::statement_import::{process_statement, STATEMENT_UPLOAD_PATH};

#[get("/budget")]
pub async fn get_budget(db: &State<Database>) -> Option<(ContentType, String)> {
    let result = Budget::fetch(&db).await;

    result_to_json_string(result)
}

#[get("/accounts")]
pub async fn get_accounts(db: &State<Database>) -> Option<(ContentType, String)> {
    let result = Account::fetch_all(&db).await;

    result_to_json_string(result)
}

#[post("/accounts", format = "json", data = "<request>")]
pub async fn add_account(
    db: &State<Database>,
    request: Json<AccountFields>,
) -> Option<(ContentType, String)> {
    let fields = request.into_inner();
    match Account::create(&db, fields).await {
        Ok(_) => ok_empty(),
        Err(_) => None,
    }
}

#[post("/accounts/<account_id>", format = "json", data = "<request>")]
pub async fn update_account(
    db: &State<Database>,
    account_id: i32,
    request: Json<Account>,
) -> Option<(ContentType, String)> {
    let account = request.into_inner();
    if account_id != account.id {
        return None;
    }
    match account.update(&db).await {
        Ok(_) => ok_empty(),
        Err(_) => None,
    }
}

#[delete("/accounts/<account_id>")]
pub async fn delete_account(db: &State<Database>, account_id: i32) -> ApiResponse {
    let expenses = match Expense::fetch_by_account_id(db, account_id).await {
        Ok(value) => value,
        Err(_) => return failure_server_error(),
    };
    if expenses.expenses.len() > 0 {
        return failure(
            Status::BadRequest,
            "Can't delete account that has expenses attached.",
        );
    }
    match Account::delete_by_id(db, account_id).await {
        Ok(_) => success_empty(),
        Err(_) => failure_server_error(),
    }
}

#[get("/accounts/<account_id>/expenses")]
pub async fn get_expenses(db: &State<Database>, account_id: i32) -> ApiResponse {
    let result = Expense::fetch_by_account_id(&db, account_id).await;

    query_result_to_api_response(result)
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
) -> Option<(ContentType, String)> {
    match import_expenses_from_uploaded_statement(db, account_id, form).await {
        Ok(_) => ok_empty(),
        Err(_) => None,
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
) -> Option<(ContentType, String)> {
    match update_expense_budget_item_id(&db, expense_id, request.budget_item_id).await {
        Ok(_) => ok_empty(),
        Err(_) => None,
    }
}
