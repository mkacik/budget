use rocket::fs::NamedFile;
use rocket::get;

#[get("/")]
pub async fn index() -> Result<NamedFile, std::io::Error> {
    NamedFile::open("www/index.html").await
}

#[get("/<_text>")]
pub async fn default(_text: String) -> Result<NamedFile, std::io::Error> {
    index().await
}

#[get("/favicon.ico")]
pub async fn favicon() -> Result<NamedFile, std::io::Error> {
    NamedFile::open("www/favicon.ico").await
}
