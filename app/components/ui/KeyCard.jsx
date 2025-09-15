import { Link } from "@remix-run/react";


export function KeyCard({ id, label, imageUrl }) {
return (
<Link to={`/keys/${id}`} className="block rounded-xl border bg-white shadow-sm hover:shadow-md">
{imageUrl ? (
<img src={imageUrl} alt={label} className="h-40 w-full rounded-t-xl object-cover" />
) : (
<div className="h-40 w-full rounded-t-xl bg-gray-100" />
)}
<div className="p-3">
<div className="text-sm text-gray-500">Key</div>
<div className="text-lg font-medium">{label}</div>
</div>
</Link>
);
}