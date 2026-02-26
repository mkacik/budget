use rocket::serde::json::Json;
use rocket::{delete, post, put, State};

use crate::budget::{BudgetItem, BudgetItemFields};
use crate::database::{Database, ID};
use crate::guards::write_log::WriteLogEntry;
use crate::routes::common::ApiResponse;

#[post("/budget_items", format = "json", data = "<request>")]
pub async fn create_budget_item(
    db: &State<Database>,
    log_entry: &WriteLogEntry,
    request: Json<BudgetItemFields>,
) -> ApiResponse {
    let fields = request.into_inner();
    log_entry.set_content(&fields);

    match BudgetItem::create(db, fields).await {
        Ok(_) => ApiResponse::Success,
        Err(e) => ApiResponse::from_error(e),
    }
}

#[put("/budget_items/<id>", format = "json", data = "<request>")]
pub async fn update_budget_item(
    db: &State<Database>,
    log_entry: &WriteLogEntry,
    id: ID,
    request: Json<BudgetItemFields>,
) -> ApiResponse {
    let fields = request.into_inner();
    log_entry.set_content(&fields);

    if fields.budget_only {
        match BudgetItem::has_expenses(db, id).await {
            Ok(true) => {
                let message = "Can't make item budget-only, already has expenses attached";
                return ApiResponse::BadRequest {
                    message: message.to_string(),
                };
            }
            Ok(false) => (),
            Err(e) => return ApiResponse::from_error(e),
        };
    }

    match BudgetItem::update(db, id, fields).await {
        Ok(_) => ApiResponse::Success,
        Err(e) => ApiResponse::from_error(e),
    }
}

#[delete("/budget_items/<id>")]
pub async fn delete_budget_item(
    db: &State<Database>,
    _log_entry: &WriteLogEntry,
    id: ID,
) -> ApiResponse {
    match BudgetItem::has_expenses(db, id).await {
        Ok(true) => {
            let message = "Can't delete budget item attached to expenses.";
            return ApiResponse::BadRequest {
                message: message.to_string(),
            };
        }
        Ok(false) => (),
        Err(e) => return ApiResponse::from_error(e),
    };

    match BudgetItem::delete(db, id).await {
        Ok(_) => ApiResponse::Success,
        Err(e) => ApiResponse::from_error(e),
    }
}
