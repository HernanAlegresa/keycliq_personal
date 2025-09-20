export function KeyDetail({ key }) {
  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="flex items-start space-x-4">
        {/* Key Icon */}
        <div className="flex-shrink-0">
          <div className="w-16 h-16 bg-green-100 rounded-lg flex items-center justify-center">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1721 9z" />
            </svg>
          </div>
        </div>

        {/* Key Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-2xl font-bold text-gray-900">
              {key.name}
            </h1>
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${
              key.sigStatus === "ready" ? "bg-green-100 text-green-800" :
              key.sigStatus === "pending" ? "bg-yellow-100 text-yellow-800" :
              "bg-red-100 text-red-800"
            }`}>
              {key.sigStatus === "ready" ? "Lista para reconocimiento" :
               key.sigStatus === "pending" ? "Pendiente de procesamiento" : "Error en procesamiento"}
            </span>
          </div>
          
          {key.description && (
            <p className="text-gray-600 mb-4">
              {key.description}
            </p>
          )}
          
          <div className="flex items-center text-sm text-gray-500 space-x-4">
            <div className="flex items-center">
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              Creada {new Date(key.createdAt).toLocaleDateString("es-ES", {
                year: "numeric",
                month: "long",
                day: "numeric"
              })}
            </div>
            
            {key.images && key.images.length > 0 && (
              <div className="flex items-center">
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                {key.images.length} imagen{key.images.length !== 1 ? 'es' : ''}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Images Gallery */}
      {key.images && key.images.length > 0 && (
        <div className="mt-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Imágenes</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {key.images.map((imageUrl, index) => (
              <div key={index} className="relative group">
                <img 
                  src={imageUrl} 
                  alt={`Imagen ${index + 1} de ${key.name}`}
                  className="w-full h-48 object-cover rounded-lg shadow-sm hover:shadow-md transition-shadow"
                />
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-200 rounded-lg flex items-center justify-center">
                  <button className="opacity-0 group-hover:opacity-100 bg-white bg-opacity-90 p-2 rounded-full hover:bg-opacity-100 transition-all">
                    <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Signature Status */}
      {key.signature && (
        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <h3 className="text-sm font-semibold text-blue-900 mb-2">Firma de Reconocimiento</h3>
          <p className="text-sm text-blue-700">
            Esta llave tiene una firma de reconocimiento generada y está lista para ser comparada con otras llaves.
          </p>
        </div>
      )}
    </div>
  );
}
