export function KeyForm({ key, isEditing = false }) {
  return (
    <div className="space-y-6">
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
          Nombre de la llave *
        </label>
        <input
          type="text"
          id="name"
          name="name"
          required
          defaultValue={key?.name || ""}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
          placeholder="Ej: Llave de casa, Llave del auto, etc."
        />
      </div>

      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
          Descripción (opcional)
        </label>
        <textarea
          id="description"
          name="description"
          rows={3}
          defaultValue={key?.description || ""}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
          placeholder="Información adicional sobre esta llave..."
        />
      </div>

      <div>
        <label htmlFor="images" className="block text-sm font-medium text-gray-700 mb-2">
          Imágenes (opcional)
        </label>
        <input
          type="file"
          id="images"
          name="images"
          multiple
          accept="image/*"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-green-50 file:text-green-700 hover:file:bg-green-100"
        />
        <p className="mt-1 text-sm text-gray-500">
          Puedes subir hasta 10 imágenes. Formatos soportados: JPG, PNG, WEBP
        </p>
        
        {/* Current Images (only for editing) */}
        {isEditing && key?.images && key.images.length > 0 && (
          <div className="mt-3">
            <p className="text-sm font-medium text-gray-700 mb-2">Imágenes actuales:</p>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {key.images.map((imageUrl, index) => (
                <div key={index} className="relative">
                  <img 
                    src={imageUrl} 
                    alt={`Imagen ${index + 1}`}
                    className="w-full h-20 object-cover rounded-lg"
                  />
                </div>
              ))}
            </div>
            <p className="mt-2 text-xs text-gray-500">
              Las nuevas imágenes reemplazarán las actuales
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
