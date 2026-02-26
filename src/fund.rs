use serde::{Deserialize, Serialize};
use sqlx::{Acquire, FromRow};
use ts_rs::TS;

use crate::database::{Database, ID};

#[derive(Debug, FromRow, Deserialize, Serialize, TS)]
#[ts(export_to = "Fund.ts")]
pub struct BudgetFund {
    pub id: ID,
    pub name: String,
}

impl BudgetFund {
    pub async fn create(db: &Database, name: &str) -> anyhow::Result<ID> {
        let mut conn = db.acquire_db_conn().await?;
        let id: ID = sqlx::query_scalar!(
            "INSERT INTO budget_funds (name) VALUES (?1) RETURNING id",
            name,
        )
        .fetch_one(&mut *conn)
        .await?
        .try_into()
        .unwrap();

        Ok(id)
    }

    pub async fn fetch_all(db: &Database) -> anyhow::Result<Vec<BudgetFund>> {
        let mut conn = db.acquire_db_conn().await?;

        let results = sqlx::query_as::<_, BudgetFund>("SELECT * FROM budget_funds ORDER BY name")
            .fetch_all(&mut *conn)
            .await?;

        Ok(results)
    }
}
