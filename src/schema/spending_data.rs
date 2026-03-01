use serde::Serialize;
use sqlx::FromRow;
use ts_rs::TS;

use crate::database::{Database, ID};

#[derive(Debug, FromRow, Serialize, TS)]
#[ts(export_to = "SpendingData.ts")]
pub struct SpendingDataPoint {
    pub budget_item_id: Option<ID>,
    pub month: String,
    pub amount: f64,
}

impl SpendingDataPoint {
    pub async fn fetch_by_year(db: &Database, year: i32) -> anyhow::Result<Vec<SpendingDataPoint>> {
        let mut conn = db.acquire_db_conn().await?;
        let results = sqlx::query_as::<_, SpendingDataPoint>(
            "SELECT
          budget_item_id,
          SUBSTR(transaction_date, 1, 7) AS `month`,
          sum(amount) as `amount`
        FROM expenses
        WHERE
          SUBSTR(transaction_date, 1, 4) = ?1
        GROUP BY
          budget_item_id,
          SUBSTR(transaction_date, 1, 7)",
        )
        .bind(year.to_string())
        .fetch_all(&mut *conn)
        .await?;

        Ok(results)
    }
}
