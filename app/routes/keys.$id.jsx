import { json, redirect } from "@remix-run/node";
import { Form, useLoaderData } from "@remix-run/react";
import { prisma } from "../utils/db.server.js";            // 👈 add this
import { requireUserId } from "../utils/session.server.js";
import { saveImage } from "../utils/storage.server.js";



export async function loader({ request, params }) {
	const userId = await requireUserId(request);
	const key = await prisma.key.findFirst({ where: { id: params.id, ownerId: userId }, include: { images: true } });
	if (!key) throw new Response("Not found", { status: 404 });
	return json({ key });
}


export async function action({ request, params }) {
	const userId = await requireUserId(request);
	const key = await prisma.key.findFirst({ where: { id: params.id, ownerId: userId } });
	if (!key) throw new Response("Not found", { status: 404 });


const form = await request.formData();
const intent = String(form.get("intent") || "update");


if (intent === "delete") {
await prisma.key.delete({ where: { id: key.id } });
return redirect("/keys");
}


const label = String(form.get("label") || key.label).trim();
const description = String(form.get("description") || key.description || "").trim();
const image = form.get("image");


let imageUrl = key.imageUrl || undefined;
if (image && image.size > 0) {
const { url } = await saveImage(image);
imageUrl = url;
await prisma.keyImage.create({ data: { keyId: key.id, imageUrl: url } });
}


await prisma.key.update({ where: { id: key.id }, data: { label, description, imageUrl } });
	return redirect(`/keys/${key.id}`);
}


export default function KeyDetail() {
const { key } = useLoaderData();
return (
<main className="mx-auto max-w-2xl p-6 space-y-4">
<div className="flex items-start gap-6">
<img src={key.imageUrl || "/placeholder.svg"} alt={key.label} className="h-48 w-48 rounded-xl object-cover" />
<div className="flex-1">
<h1 className="text-2xl font-semibold">{key.label}</h1>
<p className="text-gray-600">{key.description}</p>
</div>
</div>


<section className="space-y-2">
<h2 className="text-lg font-medium">Edit</h2>
<Form method="post" encType="multipart/form-data" className="space-y-3">
<input name="label" defaultValue={key.label} className="w-full rounded border p-2" />
<textarea name="description" defaultValue={key.description || ""} className="w-full rounded border p-2" />
<input type="file" name="image" accept="image/*" />
<div className="flex gap-2">
<button className="rounded bg-blue-600 px-3 py-2 text-white" name="intent" value="update">Save</button>
<button className="rounded bg-red-600 px-3 py-2 text-white" name="intent" value="delete">Delete</button>
</div>
</Form>
</section>


<section className="space-y-2">
<h2 className="text-lg font-medium">History</h2>
<div className="grid grid-cols-2 gap-2">
{key.images.map(img => (
<img key={img.id} src={img.imageUrl} alt="history" className="h-32 w-full rounded object-cover" />)
)}
</div>
</section>
</main>
);
}