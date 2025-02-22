use rocket::http::ContentType;
use rocket::serde::json::Json;
use rocket::{get, post, State};
use serde::{Deserialize, Serialize};
use serde_json::to_string;
use ts_rs::TS;

use crate::account::Account;
use crate::budget::{Budget, BudgetItem};
use crate::database::{Database, ID};
use crate::expense::Expense;

fn to_json_string<T: Serialize + TS>(serializable: &T) -> Option<(ContentType, String)> {
    match to_string(&serializable) {
        Ok(json) => Some((ContentType::JSON, json)),
        Err(_) => None,
    }
}

fn result_to_json_string<T: Serialize + TS>(
    result: Result<T, anyhow::Error>,
) -> Option<(ContentType, String)> {
    match result {
        Ok(value) => to_json_string(&value),
        Err(_) => None,
    }
}

fn ok() -> Option<(ContentType, String)> {
    Some((ContentType::JSON, String::from("{}")))
}

#[get("/budget")]
pub async fn get_budget(db: &State<Database>) -> Option<(ContentType, String)> {
    let result = Budget::fetch(&db).await;

    result_to_json_string(result)
}

#[get("/accounts")]
pub async fn get_accounts(db: &State<Database>) -> Option<(ContentType, String)> {
    let result = Account::fetch_all(&db).await;

    result_to_json_string(result)
}

#[get("/accounts/<account_id>/expenses")]
pub async fn get_expenses(db: &State<Database>, account_id: i32) -> Option<(ContentType, String)> {
    let result = Expense::fetch_by_account_id(&db, account_id).await;

    result_to_json_string(result)
}

#[derive(Deserialize, Debug)]
pub struct UpdateExpenseRequest {
    budget_item_id: ID,
}

async fn update_expense_budget_item_id(
    db: &Database,
    expense_id: i32,
    budget_item_id: ID,
) -> anyhow::Result<()> {
    // validate that budget_item_id exists, if it's not None
    match budget_item_id {
        Some(id) => {
            BudgetItem::fetch_by_id(&db, id).await?;
        }
        None => {}
    };
    let mut expense = Expense::fetch_by_id(&db, expense_id).await?;
    expense.set_budget_item(&db, budget_item_id).await?;

    Ok(())
}

#[post("/expenses/<expense_id>", format = "json", data = "<request>")]
pub async fn update_expense(
    db: &State<Database>,
    expense_id: i32,
    request: Json<UpdateExpenseRequest>,
) -> Option<(ContentType, String)> {
    match update_expense_budget_item_id(&db, expense_id, request.budget_item_id).await {
        Ok(_) => ok(),
        Err(_) => None,
    }
}
