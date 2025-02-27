use rocket::serde::json::Json;
use rocket::{delete, post, State};

use crate::budget::{BudgetItem, BudgetItemFields};
use crate::database::{Database, ID};
use crate::expense::Expense;
use crate::routes::common::ApiResponse;

#[post("/budget_items", format = "json", data = "<request>")]
pub async fn add_budget_item(db: &State<Database>, request: Json<BudgetItemFields>) -> ApiResponse {
    let fields = request.into_inner();

    match BudgetItem::create(&db, fields).await {
        Ok(_) => ApiResponse::Success,
        Err(_) => ApiResponse::ServerError,
    }
}

#[post("/budget_items/<budget_item_id>", format = "json", data = "<request>")]
pub async fn update_budget_item(
    db: &State<Database>,
    budget_item_id: ID,
    request: Json<BudgetItem>,
) -> ApiResponse {
    let budget_item = request.into_inner();
    if budget_item_id != budget_item.id {
        return ApiResponse::BadRequest {
            message: String::from("IDs for update don't match"),
        };
    }

    match budget_item.update(&db).await {
        Ok(_) => ApiResponse::Success,
        Err(_) => ApiResponse::ServerError,
    }
}

#[delete("/budget_items/<budget_item_id>")]
pub async fn delete_budget_item(db: &State<Database>, budget_item_id: ID) -> ApiResponse {
    let delete_blocked = match Expense::any_has_budget_item_id(db, budget_item_id).await {
        Ok(value) => value,
        Err(_) => return ApiResponse::ServerError,
    };
    if delete_blocked {
        return ApiResponse::BadRequest {
            message: String::from("Can't delete budget item attached to expenses."),
        };
    }

    match BudgetItem::delete_by_id(db, budget_item_id).await {
        Ok(_) => ApiResponse::Success,
        Err(_) => ApiResponse::ServerError,
    }
}
