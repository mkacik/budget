use rocket::serde::json::Json;
use rocket::{delete, get, post, State};

use crate::database::{Database, ID};
use crate::guards::write_log::WriteLogEntry;
use crate::response::ApiResponse;
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
pub async fn create_account(
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

#[put("/accounts/<id>", format = "json", data = "<request>")]
pub async fn update_account(
    db: &State<Database>,
    log_entry: &WriteLogEntry,
    id: ID,
    request: Json<AccountFields>,
) -> ApiResponse {
    let fields = request.into_inner();
    log_entry.set_content(&fields);

    match Account::update(&db, id, fields).await {
        Ok(_) => ApiResponse::ok(),
        Err(e) => ApiResponse::error(e),
    }
}

#[delete("/accounts/<id>")]
pub async fn delete_account(
    db: &State<Database>,
    _log_entry: &WriteLogEntry,
    id: ID,
) -> ApiResponse {
    match Expense::any_has_account_id(db, id).await {
        Ok(false) => (),
        Ok(true) => {
            let message = "Can't delete account that has expenses attached.";
            return ApiResponse::bad(message);
        }
        Err(e) => return ApiResponse::error(e),
    };

    match Account::delete(db, id).await {
        Ok(_) => ApiResponse::ok(),
        Err(e) => ApiResponse::error(e),
    }
}
