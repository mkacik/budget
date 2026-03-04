use rocket::form::{Form, FromForm};
use rocket::fs::TempFile;
use rocket::{post, State};
use tokio::fs::remove_file;

use crate::database::{Database, ID};
use crate::guards::write_log::WriteLogEntry;
use crate::import::{read_expenses, save_expenses, STATEMENT_UPLOAD_PATH};
use crate::routes::response::ApiResponse;

use crate::schema::account::Account;
use crate::schema::statement_schema::StatementSchema;

#[derive(FromForm)]
pub struct UploadStatementForm<'f> {
    account_id: ID,
    file: TempFile<'f>,
}

#[post("/expenses/import", data = "<form>")]
pub async fn import_expenses(
    db: &State<Database>,
    log_entry: &WriteLogEntry,
    mut form: Form<UploadStatementForm<'_>>,
) -> ApiResponse {
    log_entry.set_content(format!("File of length {}", form.file.len()));

    if form.file.len() == 0 {
        return ApiResponse::bad("Can't process empty file.");
    }

    let account_id = form.account_id;
    let account = match Account::fetch_by_id(db, account_id).await {
        Ok(value) => value,
        Err(_) => {
            let message = format!("Account with id {} could not be found.", account_id);
            return ApiResponse::bad(&message);
        }
    };

    let statement_schema_id = match account.fields.statement_schema_id {
        Some(value) => value,
        None => {
            let message = format!(
                "Account '{}' does not have import schema attached.",
                account.fields.name
            );
            return ApiResponse::bad(&message);
        }
    };

    let statement_schema = match StatementSchema::fetch_by_id(&db, statement_schema_id).await {
        Ok(value) => value,
        Err(_) => {
            let message = format!("StatementSchema with id {} could not be found.", account_id);
            return ApiResponse::bad(&message);
        }
    };

    if let Err(e) = form.file.persist_to(STATEMENT_UPLOAD_PATH).await {
        // std::io::Error -> anyhow::Error
        return ApiResponse::error(anyhow::anyhow!(e));
    };

    let expenses_or_import_error = read_expenses(
        account_id,
        String::from(STATEMENT_UPLOAD_PATH),
        &statement_schema.fields.record_mapping,
    )
    .await;

    // clean up the temp file before return, regardless of whether import succeeded
    let _ = remove_file(STATEMENT_UPLOAD_PATH).await;

    // ImportError is always user error and contains a message to display in UI
    let expenses = match expenses_or_import_error {
        Ok(value) => value,
        Err(e) => return ApiResponse::bad(&e.message),
    };

    match save_expenses(account_id, expenses, &db).await {
        Ok(_) => ApiResponse::ok(),
        Err(e) => ApiResponse::error(e),
    }
}
