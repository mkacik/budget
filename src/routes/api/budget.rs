use rocket::{get, State};

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

#[get("/spending/<year>")]
pub async fn get_spending(db: &State<Database>, year: i32) -> ApiResponse {
    let result = SpendingData::fetch(&db, year).await;

    match serialize_result(result) {
        Ok(value) => ApiResponse::SuccessWithData { data: value },
        Err(_) => ApiResponse::ServerError,
    }
}
