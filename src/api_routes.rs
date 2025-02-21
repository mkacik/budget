use rocket::http::ContentType;
use rocket::{get, State};
use serde::Serialize;
use serde_json::to_string;
use ts_rs::TS;

use crate::account::Account;
use crate::budget::Budget;
use crate::database::Database;
use crate::expense::Expense;

fn to_json_string<T: Serialize + TS>(serializable: &T) -> Option<(ContentType, String)> {
    match to_string(&serializable) {
        Ok(json) => Some((ContentType::JSON, json)),
        Err(_) => None,
    }
}

#[get("/budget")]
pub async fn get_budget(db: &State<Database>) -> Option<(ContentType, String)> {
    let budget = match Budget::fetch(&db).await {
        Ok(value) => value,
        Err(_) => return None,
    };

    to_json_string(&budget)
}

#[get("/accounts")]
pub async fn get_accounts(db: &State<Database>) -> Option<(ContentType, String)> {
    let accounts = match Account::fetch_all(&db).await {
        Ok(value) => value,
        Err(_) => return None,
    };

    to_json_string(&accounts)
}

#[get("/expenses/<account_id>")]
pub async fn get_expenses(db: &State<Database>, account_id: i32) -> Option<(ContentType, String)> {
    let expenses = match Expense::fetch_by_account_id(&db, account_id).await {
        Ok(value) => value,
        Err(_) => return None,
    };

    to_json_string(&expenses)
}
