use rocket::serde::json::Json;
use rocket::{delete, get, post, State};

use crate::database::{Database, ID};
use crate::guards::write_log::WriteLogEntry;
use crate::routes::response::ApiResponse;
use crate::schema::account::Account;
use crate::schema::statement_schema::{StatementSchema, StatementSchemaFields};
use crate::schema::statement_schema_test::TestSchemaRequest;

#[get("/schemas")]
pub async fn get_schemas(db: &State<Database>) -> ApiResponse {
    match StatementSchema::fetch_all(&db).await {
        Ok(value) => ApiResponse::data(value),
        Err(e) => ApiResponse::error(e),
    }
}

#[post("/schemas", format = "json", data = "<request>")]
pub async fn add_schema(
    db: &State<Database>,
    log_entry: &WriteLogEntry,
    request: Json<StatementSchemaFields>,
) -> ApiResponse {
    let fields = request.into_inner();
    log_entry.set_content(&fields);

    match StatementSchema::create(&db, fields).await {
        Ok(_) => ApiResponse::ok(),
        Err(e) => ApiResponse::error(e),
    }
}

#[post("/schemas/<schema_id>", format = "json", data = "<request>")]
pub async fn update_schema(
    db: &State<Database>,
    log_entry: &WriteLogEntry,
    schema_id: ID,
    request: Json<StatementSchema>,
) -> ApiResponse {
    let schema = request.into_inner();
    log_entry.set_content(&schema);

    if schema_id != schema.id {
        return ApiResponse::bad("IDs for update don't match");
    }

    match schema.update(&db).await {
        Ok(_) => ApiResponse::ok(),
        Err(e) => ApiResponse::error(e),
    }
}

#[delete("/schemas/<schema_id>", rank = 2)]
pub async fn delete_schema(
    db: &State<Database>,
    _log_entry: &WriteLogEntry,
    schema_id: ID,
) -> ApiResponse {
    let accounts = match Account::fetch_by_schema_id(db, schema_id).await {
        Ok(value) => value,
        Err(e) => return ApiResponse::error(e),
    };
    if accounts.accounts.len() > 0 {
        return ApiResponse::bad("Can't delete schema attached to an account.");
    }

    match StatementSchema::delete_by_id(db, schema_id).await {
        Ok(_) => ApiResponse::ok(),
        Err(e) => ApiResponse::error(e),
    }
}

#[post("/schemas/test", format = "json", data = "<request>")]
pub async fn test_schema(request: Json<TestSchemaRequest>) -> ApiResponse {
    let test_schema_request = request.into_inner();
    let test_schema_response = test_schema_request.process();

    ApiResponse::data(test_schema_response)
}
