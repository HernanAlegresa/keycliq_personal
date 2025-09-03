import { json, redirect } from "@remix-run/node";
import { Form, useActionData } from "@remix-run/react";
import { requireUserId } from "../utils/session.server.js";
import { saveImage } from "../utils/storage.server.js";
import { prisma } from "../utils/db.server.js";

export async function loader({ request }) {
  await requireUserId(request);
  return json({});
}

export async function action({ request }) {
  const userId = await requireUserId(request);
  const form = await request.formData();
  const label = String(form.get("label") || "").trim() || "Untitled Key";
  const image = form.get("image");
  if (!image || image.size === 0) return json({ error: "Image required" }, { status: 400 });
  const { url } = await saveImage(image);
  const key = await prisma.key.create({ data: { ownerId: userId, label, imageUrl: url } });
  await prisma.keyImage.create({ data: { keyId: key.id, imageUrl: url } });
  return redirect(`/keys/${key.id}`);
}

export default function Scan() {
  const data = useActionData();
  return (
    <main className="mx-auto max-w-lg p-6 space-y-4">
      <h1 className="text-xl font-semibold">Scan New Key</h1>
      {data?.error ? <p className="text-red-600 text-sm">{data.error}</p> : null}
      <Form method="post" encType="multipart/form-data" className="space-y-3">
        <input name="label" placeholder="Label (optional)" className="w-full rounded border p-2" />
        <input type="file" name="image" accept="image/*" className="w-full" />
        <button className="rounded bg-blue-600 px-3 py-2 text-white">Save</button>
      </Form>
    </main>
  );
}