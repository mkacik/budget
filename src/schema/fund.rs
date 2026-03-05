use serde::{Deserialize, Serialize};
use sqlx::FromRow;
use ts_rs::TS;

use crate::common::TS_FILE;
use crate::database::{Database, ID};

#[derive(Debug, FromRow, Deserialize, Serialize, TS)]
#[ts(export_to = TS_FILE)]
pub struct FundFields {
    pub name: String,
}

#[derive(Debug, FromRow, Deserialize, Serialize, TS)]
#[ts(export_to = TS_FILE)]
pub struct Fund {
    pub id: ID,

    #[serde(flatten)]
    #[sqlx(flatten)]
    #[ts(flatten)]
    pub fields: FundFields,
}

impl Fund {
    pub async fn create(db: &Database, fields: FundFields) -> anyhow::Result<ID> {
        let mut conn = db.acquire_db_conn().await?;
        let id: ID = sqlx::query_scalar!(
            "INSERT INTO funds (name) VALUES (?1) RETURNING id",
            fields.name,
        )
        .fetch_one(&mut *conn)
        .await?
        .try_into()
        .unwrap();

        Ok(id)
    }

    pub async fn update(db: &Database, id: ID, fields: FundFields) -> anyhow::Result<()> {
        let mut conn = db.acquire_db_conn().await?;
        sqlx::query!("UPDATE funds SET name = ?1 WHERE id = ?2", fields.name, id,)
            .execute(&mut *conn)
            .await?;

        Ok(())
    }

    pub async fn delete(db: &Database, id: ID) -> anyhow::Result<()> {
        let mut conn = db.acquire_db_conn().await?;
        sqlx::query!("DELETE FROM funds WHERE id = ?1", id)
            .execute(&mut *conn)
            .await?;

        Ok(())
    }

    pub async fn fetch_all(db: &Database) -> anyhow::Result<Vec<Fund>> {
        let mut conn = db.acquire_db_conn().await?;
        let results = sqlx::query_as::<_, Fund>("SELECT * FROM funds ORDER BY name")
            .fetch_all(&mut *conn)
            .await?;

        Ok(results)
    }
}
