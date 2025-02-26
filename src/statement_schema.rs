use serde::{Deserialize, Serialize};
use sqlx::FromRow;
use ts_rs::TS;

use crate::database::{Database, ID};
use crate::record_mapping::RecordMapping;

#[derive(Debug, FromRow, Serialize, Deserialize, TS)]
#[ts(export_to = "StatementSchema.ts")]
pub struct StatementSchemaFields {
    pub name: String,
    pub record_mapping: RecordMapping,
}

#[derive(Debug, FromRow, Serialize, Deserialize, TS)]
#[ts(export_to = "StatementSchema.ts")]
pub struct StatementSchema {
    pub id: ID,
    #[serde(flatten)]
    #[sqlx(flatten)]
    #[ts(flatten)]
    pub fields: StatementSchemaFields,
}

#[derive(Debug, Serialize, Deserialize, TS)]
#[ts(export_to = "StatementSchema.ts")]
pub struct StatementSchemas {
    pub schemas: Vec<StatementSchema>,
}

impl StatementSchema {
    pub async fn create(db: &Database, fields: StatementSchemaFields) -> anyhow::Result<ID> {
        let mut conn = db.acquire_db_conn().await?;
        let id: ID = sqlx::query_scalar!(
            "INSERT INTO statement_schemas (name, record_mapping)
            VALUES (?1, ?2) RETURNING id",
            fields.name,
            fields.record_mapping,
        )
        .fetch_one(&mut *conn)
        .await?
        .try_into()
        .unwrap();

        Ok(id)
    }

    pub async fn delete_by_id(db: &Database, id: ID) -> anyhow::Result<()> {
        let mut conn = db.acquire_db_conn().await?;
        sqlx::query!("DELETE FROM statement_schemas WHERE id = ?1", id,)
            .execute(&mut *conn)
            .await?;

        Ok(())
    }

    pub async fn fetch_all(db: &Database) -> anyhow::Result<StatementSchemas> {
        let mut conn = db.acquire_db_conn().await?;
        let results = sqlx::query_as::<_, StatementSchema>(
            "SELECT id, name, record_mapping FROM statement_schemas ORDER BY name",
        )
        .fetch_all(&mut *conn)
        .await?;

        Ok(StatementSchemas { schemas: results })
    }

    pub async fn fetch_by_id(db: &Database, id: ID) -> anyhow::Result<StatementSchema> {
        let mut conn = db.acquire_db_conn().await?;
        let result = sqlx::query_as::<_, StatementSchema>(
            "SELECT id, name, record_mapping FROM statement_schemas WHERE id = ?1",
        )
        .bind(id)
        .fetch_one(&mut *conn)
        .await?;

        Ok(result)
    }

    pub async fn update(&self, db: &Database) -> anyhow::Result<()> {
        let mut conn = db.acquire_db_conn().await?;

        sqlx::query!(
            "UPDATE statement_schemas SET
                name = ?2,
                record_mapping = ?3
            WHERE id = ?1",
            self.id,
            self.fields.name,
            self.fields.record_mapping,
        )
        .execute(&mut *conn)
        .await?;

        Ok(())
    }
}
