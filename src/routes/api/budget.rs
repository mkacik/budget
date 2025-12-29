use rocket::serde::json::Json;
use rocket::{get, post, State};
use serde::{Deserialize, Serialize};
use ts_rs::TS;

use crate::budget::Budget;
use crate::database::Database;
use crate::routes::common::{serialize_result, ApiResponse};
use crate::spending::SpendingData;

#[get("/budget/<year>")]
pub async fn get_budget(db: &State<Database>, year: i32) -> ApiResponse {
    let result = Budget::fetch(&db, year).await;

    match serialize_result(result) {
        Ok(value) => ApiResponse::SuccessWithData { data: value },
        Err(_) => ApiResponse::ServerError,
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
        Ok(_) => ApiResponse::Success,
        Err(e) => ApiResponse::BadRequest {
            message: format!("{}", e),
        },
    }
}

#[get("/spending/<year>")]
pub async fn get_spending(db: &State<Database>, year: i32) -> ApiResponse {
    let result = SpendingData::fetch(&db, year).await;

    match serialize_result(result) {
        Ok(value) => ApiResponse::SuccessWithData { data: value },
        Err(_) => ApiResponse::ServerError,
    }
}
