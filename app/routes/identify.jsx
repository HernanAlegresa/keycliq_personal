import { json } from "@remix-run/node";
import { Form, useActionData, useLoaderData } from "@remix-run/react";
import { requireUserId } from "../utils/session.server.js";
import { prisma } from "../utils/db.server.js";
import { identifySimilar } from "../lib/ai/recognize.server.js";


export async function loader({ request }) {
const userId = await requireUserId(request);
const keys = await prisma.key.findMany({ where: { ownerId: userId }, select: { id: true, label: true, imageUrl: true } });
return json({ keys });
}


export async function action({ request }) {
const userId = await requireUserId(request);
const form = await request.formData();
const image = form.get("image");
if (!image || image.size === 0) return json({ error: "Image required" }, { status: 400 });
const keys = await prisma.key.findMany({ where: { ownerId: userId }, select: { id: true, label: true, imageUrl: true } });
const matches = await identifySimilar(image, keys, 5);
return json({ matches });
}


export default function Identify() {
const { keys } = useLoaderData();
const data = useActionData();
return (
<main className="mx-auto max-w-2xl p-6 space-y-6">
<h1 className="text-xl font-semibold">Identify Key</h1>
<Form method="post" encType="multipart/form-data" className="space-y-3">
<input type="file" name="image" accept="image/*" className="w-full" />
<button className="rounded bg-blue-600 px-3 py-2 text-white">Find Matches</button>
</Form>


{data?.error ? <p className="text-red-600 text-sm">{data.error}</p> : null}


{data?.matches ? (
<section className="space-y-2">
<h2 className="text-lg font-medium">Top Matches</h2>
<ul className="space-y-2">
{data.matches.map(m => (
<li key={m.key.id} className="rounded border bg-white p-3 shadow-sm">
<div className="flex items-center gap-3">
{m.key.imageUrl ? (
<img src={m.key.imageUrl} alt={m.key.label} className="h-16 w-16 rounded object-cover" />
) : (
<div className="h-16 w-16 rounded bg-gray-100" />
)}
<div className="flex-1">
<div className="font-medium">{m.key.label}</div>
<div className="text-sm text-gray-500">score: {m.score}</div>
</div>
</div>
</li>
))}
</ul>
</section>
) : null}


{!data?.matches && keys?.length === 0 ? (
<p className="text-gray-600">You have no keys yet. Try <a className="text-blue-600 underline" href="/scan">adding one</a>.</p>
) : null}
</main>
);
}