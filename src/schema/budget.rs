use serde::Serialize;
use sqlx::Acquire;
use ts_rs::TS;

use crate::database::Database;
use crate::schema::budget_category::BudgetCategory;
use crate::schema::budget_item::BudgetItem;

#[derive(Debug, Serialize, TS)]
#[ts(export_to = "Budget.ts")]
pub struct Budget {
    pub year: i32,
    pub categories: Vec<BudgetCategory>,
    pub items: Vec<BudgetItem>,
}

impl Budget {
    pub async fn fetch(db: &Database, year: i32) -> anyhow::Result<Budget> {
        let categories = BudgetCategory::fetch_by_year(&db, year).await?;
        let items = BudgetItem::fetch_by_year(&db, year).await?;

        Ok(Budget {
            year: year,
            categories: categories,
            items: items,
        })
    }

    pub async fn clone(db: &Database, from_year: i32, to_year: i32) -> anyhow::Result<()> {
        let mut conn = db.acquire_db_conn().await?;

        // Start the transaction on this specific connection
        // Note: This borrows the connection for the duration of the transaction
        let mut tx = conn.begin().await?;

        let categories = sqlx::query!(
            "SELECT id, name, ignored FROM budget_categories WHERE year = ?1",
            from_year
        )
        .fetch_all(&mut *tx)
        .await?;

        for cat in categories {
            let new_category_id = sqlx::query!(
                "INSERT INTO budget_categories (name, ignored, year)
                VALUES (?1, ?2, ?3) RETURNING id",
                cat.name,
                cat.ignored,
                to_year
            )
            .fetch_one(&mut *tx)
            .await?
            .id;

            sqlx::query!(
                "INSERT INTO budget_items (category_id, name, budget_only, allowance)
                SELECT ?1 as category_id, name, budget_only, allowance
                FROM budget_items WHERE category_id = ?2",
                new_category_id,
                cat.id
            )
            .execute(&mut *tx)
            .await?;
        }

        tx.commit().await?;

        Ok(())
    }
}
