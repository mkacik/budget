use rocket::serde::json::Json;
use rocket::{delete, get, post, State};

use crate::database::{Database, ID};
use crate::guards::write_log::WriteLogEntry;
use crate::routes::response::ApiResponse;
use crate::schema::account::{Account, AccountFields};
use crate::schema::expense::Expense;

#[get("/accounts")]
pub async fn get_accounts(db: &State<Database>) -> ApiResponse {
    match Account::fetch_all(&db).await {
        Ok(value) => ApiResponse::data(value),
        Err(e) => ApiResponse::error(e),
    }
}

#[post("/accounts", format = "json", data = "<request>")]
pub async fn add_account(
    db: &State<Database>,
    log_entry: &WriteLogEntry,
    request: Json<AccountFields>,
) -> ApiResponse {
    let fields = request.into_inner();
    log_entry.set_content(&fields);

    match Account::create(&db, fields).await {
        Ok(_) => ApiResponse::ok(),
        Err(e) => ApiResponse::error(e),
    }
}

#[post("/accounts/<account_id>", format = "json", data = "<request>")]
pub async fn update_account(
    db: &State<Database>,
    log_entry: &WriteLogEntry,
    account_id: ID,
    request: Json<Account>,
) -> ApiResponse {
    let account = request.into_inner();
    log_entry.set_content(&account);

    if account_id != account.id {
        return ApiResponse::bad("IDs for update don't match");
    }

    match account.update(&db).await {
        Ok(_) => ApiResponse::ok(),
        Err(e) => ApiResponse::error(e),
    }
}

#[delete("/accounts/<account_id>")]
pub async fn delete_account(
    db: &State<Database>,
    _log_entry: &WriteLogEntry,
    account_id: ID,
) -> ApiResponse {
    match Expense::any_has_account_id(db, account_id).await {
        Ok(false) => (),
        Ok(true) => {
            let message = "Can't delete account that has expenses attached.";
            return ApiResponse::bad(message);
        }
        Err(e) => return ApiResponse::error(e),
    };

    match Account::delete_by_id(db, account_id).await {
        Ok(_) => ApiResponse::ok(),
        Err(e) => ApiResponse::error(e),
    }
}
