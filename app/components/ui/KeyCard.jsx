import { Link } from "@remix-run/react";
import { buildOptimizedCloudinaryUrl } from "../../utils/imageUtils.js";

export function KeyCard({ id, label, imageUrl }) {
  const optimizedImageUrl = imageUrl
    ? buildOptimizedCloudinaryUrl(imageUrl, {
        width: 480,
        height: 280,
        crop: "fill",
      })
    : null;

  return (
    <Link
      to={`/keys/${id}`}
      className="block rounded-xl border bg-white shadow-sm transition-shadow hover:shadow-md"
    >
      <div className="key-card__image key-image-frame">
        {optimizedImageUrl ? (
          <img
            src={optimizedImageUrl}
            alt={label}
            className="key-image-frame__img"
            loading="lazy"
            decoding="async"
            sizes="(max-width: 640px) 100vw, 320px"
          />
        ) : (
          <div className="key-card__image-placeholder" aria-hidden="true" />
        )}
      </div>
      <div className="p-3">
        <div className="text-sm text-gray-500">Key</div>
        <div className="text-lg font-medium">{label}</div>
      </div>
    </Link>
  );
}