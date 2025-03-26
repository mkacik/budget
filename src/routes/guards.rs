use rocket::http::Status;
use rocket::request::{FromRequest, Outcome, Request};

pub struct User {
    pub username: String,
}

#[rocket::async_trait]
impl<'r> FromRequest<'r> for User {
    type Error = std::convert::Infallible;

    async fn from_request(request: &'r Request<'_>) -> Outcome<Self, Self::Error> {
        let username = match request.cookies().get_private("user") {
            Some(cookie) => String::from(cookie.value()),
            None => return Outcome::Forward(Status::Unauthorized),
        };

        Outcome::Success(User { username: username })
    }
}
