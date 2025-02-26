use rocket::serde::json::Json;
use rocket::{delete, get, post, State};

use crate::account::Account;
use crate::statement_schema::{StatementSchema, StatementSchemaFields};
use crate::database::{Database, ID};
use crate::routes::common::{serialize_result, ApiResponse};

#[get("/schemas")]
pub async fn get_schemas(db: &State<Database>) -> ApiResponse {
    let result = StatementSchema::fetch_all(&db).await;

    match serialize_result(result) {
        Ok(value) => ApiResponse::SuccessWithData { data: value },
        Err(_) => ApiResponse::ServerError,
    }
}

#[post("/schemas", format = "json", data = "<request>")]
pub async fn add_schema(
    db: &State<Database>,
    request: Json<StatementSchemaFields>,
) -> ApiResponse {
    let fields = request.into_inner();

    match StatementSchema::create(&db, fields).await {
        Ok(_) => ApiResponse::Success,
        Err(_) => ApiResponse::ServerError,
    }
}

#[post("/schemas/<schema_id>", format = "json", data = "<request>")]
pub async fn update_schema(
    db: &State<Database>,
    schema_id: ID,
    request: Json<StatementSchema>,
) -> ApiResponse {
    let schema = request.into_inner();
    if schema_id != schema.id {
        return ApiResponse::BadRequest {
            message: String::from("IDs for update don't match"),
        };
    }

    match schema.update(&db).await {
        Ok(_) => ApiResponse::Success,
        Err(_) => ApiResponse::ServerError,
    }
}

#[delete("/schemas/<schema_id>")]
pub async fn delete_schema(db: &State<Database>, schema_id: ID) -> ApiResponse {
    let accounts = match Account::fetch_by_schema_id(db, schema_id).await {
        Ok(value) => value,
        Err(_) => return ApiResponse::ServerError,
    };
    if accounts.accounts.len() > 0 {
        return ApiResponse::BadRequest {
            message: String::from("Can't delete schema attached to an account."),
        };
    }

    match StatementSchema::delete_by_id(db, schema_id).await {
        Ok(_) => ApiResponse::Success,
        Err(_) => ApiResponse::ServerError,
    }
}
