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
```

### Rust
```
cargo build
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
