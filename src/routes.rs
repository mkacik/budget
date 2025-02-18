use rocket::fs::NamedFile;

#[get("/")]
pub async fn index() -> Result<NamedFile, std::io::Error> {
    NamedFile::open("www/index.html").await
}
