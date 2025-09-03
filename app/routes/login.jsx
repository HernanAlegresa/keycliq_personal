import { Form, useActionData, useSearchParams } from "@remix-run/react";
import { json, redirect } from "@remix-run/node";
import { verifyLogin, register } from "../utils/auth.server.js";
import { createUserSession, getSession } from "../utils/session.server.js";

export async function loader({ request }) {
  const session = await getSession(request.headers.get("Cookie"));
  const userId = session.get("userId");
  if (userId) return redirect("/keys");
  return json({});
}

export async function action({ request }) {
  const form = await request.formData();
  const intent = String(form.get("intent") || "login");
  const email = String(form.get("email") || "").trim();
  const password = String(form.get("password") || "");

  if (!email || !password) {
    return json({ error: "Email and password required" }, { status: 400 });
  }

  if (intent === "register") {
    await register(email, password);
  }

  const user = await verifyLogin(email, password);
  if (!user) return json({ error: "Invalid credentials" }, { status: 400 });

  return createUserSession(user.id, "/keys");
}

export default function Login() {
  const data = useActionData();
  const [params] = useSearchParams();
  const mode = params.get("mode") || "login";
  return (
    <>
      <h1 className="h1">{mode === "register" ? "Create account" : "Sign in"}</h1>
      {data?.error ? <p style={{ color: "var(--color-danger)" }}>{data.error}</p> : null}
      <Form method="post" className="stack">
        <input type="hidden" name="intent" value={mode} />
        <input name="email" placeholder="Email" autoComplete="email" />
        <input name="password" type="password" placeholder="Password" autoComplete="current-password" />
        <button type="submit">{mode === "register" ? "Register" : "Login"}</button>
      </Form>
      <div className="mt-3">
        {mode === "register"
          ? <a href="/login" className="muted">Have an account? Sign in</a>
          : <a href="/login?mode=register" className="muted">Create an account</a>}
      </div>
    </>
  );
}
