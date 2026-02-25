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