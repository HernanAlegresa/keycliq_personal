import { Link } from "@remix-run/react";

export function KeyList({ keys }) {
  if (!keys || keys.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      {keys.map((key) => (
        <Link
          key={key.id}
          to={`/inventory/${key.id}`}
          className="block bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow p-4"
        >
          <div className="flex items-start space-x-4">
            {/* Key Icon */}
            <div className="flex-shrink-0">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                </svg>
              </div>
            </div>

            {/* Key Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900 truncate">
                  {key.name}
                </h3>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  key.sigStatus === "ready" ? "bg-green-100 text-green-800" :
                  key.sigStatus === "pending" ? "bg-yellow-100 text-yellow-800" :
                  "bg-red-100 text-red-800"
                }`}>
                  {key.sigStatus === "ready" ? "Lista" :
                   key.sigStatus === "pending" ? "Pendiente" : "Fallida"}
                </span>
              </div>
              
              {key.description && (
                <p className="mt-1 text-sm text-gray-600 line-clamp-2">
                  {key.description}
                </p>
              )}
              
              <div className="mt-2 flex items-center text-xs text-gray-500">
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                {new Date(key.createdAt).toLocaleDateString("es-ES", {
                  year: "numeric",
                  month: "short",
                  day: "numeric"
                })}
              </div>
            </div>

            {/* Images Count */}
            {key.images && key.images.length > 0 && (
              <div className="flex-shrink-0">
                <div className="flex items-center text-xs text-gray-500">
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  {key.images.length}
                </div>
              </div>
            )}

            {/* Arrow */}
            <div className="flex-shrink-0">
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}
