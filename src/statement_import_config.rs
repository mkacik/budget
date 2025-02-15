use sqlx::sqlite::SqliteRow;
use sqlx::{FromRow, Row};

use crate::database::{get_column_decode_error, Database, ID};
use crate::import::RecordMapping;

pub struct StatementImportConfig {
    pub id: ID,
    pub name: String,
    // TODO: consider #[sqlx(flatten)] instead of serializing whole mapping, to make app upgrades
    // easier once I can't just wipe db during testing.
    pub record_mapping: RecordMapping,
}

impl FromRow<'_, SqliteRow> for StatementImportConfig {
    fn from_row(row: &SqliteRow) -> sqlx::Result<Self> {
        let id: ID = row.try_get("id")?;
        let name: String = row.try_get("name")?;
        let record_mapping_json_string = row.try_get("record_mapping")?;
        let record_mapping: RecordMapping = match serde_json::from_str(record_mapping_json_string) {
            Ok(value) => value,
            Err(_) => {
                let details = format!(
                    "Could not deserialize value into RecordMapping: {:?}",
                    record_mapping_json_string
                );
                let error = get_column_decode_error(String::from("record_mapping"), details);
                return Err(error);
            }
        };

        Ok(StatementImportConfig {
            id: id,
            name: name,
            record_mapping: record_mapping,
        })
    }
}

impl StatementImportConfig {
    pub async fn fetch_by_name(db: &Database, name: &str) -> anyhow::Result<StatementImportConfig> {
        let mut conn = db.acquire_db_conn().await?;
        let result = sqlx::query_as::<_, StatementImportConfig>(
            "SELECT id, name, record_mapping FROM statement_import_configs WHERE name = ?1",
        )
        .bind(name)
        .fetch_one(&mut *conn)
        .await?;

        Ok(result)
    }

    pub async fn save(&mut self, db: &Database) -> anyhow::Result<()> {
        match self.id {
            None => self.insert(db).await,
            _ => self.update(db).await,
        }
    }

    async fn insert(&mut self, db: &Database) -> anyhow::Result<()> {
        let mut conn = db.acquire_db_conn().await?;

        let record_mapping = serde_json::to_string(&self.record_mapping)?;
        let result = sqlx::query_scalar!(
            "INSERT INTO statement_import_configs (
        name,
        record_mapping
      ) VALUES (?1, ?2) RETURNING id",
            self.name,
            record_mapping,
        )
        .fetch_one(&mut *conn)
        .await?;
        let id: i32 = result.try_into().unwrap();
        self.id = Some(id);

        Ok(())
    }

    async fn update(&self, db: &Database) -> anyhow::Result<()> {
        let mut conn = db.acquire_db_conn().await?;

        let record_mapping = serde_json::to_string(&self.record_mapping)?;
        sqlx::query!(
            "UPDATE statement_import_configs SET
        name = ?2,
        record_mapping = ?3
      WHERE id = ?1",
            self.id,
            self.name,
            record_mapping,
        )
        .execute(&mut *conn)
        .await?;

        Ok(())
    }
}
