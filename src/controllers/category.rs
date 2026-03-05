use rocket::serde::json::Json;
use rocket::{delete, post, put, State};

use crate::database::{Database, ID};
use crate::guards::write_log::WriteLogEntry;
use crate::response::ApiResponse;
use crate::schema::category::{BudgetCategory, BudgetCategoryFields};
use crate::schema::item::BudgetItem;

#[post("/budget_categories/<year>", format = "json", data = "<request>")]
pub async fn create_budget_category(
    db: &State<Database>,
    log_entry: &WriteLogEntry,
    year: i32,
    request: Json<BudgetCategoryFields>,
) -> ApiResponse {
    let fields = request.into_inner();
    log_entry.set_content(&fields);

    match BudgetCategory::create(&db, year, fields).await {
        Ok(_) => ApiResponse::ok(),
        Err(e) => ApiResponse::error(e),
    }
}

#[put("/budget_categories/<id>", format = "json", data = "<request>")]
pub async fn update_budget_category(
    db: &State<Database>,
    log_entry: &WriteLogEntry,
    id: ID,
    request: Json<BudgetCategoryFields>,
) -> ApiResponse {
    let fields = request.into_inner();
    log_entry.set_content(&fields);

    match BudgetCategory::update(&db, id, fields).await {
        Ok(_) => ApiResponse::ok(),
        Err(e) => ApiResponse::error(e),
    }
}

#[delete("/budget_categories/<id>")]
pub async fn delete_budget_category(
    db: &State<Database>,
    _log_entry: &WriteLogEntry,
    id: ID,
) -> ApiResponse {
    match BudgetItem::any_has_category_id(db, id).await {
        Ok(false) => (),
        Ok(true) => return ApiResponse::bad("Can't delete category that has items attached."),
        Err(e) => return ApiResponse::error(e),
    };

    match BudgetCategory::delete(db, id).await {
        Ok(_) => ApiResponse::ok(),
        Err(e) => ApiResponse::error(e),
    }
}
