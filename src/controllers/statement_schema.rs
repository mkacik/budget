use rocket::serde::json::Json;
use rocket::{delete, get, post, State};

use crate::database::{Database, ID};
use crate::guards::write_log::WriteLogEntry;
use crate::response::ApiResponse;
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
pub async fn create_schema(
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

#[put("/schemas/<id>", format = "json", data = "<request>")]
pub async fn update_schema(
    db: &State<Database>,
    log_entry: &WriteLogEntry,
    id: ID,
    request: Json<StatementSchemaFields>,
) -> ApiResponse {
    let fields = request.into_inner();
    log_entry.set_content(&fields);

    match StatementSchema::update(&db, id, fields).await {
        Ok(_) => ApiResponse::ok(),
        Err(e) => ApiResponse::error(e),
    }
}

#[delete("/schemas/<id>")]
pub async fn delete_schema(
    db: &State<Database>,
    _log_entry: &WriteLogEntry,
    id: ID,
) -> ApiResponse {
    match Account::any_has_statement_schema_id(db, id).await {
        Ok(false) => (),
        Ok(true) => return ApiResponse::bad("Can't delete schema attached to an account."),
        Err(e) => return ApiResponse::error(e),
    };

    match StatementSchema::delete(db, id).await {
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
