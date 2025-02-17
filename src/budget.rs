// TODO: replace with import from Database
type ID = Option<i32>;
// helper PRIVATE type to not have to fuck with changing all places that use f64.
type DollarAmount = f64;

const WEEKS_PER_YEAR: f64 = 52.0;
const MONTHS_PER_YEAR: f64 = 12.0;

pub struct BudgetCategory {
    pub id: ID,
    pub name: String,
}

pub struct BudgetItem {
    pub id: ID,
    pub category_id: ID,
    pub name: String,
    pub amount: BudgetAmount,
}

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

pub struct Budget {
    pub categories: Vec<BudgetCategory>,
    pub items: Vec<BudgetItem>,
}

// Temporary until UI is implemented
impl Budget {
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
