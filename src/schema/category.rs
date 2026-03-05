use serde::{Deserialize, Serialize};
use sqlx::FromRow;
use ts_rs::TS;

use crate::common::TS_FILE;
use crate::database::{Database, ID};

#[derive(Debug, FromRow, Deserialize, Serialize, TS)]
#[ts(export_to = TS_FILE)]
pub struct BudgetCategoryFields {
    pub name: String,
    pub ignored: bool,
}

#[derive(Debug, FromRow, Deserialize, Serialize, TS)]
#[ts(export_to = TS_FILE)]
pub struct BudgetCategory {
    pub id: ID,
    pub year: i32, // immutable after creation

    #[serde(flatten)]
    #[sqlx(flatten)]
    #[ts(flatten)]
    pub fields: BudgetCategoryFields,
}

impl BudgetCategory {
    pub async fn create(
        db: &Database,
        year: i32,
        fields: BudgetCategoryFields,
    ) -> anyhow::Result<ID> {
        let mut conn = db.acquire_db_conn().await?;

        let id: ID = sqlx::query_scalar!(
            "INSERT INTO budget_categories (year, name, ignored) VALUES (?1, ?2, ?3) RETURNING id",
            year,
            fields.name,
            fields.ignored,
        )
        .fetch_one(&mut *conn)
        .await?
        .try_into()
        .unwrap();

        Ok(id)
    }

    pub async fn update(db: &Database, id: ID, fields: BudgetCategoryFields) -> anyhow::Result<()> {
        let mut conn = db.acquire_db_conn().await?;

        sqlx::query!(
            "UPDATE budget_categories SET name = ?1, ignored = ?2 WHERE id = ?3",
            fields.name,
            fields.ignored,
            id,
        )
        .execute(&mut *conn)
        .await?;

        Ok(())
    }

    pub async fn delete(db: &Database, id: ID) -> anyhow::Result<()> {
        let mut conn = db.acquire_db_conn().await?;
        sqlx::query!("DELETE FROM budget_categories WHERE id = ?1", id)
            .execute(&mut *conn)
            .await?;

        Ok(())
    }

    pub async fn fetch_by_year(db: &Database, year: i32) -> anyhow::Result<Vec<BudgetCategory>> {
        let mut conn = db.acquire_db_conn().await?;

        let results = sqlx::query_as::<_, BudgetCategory>(
            "SELECT * FROM budget_categories WHERE year = ?1 ORDER BY name",
        )
        .bind(year)
        .fetch_all(&mut *conn)
        .await?;

        Ok(results)
    }

    pub async fn any_has_year(db: &Database, year: i32) -> anyhow::Result<bool> {
        let mut conn = db.acquire_db_conn().await?;
        let result = sqlx::query_scalar!(
            "SELECT EXISTS (SELECT 1 FROM budget_categories WHERE year = ?1)",
            year,
        )
        .fetch_one(&mut *conn)
        .await?;

        if result == 0 {
            return Ok(false);
        }

        Ok(true)
    }
}
