use rocket::{get, State};

use crate::budget::Budget;
use crate::database::Database;
use crate::routes::common::{serialize_result, ApiResponse};

#[get("/budget")]
pub async fn get_budget(db: &State<Database>) -> ApiResponse {
    let result = Budget::fetch(&db).await;

    match serialize_result(result) {
        Ok(value) => ApiResponse::SuccessWithData { data: value },
        Err(_) => ApiResponse::ServerError,
    }
}
