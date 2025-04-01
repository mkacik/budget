use rocket::Request;
use std::time::{SystemTime, UNIX_EPOCH};

use crate::database::{Database, ID};

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

impl WriteLogEntry {
    pub fn set_content(&mut self, content: String) {
      self.content = Some(content);
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
            uri: uri,
            method: method,
            username: String::from(username),
            content: None,
            status: None,
            start_ts: ts,
            end_ts: None,
        })
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
