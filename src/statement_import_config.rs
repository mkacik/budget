use crate::database::{Database, ID};
use crate::record_mapping::RecordMapping;

#[derive(Debug, sqlx::FromRow)]
pub struct StatementImportConfig {
    pub id: ID,
    pub name: String,
    pub record_mapping: RecordMapping,
}

impl StatementImportConfig {
    pub async fn fetch_all(db: &Database) -> anyhow::Result<Vec<StatementImportConfig>> {
        let mut conn = db.acquire_db_conn().await?;
        let results = sqlx::query_as::<_, StatementImportConfig>(
            "SELECT id, name, record_mapping FROM statement_import_configs ORDER BY name",
        )
        .fetch_all(&mut *conn)
        .await?;

        Ok(results)
    }

    pub async fn fetch_by_id(
        db: &Database,
        id: ID,
    ) -> anyhow::Result<Option<StatementImportConfig>> {
        let id_value = match id {
            Some(value) => value,
            None => return Ok(None),
        };

        let mut conn = db.acquire_db_conn().await?;
        let result = sqlx::query_as::<_, StatementImportConfig>(
            "SELECT id, name, record_mapping FROM statement_import_configs WHERE id = ?1",
        )
        .bind(id_value)
        .fetch_optional(&mut *conn)
        .await?;

        Ok(result)
    }

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
