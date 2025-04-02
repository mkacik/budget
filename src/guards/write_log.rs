use rocket::http::Status;
use rocket::request::{FromRequest, Outcome, Request};
use rocket::State;
use serde::Serialize;
use std::sync::Mutex;
use std::time::{SystemTime, UNIX_EPOCH};

use crate::database::{Database, ID};
use crate::guards::user::User;

/*
pub struct WriteLogEntry {
  id: ID,
  uri: String,
  method: String,
  username: String,
  content: Option<String>,
  status: Option<String>,
  start_ts: i64,
  end_ts: Option<i64>,
}
*/

#[derive(Debug)]
pub struct WriteLogEntry {
    pub id: ID,
    pub content: Mutex<Option<String>>,
}

impl WriteLogEntry {
    pub fn set_content<T: Serialize>(&self, content: T) {
        let value = serde_json::to_string(&content).unwrap();
        let mut lock = self.content.lock().unwrap();
        *lock = Some(value);
    }

    pub async fn create(
        db: &Database,
        username: &str,
        request: &Request<'_>,
    ) -> anyhow::Result<WriteLogEntry> {
        let ts = now();
        let uri = format!("{}", serde_json::to_string(request.uri()).unwrap());
        let method = format!("{}", request.method());

        let mut conn = db.acquire_db_conn().await?;
        let id: ID = sqlx::query_scalar!(
            "INSERT INTO write_log (
              uri,
              method,
              username,
              start_ts
            ) VALUES (?1, ?2, ?3, ?4) RETURNING id",
            uri,
            method,
            username,
            ts,
        )
        .fetch_one(&mut *conn)
        .await?
        .try_into()
        .unwrap();

        Ok(WriteLogEntry {
            id: id,
            content: Mutex::new(None),
        })
    }

    pub async fn log_result(&self, db: &Database, status: &str) -> anyhow::Result<()> {
        let ts = now();

        let content = (*self.content.lock().unwrap()).clone();
        let mut conn = db.acquire_db_conn().await?;
        sqlx::query!(
            "UPDATE write_log SET
              content = ?2, 
              status = ?3,
              end_ts = ?4
            WHERE id = ?1",
            self.id,
            content,
            status,
            ts,
        )
        .execute(&mut *conn)
        .await?;

        Ok(())
    }
}

#[rocket::async_trait]
impl<'r> FromRequest<'r> for &'r WriteLogEntry {
    type Error = std::convert::Infallible;

    async fn from_request(request: &'r Request<'_>) -> Outcome<Self, Self::Error> {
        let entry = request
            .local_cache_async(async {
                let user = match request.guard::<&User>().await {
                    Outcome::Success(value) => value,
                    _ => return Err(()),
                };

                let db = match request.guard::<&State<Database>>().await {
                    Outcome::Success(value) => value,
                    _ => return Err(()),
                };

                match WriteLogEntry::create(db, &user.username, &request).await {
                    Ok(value) => Ok(value),
                    _ => Err(()),
                }
            })
            .await;

        match entry {
            Ok(value) => Outcome::Success(value),
            _ => Outcome::Forward(Status::NotFound),
        }
    }
}

fn now() -> i64 {
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap()
        .as_millis()
        .try_into()
        .unwrap()
}
