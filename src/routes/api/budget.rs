use rocket::serde::json::Json;
use rocket::{get, post, State};
use serde::{Deserialize, Serialize};
use ts_rs::TS;

use crate::database::Database;
use crate::routes::response::ApiResponse;
use crate::schema::budget::Budget;
use crate::schema::budget_item::{BudgetItem, BudgetItemWithSpend};
use crate::schema::spending_data::SpendingDataPoint;

#[get("/budget/<year>")]
pub async fn get_budget(db: &State<Database>, year: i32) -> ApiResponse {
    match Budget::fetch(&db, year).await {
        Ok(value) => ApiResponse::data(value),
        Err(e) => ApiResponse::error(e),
    }
}

#[derive(Debug, Deserialize, Serialize, TS)]
#[ts(export_to = "Budget.ts")]
pub struct BudgetCloneRequest {
    from_year: i32,
    to_year: i32,
}

#[post("/budget/clone", format = "json", data = "<json>")]
pub async fn clone_budget(db: &State<Database>, json: Json<BudgetCloneRequest>) -> ApiResponse {
    let request = json.into_inner();

    match Budget::clone(&db, request.from_year, request.to_year).await {
        Ok(_) => ApiResponse::ok(),
        Err(e) => ApiResponse::error(e),
    }
}

#[derive(Debug, Serialize, TS)]
#[ts(export_to = "SpendingData.ts")]
pub struct SpendingData {
    data: Vec<SpendingDataPoint>,
    fund_items: Vec<BudgetItemWithSpend>,
}

#[get("/spending/<year>")]
pub async fn get_spending(db: &State<Database>, year: i32) -> ApiResponse {
    let data = match SpendingDataPoint::fetch_by_year(&db, year).await {
        Ok(result) => result,
        Err(e) => return ApiResponse::error(e),
    };
    let fund_items = match BudgetItem::fetch_all_fund_items(db).await {
        Ok(result) => result,
        Err(e) => return ApiResponse::error(e),
    };

    let result = SpendingData {
        data: data,
        fund_items: fund_items,
    };

    ApiResponse::data(result)
}
