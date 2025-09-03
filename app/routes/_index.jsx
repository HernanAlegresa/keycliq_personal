import { Link } from "@remix-run/react";


export default function Index() {
return (
<main className="mx-auto max-w-3xl p-6 space-y-6">
<header className="flex items-center justify-between">
<h1 className="text-2xl font-semibold">KeyCliq</h1>
<nav className="space-x-3">
<Link to="/login" className="text-blue-600 hover:underline">Login</Link>
<Link to="/keys" className="text-blue-600 hover:underline">Keys</Link>
<Link to="/scan" className="text-blue-600 hover:underline">Scan</Link>
<Link to="/identify" className="text-blue-600 hover:underline">Identify</Link>
</nav>
</header>
<section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
<Link to="/scan" className="rounded-xl border bg-white p-6 shadow-sm hover:shadow-md">Scan</Link>
<Link to="/identify" className="rounded-xl border bg-white p-6 shadow-sm hover:shadow-md">Identify</Link>
<Link to="/keys" className="rounded-xl border bg-white p-6 shadow-sm hover:shadow-md">Library</Link>
</section>
</main>
);
}