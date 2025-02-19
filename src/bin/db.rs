use clap::{Parser, Subcommand};

use budget::account::{Account, AccountClass};
use budget::budget::{Budget, BudgetAmount, BudgetCategory, BudgetItem};
use budget::database::Database;
use budget::datetime::TZ;
use budget::record_mapping::{
    Amount, RecordMapping, Text, TransactionDate, TransactionTime,
};
use budget::statement_import_config::StatementImportConfig;

#[derive(Parser, Debug)]
struct Args {
    #[clap(subcommand)]
    command: Command,
}

#[derive(Debug, Subcommand)]
enum Command {
    Seed,
}

#[tokio::main]
async fn main() {
    let db = Database::init().await;

    let args = Args::parse();
    let _ = match args.command {
        Command::Seed => match seed_db_for_testing(db).await {
            Ok(_) => {}
            Err(e) => {
                println!("{:?}", e);
            }
        },
    };
}

async fn seed_db_for_testing(db: Database) -> anyhow::Result<()> {
    add_statement_import_configs(&db).await?;
    add_accounts(&db).await?;
    add_budget(&db).await?;

    print_statement_import_configs(&db).await?;
    print_accounts(&db).await?;
    print_budget(&db).await?;

    Ok(())
}

async fn add_statement_import_configs(db: &Database) -> anyhow::Result<()> {
    let mut bank = StatementImportConfig {
        id: None,
        name: String::from("bank"),
        record_mapping: get_bank_record_mapping(),
    };
    bank.save(db).await?;

    let mut shop = StatementImportConfig {
        id: None,
        name: String::from("shop"),
        record_mapping: get_shop_record_mapping(),
    };
    shop.save(db).await?;

    Ok(())
}

fn get_bank_record_mapping() -> RecordMapping {
    RecordMapping {
        transaction_date: TransactionDate::FromColumn {
            col: 0,
            tz: TZ::Local,
        },
        transaction_time: TransactionTime::Empty,
        description: Text::FromColumn { col: 1 },
        amount: Amount::FromColumn { col: 2 },
    }
}

fn get_shop_record_mapping() -> RecordMapping {
    RecordMapping {
        transaction_date: TransactionDate::FromColumn {
            col: 2,
            tz: TZ::UTC,
        },
        transaction_time: TransactionTime::FromColumn {
            col: 2,
            tz: TZ::UTC,
        },
        description: Text::FromColumn { col: 23 },
        amount: Amount::FromColumn { col: 10 },
    }
}

async fn add_accounts(db: &Database) -> anyhow::Result<()> {
    let mut bank_account = Account {
        id: None,
        name: String::from("bank"),
        class: AccountClass::Bank,
        statement_import_config_id: None,
    };
    bank_account.save(&db).await?;

    let bank_statement_import_config = StatementImportConfig::fetch_by_name(&db, "bank").await?;
    bank_account.statement_import_config_id = bank_statement_import_config.id;
    bank_account.save(&db).await?;

    let mut shop_account = Account {
        id: None,
        name: String::from("shop"),
        class: AccountClass::Shop,
        statement_import_config_id: None,
    };
    shop_account.save(&db).await?;

    let shop_statement_import_config = StatementImportConfig::fetch_by_name(&db, "shop").await?;
    shop_account.statement_import_config_id = shop_statement_import_config.id;
    shop_account.save(&db).await?;

    // Leave one account without statement_import_config
    let mut cc_account = Account {
        id: None,
        name: String::from("cc"),
        class: AccountClass::CreditCard,
        statement_import_config_id: None,
    };
    cc_account.save(&db).await?;

    Ok(())
}

async fn print_statement_import_configs(db: &Database) -> anyhow::Result<()> {
    let configs = StatementImportConfig::fetch_all(&db).await?;
    println!("*** Statement Import Configs");
    for config in configs {
        println!("{:?}", config);
    }

    Ok(())
}

async fn print_accounts(db: &Database) -> anyhow::Result<()> {
    let accounts = match Account::fetch_all(&db).await {
        Ok(result) => result,
        Err(e) => panic!("{}", e),
    };

    println!("*** Accounts");
    for account in accounts {
        println!("{:?}", account);
    }

    Ok(())
}

async fn add_budget(db: &Database) -> anyhow::Result<()> {
    let mut items = vec![];

    let mut car = BudgetCategory {
        id: None,
        name: String::from("Car"),
    };
    car.save(&db).await?;

    let mut shopping = BudgetCategory {
        id: None,
        name: String::from("Shopping"),
    };
    shopping.save(&db).await?;

    items.push(BudgetItem {
        id: None,
        category_id: car.id,
        name: String::from("Fuel"),
        amount: BudgetAmount::Weekly { amount: 50. },
    });

    items.push(BudgetItem {
        id: None,
        category_id: car.id,
        name: String::from("Loan"),
        amount: BudgetAmount::Monthly { amount: 300. },
    });

    items.push(BudgetItem {
        id: None,
        category_id: car.id,
        name: String::from("Insurance"),
        amount: BudgetAmount::Yearly { amount: 1000. },
    });

    items.push(BudgetItem {
        id: None,
        category_id: car.id,
        name: String::from("Downpayment"),
        amount: BudgetAmount::EveryXYears {
            x: 5,
            amount: 5000.,
        },
    });

    items.push(BudgetItem {
        id: None,
        category_id: shopping.id,
        name: String::from("Groceries"),
        amount: BudgetAmount::Weekly { amount: 100. },
    });

    items.push(BudgetItem {
        id: None,
        category_id: shopping.id,
        name: String::from("Clothing"),
        amount: BudgetAmount::Monthly { amount: 200. },
    });

    for mut item in items {
        item.save(&db).await?;
    }

    Ok(())
}

async fn print_budget(db: &Database) -> anyhow::Result<()> {
    let categories = BudgetCategory::fetch_all(&db).await?;
    let items = BudgetItem::fetch_all(&db).await?;

    let budget = Budget {
        categories: categories,
        items: items,
    };

    println!("Yearly amount: {:.2}", budget.per_year());
    println!("Monthly amount: {:.2}", budget.per_month());

    Ok(())
}
