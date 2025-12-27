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
    pub ignored: bool,
    // do not allow mutations!
    pub year: i32,
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
    pub amount: Option<BudgetAmount>,
    pub budget_only: bool,
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
            "INSERT INTO budget_categories (year, name, ignored) VALUES (?1, ?2, ?3) RETURNING id",
            fields.year,
            fields.name,
            fields.ignored,
        )
        .fetch_one(&mut *conn)
        .await?
        .try_into()
        .unwrap();

        Ok(id)
    }

    pub async fn delete_by_id(db: &Database, id: ID) -> anyhow::Result<()> {
        let mut conn = db.acquire_db_conn().await?;
        sqlx::query!("DELETE FROM budget_categories WHERE id = ?1", id,)
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

    pub async fn update(&self, db: &Database) -> anyhow::Result<()> {
        let mut conn = db.acquire_db_conn().await?;

        // no year here, can be set only on creation to not break existing categorization
        sqlx::query!(
            "UPDATE budget_categories SET name = ?2, ignored = ?3
            WHERE id = ?1",
            self.id,
            self.fields.name,
            self.fields.ignored,
        )
        .execute(&mut *conn)
        .await?;

        Ok(())
    }
}

impl BudgetItem {
    pub async fn create(db: &Database, fields: BudgetItemFields) -> anyhow::Result<ID> {
        let mut conn = db.acquire_db_conn().await?;
        let id: ID = sqlx::query_scalar!(
            "INSERT INTO budget_items (category_id, name, amount, budget_only)
            VALUES (?1, ?2, ?3, ?4) RETURNING id",
            fields.category_id,
            fields.name,
            fields.amount,
            fields.budget_only
        )
        .fetch_one(&mut *conn)
        .await?
        .try_into()
        .unwrap();

        Ok(id)
    }

    pub async fn delete_by_id(db: &Database, id: ID) -> anyhow::Result<()> {
        let mut conn = db.acquire_db_conn().await?;
        sqlx::query!("DELETE FROM budget_items WHERE id = ?1", id,)
            .execute(&mut *conn)
            .await?;

        Ok(())
    }

    pub async fn fetch_by_year(db: &Database, year: i32) -> anyhow::Result<Vec<BudgetItem>> {
        let mut conn = db.acquire_db_conn().await?;
        let results = sqlx::query_as::<_, BudgetItem>(
            "SELECT budget_items.*
            FROM budget_items
            JOIN budget_categories ON (budget_items.category_id = budget_categories.id)
            WHERE budget_categories.year = ?1
            ORDER BY category_id, name",
        )
        .bind(year)
        .fetch_all(&mut *conn)
        .await?;

        Ok(results)
    }

    pub async fn fetch_by_id(db: &Database, id: ID) -> anyhow::Result<BudgetItem> {
        let mut conn = db.acquire_db_conn().await?;
        let result = sqlx::query_as::<_, BudgetItem>(
            "SELECT id, category_id, name, amount, budget_only
             FROM budget_items WHERE id = ?1",
        )
        .bind(id)
        .fetch_one(&mut *conn)
        .await?;

        Ok(result)
    }

    pub async fn update(&self, db: &Database) -> anyhow::Result<()> {
        let mut conn = db.acquire_db_conn().await?;

        sqlx::query!(
            "UPDATE budget_items SET
                category_id = ?2,
                name = ?3,
                amount = ?4,
                budget_only = ?5
            WHERE id = ?1",
            self.id,
            self.fields.category_id,
            self.fields.name,
            self.fields.amount,
            self.fields.budget_only
        )
        .execute(&mut *conn)
        .await?;

        Ok(())
    }

    pub async fn any_has_budget_category_id(
        db: &Database,
        budget_category_id: ID,
    ) -> anyhow::Result<bool> {
        let mut conn = db.acquire_db_conn().await?;
        let result = sqlx::query_scalar!(
            "SELECT 1 FROM budget_items WHERE category_id = ?1 LIMIT 1",
            budget_category_id,
        )
        .fetch_optional(&mut *conn)
        .await?;

        match result {
            Some(_) => Ok(true),
            None => Ok(false),
        }
    }
}

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
}
