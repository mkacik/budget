use serde::{Deserialize, Serialize};
use ts_rs::TS;

use crate::database::{Database, ID};

// helper PRIVATE type to not have to fuck with changing all places that use f64.
type DollarAmount = f64;

const WEEKS_PER_YEAR: f64 = 52.0;
const MONTHS_PER_YEAR: f64 = 12.0;

#[derive(Debug, sqlx::FromRow, Serialize, TS)]
pub struct BudgetCategory {
    pub id: ID,
    pub name: String,
}

#[derive(Debug, sqlx::FromRow, Serialize, TS)]
pub struct BudgetItem {
    pub id: ID,
    pub category_id: ID,
    pub name: String,
    pub amount: BudgetAmount,
}

#[derive(Debug, Deserialize, Serialize, TS)]
pub enum BudgetAmount {
    Weekly { amount: DollarAmount },
    Monthly { amount: DollarAmount },
    Yearly { amount: DollarAmount },
    EveryXYears { x: i32, amount: DollarAmount },
}

impl BudgetAmount {
    fn per_year(&self) -> DollarAmount {
        match self {
            BudgetAmount::Weekly { amount } => amount * WEEKS_PER_YEAR,
            BudgetAmount::Monthly { amount } => amount * MONTHS_PER_YEAR,
            BudgetAmount::Yearly { amount } => amount.clone(),
            BudgetAmount::EveryXYears { x, amount } => amount / (*x as DollarAmount),
        }
    }
}

impl BudgetCategory {
    pub async fn fetch_all(db: &Database) -> anyhow::Result<Vec<BudgetCategory>> {
        let mut conn = db.acquire_db_conn().await?;

        let results = sqlx::query_as::<_, BudgetCategory>(
            "SELECT id, name FROM budget_categories ORDER BY name",
        )
        .fetch_all(&mut *conn)
        .await?;

        Ok(results)
    }

    pub async fn save(&mut self, db: &Database) -> anyhow::Result<()> {
        let mut conn = db.acquire_db_conn().await?;

        let result = sqlx::query_scalar!(
            "INSERT INTO budget_categories (name) VALUES (?1) RETURNING id",
            self.name,
        )
        .fetch_one(&mut *conn)
        .await?;

        let id: i32 = result.try_into().unwrap();
        self.id = Some(id);

        Ok(())
    }
}

impl BudgetItem {
    pub async fn fetch_all(db: &Database) -> anyhow::Result<Vec<BudgetItem>> {
        let mut conn = db.acquire_db_conn().await?;
        let results = sqlx::query_as::<_, BudgetItem>(
            "SELECT id, category_id, name, amount FROM budget_items ORDER BY category_id, name",
        )
        .fetch_all(&mut *conn)
        .await?;

        Ok(results)
    }

    pub async fn save(&mut self, db: &Database) -> anyhow::Result<()> {
        let mut conn = db.acquire_db_conn().await?;

        let amount = serde_json::to_string(&self.amount)?;
        let result = sqlx::query_scalar!(
            "INSERT INTO budget_items (category_id, name, amount)
            VALUES (?1, ?2, ?3) RETURNING id",
            self.category_id,
            self.name,
            amount,
        )
        .fetch_one(&mut *conn)
        .await?;

        let id: i32 = result.try_into().unwrap();
        self.id = Some(id);

        Ok(())
    }
}

#[derive(Debug, Serialize, TS)]
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

    pub fn per_year(&self) -> DollarAmount {
        let mut amount: DollarAmount = 0.;
        for item in &self.items {
            amount += item.amount.per_year();
        }

        amount
    }

    pub fn per_month(&self) -> DollarAmount {
        self.per_year() / MONTHS_PER_YEAR
    }
}
