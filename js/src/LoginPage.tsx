import React from "react";
import { useState } from "react";

export function LoginPage({ setUser }: { setUser: (string) => void }) {
  const [loginFailed, setLoginFailed] = useState<boolean>(false);

  const onSubmit = async (e: React.SyntheticEvent) => {
    e.preventDefault();

    try {
      const form = e.target as HTMLFormElement;
      const formData = new FormData(form);
      const response = await fetch("/api/login", {
        method: "POST",
        body: formData,
      });
      if (!response.ok) {
        throw new Error();
      }

      const result = await response.json();
      const user = result as { username: string };

      setLoginFailed(false);
      setUser(user.username);
    } catch (_error) {
      setLoginFailed(true);
    }
  };

  return (
    <div className="login-container">
      {loginFailed && "Login failed"}
      <form onSubmit={onSubmit}>
        <div className="login-row">
          <label htmlFor="username">Username</label>
          <input name="username" type="text"></input>
        </div>
        <div className="login-row">
          <label htmlFor="password">Password</label>
          <input name="password" type="password"></input>
        </div>
        <input className="login-submit" type="submit" value="Login"></input>
      </form>
    </div>
  );
}
