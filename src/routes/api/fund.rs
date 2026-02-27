use rocket::serde::json::Json;
use rocket::{delete, post, put, State};
use serde::Serialize;
use ts_rs::TS;

use crate::database::{Database, ID};
use crate::guards::write_log::WriteLogEntry;
use crate::routes::common::ApiResponse;
use crate::schema::budget_item::BudgetItem;
use crate::schema::fund::{BudgetFund, BudgetFundFields};

#[derive(Debug, Serialize, TS)]
#[ts(export_to = "Fund.ts")]
pub struct GetAllFundsResponse {
    funds: Vec<BudgetFund>,
    items: Vec<BudgetItem>,
    // TODO: spending for all fund items
}

#[get("/funds")]
pub async fn get_funds(db: &State<Database>) -> ApiResponse {
    let funds = match BudgetFund::fetch_all(db).await {
        Ok(result) => result,
        Err(e) => return ApiResponse::from_error(e),
    };

    let items = match BudgetItem::fetch_all_with_fund_id(db).await {
        Ok(result) => result,
        Err(e) => return ApiResponse::from_error(e),
    };

    let result = GetAllFundsResponse {
        funds: funds,
        items: items,
    };

    ApiResponse::from_object(result)
}

#[post("/funds", format = "json", data = "<request>")]
pub async fn create_fund(
    db: &State<Database>,
    log_entry: &WriteLogEntry,
    request: Json<BudgetFundFields>,
) -> ApiResponse {
    let fields = request.into_inner();
    log_entry.set_content(&fields);

    match BudgetFund::create(&db, fields).await {
        Ok(_) => ApiResponse::Success,
        Err(e) => ApiResponse::from_error(e),
    }
}

#[put("/funds/<id>", format = "json", data = "<request>")]
pub async fn update_fund(
    db: &State<Database>,
    log_entry: &WriteLogEntry,
    id: ID,
    request: Json<BudgetFundFields>,
) -> ApiResponse {
    let fields = request.into_inner();
    log_entry.set_content(&fields);

    match BudgetFund::update(&db, id, fields).await {
        Ok(_) => ApiResponse::Success,
        Err(e) => ApiResponse::from_error(e),
    }
}

#[delete("/funds/<id>")]
pub async fn delete_fund(db: &State<Database>, _log_entry: &WriteLogEntry, id: ID) -> ApiResponse {
    match BudgetFund::has_items(db, id).await {
        Ok(true) => {
            let message = "Can't delete fund that has items attached.";
            return ApiResponse::BadRequest {
                message: message.to_string(),
            };
        }
        Ok(false) => (),
        Err(e) => return ApiResponse::from_error(e),
    };

    match BudgetFund::delete(db, id).await {
        Ok(_) => ApiResponse::Success,
        Err(e) => ApiResponse::from_error(e),
    }
}
