use serde::{Deserialize, Serialize};
use sqlx::FromRow;
use ts_rs::TS;

use crate::database::Database;
use crate::record_mapping::RecordMapping;

type ID = i32;

#[derive(Debug, FromRow, Deserialize, TS)]
#[ts(export_to = "StatementImportConfig.ts")]
pub struct StatementImportConfigFields {
    pub name: String,
    pub record_mapping: RecordMapping,
}

#[derive(Debug, FromRow, Deserialize, TS)]
#[ts(export_to = "StatementImportConfig.ts")]
pub struct StatementImportConfig {
    pub id: ID,
    #[serde(flatten)]
    #[sqlx(flatten)]
    #[ts(flatten)]
    pub fields: StatementImportConfigFields,
}

impl StatementImportConfig {
    pub async fn create(
        db: &Database,
        fields: StatementImportConfigFields,
    ) -> anyhow::Result<StatementImportConfig> {
        let mut conn = db.acquire_db_conn().await?;
        let id: i32 = sqlx::query_scalar!(
            "INSERT INTO statement_import_configs (name, record_mapping)
            VALUES (?1, ?2) RETURNING id",
            fields.name,
            fields.record_mapping,
        )
        .fetch_one(&mut *conn)
        .await?
        .try_into()
        .unwrap();

        StatementImportConfig::fetch_by_id(db, id).await
    }

    pub async fn fetch_all(db: &Database) -> anyhow::Result<Vec<StatementImportConfig>> {
        let mut conn = db.acquire_db_conn().await?;
        let results = sqlx::query_as::<_, StatementImportConfig>(
            "SELECT id, name, record_mapping FROM statement_import_configs ORDER BY name",
        )
        .fetch_all(&mut *conn)
        .await?;

        Ok(results)
    }

    pub async fn fetch_by_id(db: &Database, id: ID) -> anyhow::Result<StatementImportConfig> {
        let mut conn = db.acquire_db_conn().await?;
        let result = sqlx::query_as::<_, StatementImportConfig>(
            "SELECT id, name, record_mapping FROM statement_import_configs WHERE id = ?1",
        )
        .bind(id)
        .fetch_one(&mut *conn)
        .await?;

        Ok(result)
    }
}
