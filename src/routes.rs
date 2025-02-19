use rocket::fs::NamedFile;
use rocket::get;

#[get("/")]
pub async fn index() -> Result<NamedFile, std::io::Error> {
    NamedFile::open("www/index.html").await
}
