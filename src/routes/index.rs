use rocket::fs::NamedFile;
use rocket::get;

use crate::routes::response::ApiResponse;

#[get("/")]
pub async fn index() -> Result<NamedFile, std::io::Error> {
    NamedFile::open("www/index.html").await
}

#[get("/404")]
pub async fn not_found() -> ApiResponse {
    ApiResponse::not_found()
}
