# Budget app
## Build

### Database

```
(
    # Setup the schema
    cd db
    cat init.sql delta.*.sql | sqlite3 budget.db
)
# Load some dummy test data
cargo run --bin db seed
# Create a test user
cargo run --bin passwords set USERNAME
```

### Rust
```
cargo build
```
### JS
```
cargo run --bin genjs
cd js
npm install
npm run build
```

## Run
### Rust
```
cargo run server
```
