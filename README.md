# Budget app

## Build
### Database
```
# Setup the schema
cat db/init.sql db/delta.*.sql | sqlite3 db/budget.db
# Load some dummy test data
cargo run --bin db seed
# Create a test user
cargo run --bin passwords set USERNAME
```

### Rust
```
# build the project
cargo build 
# exports required structs to TypeScript files
cargo run --bin genjs
```

### JS
```
cd js
npm install
npm run build
```

## Run
### Rust
```
cargo run server
```

## How does this work?

### Budget
Collection of Budget Categories, which in turn contain Budget Items.

### Budget Item
Base building block of a budget. Represents an item with allowance amount that will later be used to
categorize expenses. Has to be part of a category, and will contribute to Category allowance.

Special Budget Items:
- budget-only: will contribute amount to the Category/Fund, but will not be available for
  categorization. Useful when coupled with categorization-only Items, for setting allowance without
  breaking it upfront. Example: budget-only "Fun" Item in "Discretionary" Category, with
  categorization-only Items of "Travel" and "Dining".
- categorization-only: does not have it's own amount, and will be counted against Category's budget.
  Used to provide different/more detailed breakdown of expenses without having to decide upfront on
  more fine grained allowances. Will be commonly paired with a budget-only item. For example, one
  could set up budget-only "Allowance" Item in "Travel" Category. Then, specific trips will be 
  category-only Items, which will help with understanding per-trip cost.

### Budget Category
Groups Budget Items together, and acts as boundary for comparing spending against allowance for
yearly budget.

Ignored categories can be used to explicitly mark some expenses as excluded from tracking. This
can be useful to prevent double counting transactions from cross-account transfers.

### Budget Fund
Fund groups Budget Items across years and represents a saving bucket in anticipation of rare
one-time big purchases, like buying new car or replacing AC unit in the house. This allows for
tracking money that is not expected to be spent every year, but is instead set aside for a goal,
and remove the need to move money to dedicated saving accounts.

Funds are managed from Funds tab. Only Budget Items can be made a part of a Fund, not the whole
Budget Categories. Each Item attached to a Fund contributes it's whole yearly amount to the
Fund, regardless of actual spending for the Item in given year. This means yearly spend for Fund
items will always show as at at least 100% of Budget Item amount.

Fund's own allowance will be a total of budgeted amounts from Budget Items attached to a Fund.

Following that, spend on Fund Items will count against total amount in the Fund. If in any year
spend exceeds whatever amount has accumulated in the Fund, the Analyze page will show Item spend
as Item's amount + excess spend above whatever amount was unspent in the Fund. This gives clear
signal about Fund needing higher contributions/lower spending in future years.

#### Notes

Funds could also be implemented to be completely separate from yearly budget and just shown in
categorization flow. However, I prefer to present them in the context of yearly spending as this
is the view I care about the most.

I also chose to allow mixing Fund and non-Fund Items within a Budget Category, because it makes
budget easier to understand from user point of view. For example, one could have House category,
with "Repairs" Fund Item, and non-Fund items of "Tax" and "Utilities", which then in yearly view
conveniently group spending on house-related items.

What should be the value of "TOTAL + funds" column in Analyze spending table for Items that are
part of a fund?
* fund has allowance, item has allowance:
  * item allowance because it contributes it's full amount every year
* fund has allowance, item overspent:
  * item allowance, because it was able to dip into allowance saved in previous years
* fund overspent, item has allowance:
  * item allowance, because the overspend came from different place
* fund overspent, item overspent:
  * item spend, for now, because I don't want to have to deal with distributing the overage
    between potential multiple overspent items in a fund.
