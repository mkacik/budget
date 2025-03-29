use serde::Serialize;
use sqlx::FromRow;
use ts_rs::TS;

use crate::database::{Database, ID};

#[derive(Debug, FromRow, Serialize, TS)]
#[ts(export_to = "SpendingData.ts")]
pub struct SpendingDataPoint {
    pub budget_item_id: ID,
    pub month: String,
    pub amount: f64,
}

#[derive(Debug, Serialize, TS)]
#[ts(export_to = "SpendingData.ts")]
pub struct SpendingData {
    pub data: Vec<SpendingDataPoint>,
}

pub async fn get_spending_data(db: &Database) -> anyhow::Result<SpendingData> {
    let mut conn = db.acquire_db_conn().await?;
    let results = sqlx::query_as::<_, SpendingDataPoint>(
        "SELECT
        budget_item_id,
        SUBSTR(transaction_date, 1, 7) AS `month`,
        sum(amount) as `amount`
      FROM expenses
      WHERE budget_item_id IS NOT NULL
      AND SUBSTR(transaction_date, 1, 4) = '2025'
      GROUP BY
        budget_item_id,
        SUBSTR(transaction_date, 1, 7)",
    )
    .fetch_all(&mut *conn)
    .await?;

    Ok(SpendingData { data: results })
}
