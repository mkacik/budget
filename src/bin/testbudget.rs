use budget::budget::{Budget, BudgetAmount, BudgetCategory, BudgetItem};

fn get_budget_for_testing() -> Budget {
    let mut categories = vec![];
    let mut items = vec![];

    categories.push(BudgetCategory {
        id: Some(1),
        name: String::from("Car"),
    });

    items.push(BudgetItem {
        id: Some(1),
        category_id: Some(1),
        name: String::from("Fuel"),
        amount: BudgetAmount::Weekly { amount: 50. },
    });

    items.push(BudgetItem {
        id: Some(2),
        category_id: Some(1),
        name: String::from("Loan"),
        amount: BudgetAmount::Monthly { amount: 300. },
    });

    items.push(BudgetItem {
        id: Some(3),
        category_id: Some(1),
        name: String::from("Insurance"),
        amount: BudgetAmount::Yearly { amount: 1000. },
    });

    items.push(BudgetItem {
        id: Some(4),
        category_id: Some(1),
        name: String::from("Downpayment"),
        amount: BudgetAmount::EveryXYears {
            x: 5,
            amount: 5000.,
        },
    });

    categories.push(BudgetCategory {
        id: Some(2),
        name: String::from("Shopping"),
    });

    items.push(BudgetItem {
        id: Some(5),
        category_id: Some(1),
        name: String::from("Groceries"),
        amount: BudgetAmount::Weekly { amount: 100. },
    });

    items.push(BudgetItem {
        id: Some(5),
        category_id: Some(1),
        name: String::from("Clothing"),
        amount: BudgetAmount::Monthly { amount: 200. },
    });

    return Budget {
        categories: categories,
        items: items,
    };
}

fn main() {
    let budget = get_budget_for_testing();
    println!("Yearly amount: {:.2}", budget.per_year());
    println!("Monthly amount: {:.2}", budget.per_month());
}
