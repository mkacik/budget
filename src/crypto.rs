use libsodium_sys as ffi;

const STRBYTES: usize = ffi::crypto_pwhash_STRBYTES as usize;
const OPSLIMIT_INTERACTIVE: u64 = ffi::crypto_pwhash_OPSLIMIT_INTERACTIVE as u64;
const MEMLIMIT_INTERACTIVE: usize = ffi::crypto_pwhash_MEMLIMIT_INTERACTIVE as usize;

/*
pub fn crypto_pwhash_str(
    out: *mut libc::c_char,
    passwd: *const libc::c_char,
    passwdlen: libc::c_ulonglong,
    opslimit: libc::c_ulonglong,
    memlimit: usize,
) -> libc::c_int;
*/
fn pwhash(password: &[u8]) -> Result<[u8; STRBYTES], ()> {
  let mut hash: [u8; STRBYTES] = [0; STRBYTES];

  if unsafe {
      ffi::crypto_pwhash_str(
          hash.as_mut_ptr() as *mut _,
          password.as_ptr() as *const _,
          password.len() as u64,
          OPSLIMIT_INTERACTIVE,
          MEMLIMIT_INTERACTIVE,
      )
  } == 0 {
    Ok(hash)
  } else {
    Err(())
  }
}

/*
pub fn crypto_pwhash_str_verify(
    str: *const libc::c_char,
    passwd: *const libc::c_char,
    passwdlen: libc::c_ulonglong,
) -> libc::c_int;
*/
fn pwhash_verify(hash: &[u8], password: &[u8]) -> Result<(), ()> {
  if unsafe {
    ffi::crypto_pwhash_str_verify(
      hash.as_ptr() as *const _,
      password.as_ptr() as *const _,
      password.len() as u64,
    )
  } == 0 {
    Ok(())
  } else {
    Err(())
  }
}

fn u8_array_to_string(bytes: &[u8; STRBYTES]) -> Result<String, ()> {
  let mut chars: Vec<u8> = Vec::new();
  for byte in bytes {
    if *byte == 0 {
      break;
    } else {
      chars.push(*byte);
    }
  }

  match String::from_utf8(chars) {
    Ok(string) => Ok(string),
    Err(_) => Err(()),
  }
}

pub fn hash_password(password: &str) -> Result<String, ()> {
    let hashed_password_bytes = pwhash(password.as_bytes())?;
    let hashed_password = u8_array_to_string(&hashed_password_bytes)?;

    Ok(hashed_password)
}

pub fn verify_password(hash: &str, password: &str) -> Result<(), ()> {
  pwhash_verify(hash.as_bytes(), password.as_bytes())
}

#[cfg(test)]
mod tests {
  use super::*;

  #[test]
  fn test_hash_password() {
    let password = "not very good password";
    let result = hash_password(password);
    assert!(result.is_ok());

    let hash = result.unwrap();
    assert!(hash.len() <= STRBYTES);
    assert!(!hash.contains("\0"));
  }

  #[test]
  fn test_verify_hashed_password() {
    let password = "another not very good password";
    let hash = hash_password(password).unwrap();
    assert!(verify_password(&hash, password).is_ok());
    assert!(verify_password(&hash, "wrong password").is_err());
  }
}
