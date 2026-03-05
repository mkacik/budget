use rocket::serde::json::Json;
use rocket::{delete, post, put, State};
use serde::Serialize;
use ts_rs::TS;

use crate::database::{Database, ID};
use crate::guards::write_log::WriteLogEntry;
use crate::response::ApiResponse;
use crate::schema::budget_item::{BudgetItem, BudgetItemWithSpend};
use crate::schema::fund::{BudgetFund, BudgetFundFields};

#[derive(Debug, Serialize, TS)]
#[ts(export_to = "Fund.ts")]
pub struct Funds {
    funds: Vec<BudgetFund>,
}

#[derive(Debug, Serialize, TS)]
#[ts(export_to = "Fund.ts")]
pub struct FundItems {
    items: Vec<BudgetItemWithSpend>,
}

#[get("/funds")]
pub async fn get_funds(db: &State<Database>) -> ApiResponse {
    let funds = match BudgetFund::fetch_all(db).await {
        Ok(result) => result,
        Err(e) => return ApiResponse::error(e),
    };

    let result = Funds { funds: funds };

    ApiResponse::data(result)
}

#[get("/funds/items")]
pub async fn get_items(db: &State<Database>) -> ApiResponse {
    let items = match BudgetItem::fetch_all_fund_items(db).await {
        Ok(result) => result,
        Err(e) => return ApiResponse::error(e),
    };

    let result = FundItems { items: items };

    ApiResponse::data(result)
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
        Ok(_) => ApiResponse::ok(),
        Err(e) => ApiResponse::error(e),
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
        Ok(_) => ApiResponse::ok(),
        Err(e) => ApiResponse::error(e),
    }
}

#[delete("/funds/<id>")]
pub async fn delete_fund(db: &State<Database>, _log_entry: &WriteLogEntry, id: ID) -> ApiResponse {
    match BudgetItem::any_has_fund_id(db, id).await {
        Ok(false) => (),
        Ok(true) => return ApiResponse::bad("Can't delete fund that has items attached."),
        Err(e) => return ApiResponse::error(e),
    };

    match BudgetFund::delete(db, id).await {
        Ok(_) => ApiResponse::ok(),
        Err(e) => ApiResponse::error(e),
    }
}
