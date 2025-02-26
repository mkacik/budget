use serde::{Deserialize, Serialize};
use sqlx::FromRow;
use ts_rs::TS;

use crate::database::{Database, ID};

// helper PRIVATE type to not have to fuck with changing all places that use f64.
type DollarAmount = f64;

#[derive(Debug, FromRow, Deserialize, Serialize, TS)]
#[ts(export_to = "Budget.ts")]
pub struct BudgetCategoryFields {
    pub name: String,
}

#[derive(Debug, FromRow, Deserialize, Serialize, TS)]
#[ts(export_to = "Budget.ts")]
pub struct BudgetCategory {
    pub id: ID,
    #[serde(flatten)]
    #[sqlx(flatten)]
    #[ts(flatten)]
    pub fields: BudgetCategoryFields,
}

#[derive(Debug, FromRow, Deserialize, Serialize, TS)]
#[ts(export_to = "Budget.ts")]
pub struct BudgetItemFields {
    pub category_id: ID,
    pub name: String,
    pub amount: BudgetAmount,
}

#[derive(Debug, FromRow, Deserialize, Serialize, TS)]
#[ts(export_to = "Budget.ts")]
pub struct BudgetItem {
    pub id: ID,
    #[serde(flatten)]
    #[sqlx(flatten)]
    #[ts(flatten)]
    pub fields: BudgetItemFields,
}

#[derive(Debug, Deserialize, Serialize, TS)]
#[ts(export_to = "Budget.ts")]
pub enum BudgetAmount {
    Weekly { amount: DollarAmount },
    Monthly { amount: DollarAmount },
    Yearly { amount: DollarAmount },
    EveryXYears { x: i32, amount: DollarAmount },
}

impl BudgetCategory {
    pub async fn create(db: &Database, fields: BudgetCategoryFields) -> anyhow::Result<ID> {
        let mut conn = db.acquire_db_conn().await?;

        let id: ID = sqlx::query_scalar!(
            "INSERT INTO budget_categories (name) VALUES (?1) RETURNING id",
            fields.name,
        )
        .fetch_one(&mut *conn)
        .await?
        .try_into()
        .unwrap();

        Ok(id)
    }

    pub async fn fetch_all(db: &Database) -> anyhow::Result<Vec<BudgetCategory>> {
        let mut conn = db.acquire_db_conn().await?;

        let results = sqlx::query_as::<_, BudgetCategory>(
            "SELECT id, name FROM budget_categories ORDER BY name",
        )
        .fetch_all(&mut *conn)
        .await?;

        Ok(results)
    }
}

impl BudgetItem {
    pub async fn create(db: &Database, fields: BudgetItemFields) -> anyhow::Result<ID> {
        let mut conn = db.acquire_db_conn().await?;
        let id: ID = sqlx::query_scalar!(
            "INSERT INTO budget_items (category_id, name, amount)
            VALUES (?1, ?2, ?3) RETURNING id",
            fields.category_id,
            fields.name,
            fields.amount,
        )
        .fetch_one(&mut *conn)
        .await?
        .try_into()
        .unwrap();

        Ok(id)
    }

    pub async fn fetch_all(db: &Database) -> anyhow::Result<Vec<BudgetItem>> {
        let mut conn = db.acquire_db_conn().await?;
        let results = sqlx::query_as::<_, BudgetItem>(
            "SELECT id, category_id, name, amount FROM budget_items ORDER BY category_id, name",
        )
        .fetch_all(&mut *conn)
        .await?;

        Ok(results)
    }

    pub async fn fetch_by_id(db: &Database, id: ID) -> anyhow::Result<BudgetItem> {
        let mut conn = db.acquire_db_conn().await?;
        let result = sqlx::query_as::<_, BudgetItem>(
            "SELECT id, category_id, name, amount FROM budget_items WHERE id = ?1",
        )
        .bind(id)
        .fetch_one(&mut *conn)
        .await?;

        Ok(result)
    }
}

#[derive(Debug, Serialize, TS)]
#[ts(export_to = "Budget.ts")]
pub struct Budget {
    pub categories: Vec<BudgetCategory>,
    pub items: Vec<BudgetItem>,
}

impl Budget {
    pub async fn fetch(db: &Database) -> anyhow::Result<Budget> {
        let categories = BudgetCategory::fetch_all(&db).await?;
        let items = BudgetItem::fetch_all(&db).await?;

        Ok(Budget {
            categories: categories,
            items: items,
        })
    }
}
