use rocket::form::{Form, FromForm};
use rocket::http::{Cookie, CookieJar};
use rocket::{post, State};

use crate::credentials::Credentials;
use crate::crypto::verify_password;
use crate::database::Database;
use crate::guards::user::User;
use crate::routes::response::ApiResponse;

#[get("/me")]
pub async fn me(user: Option<&User>) -> ApiResponse {
    match user {
        Some(user) => ApiResponse::data(user),
        None => ApiResponse::not_found(),
    }
}

#[derive(FromForm)]
pub struct LoginForm {
    username: String,
    password: String,
}

#[post("/login", data = "<form>")]
pub async fn login(
    cookies: &CookieJar<'_>,
    db: &State<Database>,
    form: Form<LoginForm>,
) -> ApiResponse {
    let creds = match Credentials::fetch_by_username(db, &form.username).await {
        Ok(Some(value)) => value,
        _ => return ApiResponse::not_found(),
    };

    if verify_password(&creds.pwhash, &form.password).is_err() {
        return ApiResponse::not_found();
    }

    let cookie = Cookie::new("user", creds.username.clone());
    cookies.add_private(cookie);

    let user = User {
        username: creds.username,
    };

    ApiResponse::data(user)
}

#[get("/logout")]
pub async fn logout(cookies: &CookieJar<'_>) -> ApiResponse {
    cookies.remove_private("user");

    ApiResponse::ok()
}
