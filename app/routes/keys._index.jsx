import { json } from "@remix-run/node";
import { Link, useLoaderData } from "@remix-run/react";
import { prisma } from "../utils/db.server.js";
import { requireUserId } from "../utils/session.server.js";

export async function loader({ request }) {
  const userId = await requireUserId(request);        // redirects to /login if not authed
  const keys = await prisma.key.findMany({
    where: { ownerId: userId },
    orderBy: { createdAt: "desc" },
  });
  return json({ keys });                              // ← must return an object
}

export default function KeysIndex() {
  const data = useLoaderData();                       // may be null during transitions/errors
  const { keys = [] } = data ?? {};                   // ← safe destructure
  return (
    <>
      <div className="flex" style={{ justifyContent: "space-between", alignItems: "center" }}>
        <h1 className="h1">Your Keys</h1>
        <a href="/keys/new" className="btn">Add Key</a>
      </div>

      {!data ? (
        <p className="muted mt-3">Loading…</p>
      ) : keys.length === 0 ? (
        <p className="muted mt-3">No keys yet. <a className="btn btn--outline" href="/keys/new">Add one</a></p>
      ) : (
        <div className="keygrid mt-3">
          {keys.map((k) => (
            <article key={k.id} className="card">
              {k.imageUrl ? <img className="card__img" src={k.imageUrl} alt={k.label} /> : <div className="card__img" />}
              <div className="card__body">
                <div className="muted">Key</div>
                <Link to={`/keys/${k.id}`} className="h2" style={{ textDecoration: "none" }}>
                  {k.label}
                </Link>
              </div>
            </article>
          ))}
        </div>
      )}
    </>
  );
}
