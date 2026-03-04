use serde::{Deserialize, Serialize};
use sqlx::FromRow;
use ts_rs::TS;

use crate::database::{Database, ID};

type CentAmount = i32;

#[derive(Debug, Deserialize, Serialize, TS)]
#[serde(tag = "variant", content = "amount")]
#[ts(export_to = "Budget.ts", tag = "variant", content = "amount")]
pub enum BudgetAllowance {
    Weekly(CentAmount),
    Monthly(CentAmount),
    Yearly(CentAmount),
}

#[derive(Debug, FromRow, Deserialize, Serialize, TS)]
#[ts(export_to = "Budget.ts")]
pub struct BudgetItemFields {
    pub category_id: ID,
    pub fund_id: Option<ID>,
    pub name: String,
    pub allowance: Option<BudgetAllowance>,
    pub budget_only: bool,
}

#[derive(Debug, FromRow, Deserialize, Serialize, TS)]
#[ts(export_to = "Budget.ts")]
pub struct BudgetItem {
    pub id: ID,
    pub ignored: bool,        // computed, inherited from Category
    pub display_name: String, // computed, {category_name} :: {name}

    #[serde(flatten)]
    #[sqlx(flatten)]
    #[ts(flatten)]
    pub fields: BudgetItemFields,
}

#[derive(Debug, FromRow, Deserialize, Serialize, TS)]
#[ts(export_to = "Budget.ts")]
pub struct BudgetItemWithSpend {
    pub year: i32, // computed, inherited from Category
    pub spend: CentAmount,

    #[serde(flatten)]
    #[sqlx(flatten)]
    #[ts(flatten)]
    pub item: BudgetItem,
}

impl BudgetItem {
    pub async fn create(db: &Database, fields: BudgetItemFields) -> anyhow::Result<ID> {
        let mut conn = db.acquire_db_conn().await?;

        let id: ID = sqlx::query_scalar!(
            "INSERT INTO budget_items (
              category_id,
              fund_id,
              name,
              allowance,
              budget_only
            ) VALUES (?1, ?2, ?3, ?4, ?5) RETURNING id",
            fields.category_id,
            fields.fund_id,
            fields.name,
            fields.allowance,
            fields.budget_only,
        )
        .fetch_one(&mut *conn)
        .await?
        .expect("INSERT failed, likely FOREIGN KEY constraint")
        .try_into()
        .unwrap();

        Ok(id)
    }

    pub async fn update(db: &Database, id: ID, fields: BudgetItemFields) -> anyhow::Result<()> {
        let mut conn = db.acquire_db_conn().await?;

        sqlx::query!(
            "UPDATE budget_items SET
                category_id = ?1,
                fund_id = ?2,
                name = ?3,
                allowance = ?4,
                budget_only = ?5
            WHERE id = ?6",
            fields.category_id,
            fields.fund_id,
            fields.name,
            fields.allowance,
            fields.budget_only,
            id,
        )
        .execute(&mut *conn)
        .await?;

        Ok(())
    }

    pub async fn delete(db: &Database, id: ID) -> anyhow::Result<()> {
        let mut conn = db.acquire_db_conn().await?;
        sqlx::query!("DELETE FROM budget_items WHERE id = ?1", id,)
            .execute(&mut *conn)
            .await?;

        Ok(())
    }

    pub async fn fetch_by_year(db: &Database, year: i32) -> anyhow::Result<Vec<BudgetItem>> {
        let mut conn = db.acquire_db_conn().await?;
        let results = sqlx::query_as::<_, BudgetItem>(
            "SELECT * FROM view_budget_items
            WHERE year = ?1
            ORDER BY category_id, name",
        )
        .bind(year)
        .fetch_all(&mut *conn)
        .await?;

        Ok(results)
    }

    pub async fn fetch_all_fund_items(db: &Database) -> anyhow::Result<Vec<BudgetItemWithSpend>> {
        let mut conn = db.acquire_db_conn().await?;
        let result = sqlx::query_as::<_, BudgetItemWithSpend>(
            "SELECT
              items.*,
              SUM(expenses.amount) AS spend
            FROM view_budget_items items
            LEFT JOIN expenses
              ON (items.id = expenses.budget_item_id)
            WHERE fund_id IS NOT NULL
            GROUP BY items.id",
        )
        .fetch_all(&mut *conn)
        .await?;

        Ok(result)
    }

    pub async fn any_has_category_id(db: &Database, id: ID) -> anyhow::Result<bool> {
        let mut conn = db.acquire_db_conn().await?;
        let result = sqlx::query_scalar!(
            "SELECT EXISTS (SELECT 1 FROM budget_items WHERE category_id = ?1)",
            id,
        )
        .fetch_one(&mut *conn)
        .await?;

        if result == 0 {
            return Ok(false);
        }

        Ok(true)
    }

    pub async fn any_has_fund_id(db: &Database, id: ID) -> anyhow::Result<bool> {
        let mut conn = db.acquire_db_conn().await?;
        let result = sqlx::query_scalar!(
            "SELECT EXISTS (SELECT 1 FROM budget_items WHERE fund_id = ?1)",
            id,
        )
        .fetch_one(&mut *conn)
        .await?;

        if result == 0 {
            return Ok(false);
        }

        Ok(true)
    }
}
