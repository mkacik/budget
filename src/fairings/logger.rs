use rocket::fairing::{Fairing, Info, Kind};
use rocket::{Request, Response, State};

use crate::database::Database;
use crate::guards::write_log::WriteLogEntry;

pub struct WriteLogger {}

#[rocket::async_trait]
impl Fairing for WriteLogger {
    fn info(&self) -> Info {
        Info {
            name: "WriteLogger: log writes",
            kind: Kind::Response,
        }
    }

    async fn on_response<'r>(&self, request: &'r Request<'_>, response: &mut Response<'r>) {
        let log_entry_result: &Result<WriteLogEntry, ()> = request.local_cache(|| Err(()));
        let log_entry = match log_entry_result {
            Ok(value) => value,
            Err(_) => return,
        };

        let db = request.guard::<&State<Database>>().await.unwrap();
        let status = response.status().code.to_string();
        if log_entry.log_result(&db, &status).await.is_err() {
            println!(
                "CRITICAL: DB update failed for [{:?}], status {}",
                log_entry, status
            );
        }
    }
}
