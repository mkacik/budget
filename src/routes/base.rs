use rocket::fs::NamedFile;
use rocket::get;

use crate::routes::guards::User;

#[get("/")]
pub async fn index_logged_in(user: User) -> Result<NamedFile, std::io::Error> {
    NamedFile::open("www/index.html").await
}

#[get("/", rank = 2)]
pub async fn index_logged_out() -> Result<NamedFile, std::io::Error> {
    NamedFile::open("www/login.html").await
}
