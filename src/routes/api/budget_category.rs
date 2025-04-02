use rocket::serde::json::Json;
use rocket::{delete, post, State};

use crate::budget::{BudgetCategory, BudgetCategoryFields, BudgetItem};
use crate::database::{Database, ID};
use crate::guards::write_log::WriteLogEntry;
use crate::routes::common::ApiResponse;

#[post("/budget_categories", format = "json", data = "<request>")]
pub async fn add_budget_category(
    db: &State<Database>,
    log_entry: &WriteLogEntry,
    request: Json<BudgetCategoryFields>,
) -> ApiResponse {
    let fields = request.into_inner();
    log_entry.set_content(&fields);

    match BudgetCategory::create(&db, fields).await {
        Ok(_) => ApiResponse::Success,
        Err(_) => ApiResponse::ServerError,
    }
}

#[post(
    "/budget_categories/<budget_category_id>",
    format = "json",
    data = "<request>"
)]
pub async fn update_budget_category(
    db: &State<Database>,
    log_entry: &WriteLogEntry,
    budget_category_id: ID,
    request: Json<BudgetCategory>,
) -> ApiResponse {
    let budget_category = request.into_inner();
    log_entry.set_content(&budget_category);

    if budget_category_id != budget_category.id {
        return ApiResponse::BadRequest {
            message: String::from("IDs for update don't match"),
        };
    }

    match budget_category.update(&db).await {
        Ok(_) => ApiResponse::Success,
        Err(_) => ApiResponse::ServerError,
    }
}

#[delete("/budget_categories/<budget_category_id>")]
pub async fn delete_budget_category(
    db: &State<Database>,
    _log_entry: &WriteLogEntry,
    budget_category_id: ID,
) -> ApiResponse {
    let delete_blocked = match BudgetItem::any_has_budget_category_id(db, budget_category_id).await
    {
        Ok(value) => value,
        Err(_) => return ApiResponse::ServerError,
    };
    if delete_blocked {
        return ApiResponse::BadRequest {
            message: String::from("Can't delete budget category that has items attached."),
        };
    }

    match BudgetCategory::delete_by_id(db, budget_category_id).await {
        Ok(_) => ApiResponse::Success,
        Err(_) => ApiResponse::ServerError,
    }
}
