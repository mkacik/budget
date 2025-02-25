use rocket::serde::json::Json;
use rocket::{delete, get, post, State};

use crate::account::{Account, AccountFields};
use crate::database::{Database, ID};
use crate::expense::Expense;
use crate::routes::common::{serialize_result, ApiResponse};

#[get("/accounts")]
pub async fn get_accounts(db: &State<Database>) -> ApiResponse {
    let result = Account::fetch_all(&db).await;

    match serialize_result(result) {
        Ok(value) => ApiResponse::SuccessWithData { data: value },
        Err(_) => ApiResponse::ServerError,
    }
}

#[post("/accounts", format = "json", data = "<request>")]
pub async fn add_account(db: &State<Database>, request: Json<AccountFields>) -> ApiResponse {
    let fields = request.into_inner();

    match Account::create(&db, fields).await {
        Ok(_) => ApiResponse::Success,
        Err(_) => ApiResponse::ServerError,
    }
}

#[post("/accounts/<account_id>", format = "json", data = "<request>")]
pub async fn update_account(
    db: &State<Database>,
    account_id: ID,
    request: Json<Account>,
) -> ApiResponse {
    let account = request.into_inner();
    if account_id != account.id {
        return ApiResponse::BadRequest {
            message: String::from("IDs for update don't match"),
        };
    }

    match account.update(&db).await {
        Ok(_) => ApiResponse::Success,
        Err(_) => ApiResponse::ServerError,
    }
}

#[delete("/accounts/<account_id>")]
pub async fn delete_account(db: &State<Database>, account_id: ID) -> ApiResponse {
    let expenses = match Expense::fetch_by_account_id(db, account_id).await {
        Ok(value) => value,
        Err(_) => return ApiResponse::ServerError,
    };
    if expenses.expenses.len() > 0 {
        return ApiResponse::BadRequest {
            message: String::from("Can't delete account that has expenses attached."),
        };
    }

    match Account::delete_by_id(db, account_id).await {
        Ok(_) => ApiResponse::Success,
        Err(_) => ApiResponse::ServerError,
    }
}
