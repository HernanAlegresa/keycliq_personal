// app/root.jsx
import { Links, LiveReload, Meta, NavLink, Outlet, Scripts, ScrollRestoration } from "@remix-run/react";
import tailwind from "./styles/tailwind.css?url";      // optional
import appCss from "./styles/app.css?url";             // <-- the CSS I gave you
import { Form } from "@remix-run/react";

export const links = () => [
  { rel: "stylesheet", href: tailwind },
  { rel: "stylesheet", href: appCss },
];

export const meta = () => ([
  { title: "KeyCliq" },
  { name: "viewport", content: "width=device-width, initial-scale=1" },
]);

export default function App() {
  return (
    <html lang="en">
      <head><Meta /><Links /></head>
      <body>
        {/* Top bar */}
        <header className="topbar">
          <div className="container topbar__inner">
            <a href="/" className="h1" style={{ textDecoration: "none", color: "inherit" }}>KeyCliq</a>
            <nav className="hidden sm:flex" style={{ gap: 12 }}>
              <a href="/scan">Scan</a>
              <a href="/identify">Identify</a>
              <a href="/keys">Library</a>
            </nav>
          </div>
        </header>



<Form method="post" action="/logout">
  <button type="submit" className="btn btn--outline">Log out</button>
</Form>


        {/* Page content */}
        <main className="container stack with-bottombar">
          <Outlet />
        </main>

        {/* Bottom tab bar (mobile) */}
        <nav className="bottombar sm:hidden">
          <div className="bottombar__grid">
            <NavLink className="tablink" to="/">Home</NavLink>
            <NavLink className="tablink" to="/scan">Scan</NavLink>
            <NavLink className="tablink" to="/identify">Find</NavLink>
            <NavLink className="tablink" to="/keys">Keys</NavLink>
          </div>
        </nav>

        <ScrollRestoration />
        <Scripts />
        <LiveReload />
      </body>
    </html>
  );
}
