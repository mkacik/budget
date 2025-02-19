use rocket::http::ContentType;
use rocket::{get, State};
use serde_json::to_string as to_json_string;

use crate::budget::Budget;
use crate::database::Database;

#[get("/budget")]
pub async fn get_budget(db: &State<Database>) -> Option<(ContentType, String)> {
    let budget = match Budget::fetch(&db).await {
        Ok(value) => value,
        Err(_) => return None,
    };

    match to_json_string(&budget) {
        Ok(json) => Some((ContentType::JSON, json)),
        Err(_) => None,
    }
}
