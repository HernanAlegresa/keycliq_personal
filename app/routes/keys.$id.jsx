import { json, redirect } from "@remix-run/node";
import { useNavigate, useParams, useLoaderData, useActionData, useNavigation, Form } from "@remix-run/react";
import { useState, useEffect } from "react";
import { requireUserId } from "../utils/session.server.js";
import { getKeyById, createKey, updateKey, deleteKey, validateKeyData } from "../lib/keys.server.js";
import { Button } from "../components/ui/Button.jsx";

export const handle = { 
  hideFooter: true, 
  title: 'Key Details', 
  showBackButton: true,
  backTo: 'dynamic' // Will use DynamicBackButton
};

export async function loader({ request, params }) {
  const userId = await requireUserId(request);
  const keyId = params.id;

  // Check if this is a new key
  const isNewKey = keyId === 'new-key';
  
  if (isNewKey) {
    // Get scanned image from URL params or use placeholder
    const url = new URL(request.url);
    const imageUrl = url.searchParams.get("image") || "/api/placeholder/200/150";
    
    return json({ 
      isNewKey: true, 
      imageUrl,
      key: null 
    });
  }

  // Get existing key
  const key = await getKeyById(keyId, userId);
  
  if (!key) {
    throw new Response("Key not found", { status: 404 });
  }

  return json({ 
    isNewKey: false, 
    imageUrl: null,
    key 
  });
}

export async function action({ request, params }) {
  const userId = await requireUserId(request);
  const keyId = params.id;
  const formData = await request.formData();
  const intent = formData.get("intent");

  const isNewKey = keyId === 'new-key';

  if (intent === "save") {
    const name = formData.get("name");
    const property = formData.get("property");
    const unit = formData.get("unit");
    const door = formData.get("door");
    const notes = formData.get("notes");
    const imageUrl = formData.get("imageUrl");

    const keyData = {
      name,
      description: property, // Using property as description for now
      images: imageUrl ? [imageUrl] : [],
      unit: unit || null,
      door: door || null,
      notes: notes || null
    };

    // Validar datos
    const validation = validateKeyData(keyData);
    if (!validation.isValid) {
      return json({ 
        errors: validation.errors,
        fields: { name, property, unit, door, notes } 
      }, { status: 400 });
    }

    try {
      if (isNewKey) {
        // Create new key
        const key = await createKey({
          userId,
          name: name.trim(),
          description: property?.trim() || null,
          unit: unit?.trim() || null,
          door: door?.trim() || null,
          notes: notes?.trim() || null,
          images: imageUrl ? [imageUrl] : []
        });
        return redirect(`/scan/success/${key.id}`);
      } else {
        // Update existing key
        const updatedKey = await updateKey(keyId, userId, {
          name: name.trim(),
          description: property?.trim() || null,
          unit: unit?.trim() || null,
          door: door?.trim() || null,
          notes: notes?.trim() || null,
          images: imageUrl ? [imageUrl] : null
        });

        if (!updatedKey) {
          return json({ 
            errors: ["No se pudo actualizar la llave"],
            fields: { name, property, unit, door, notes } 
          }, { status: 404 });
        }

        return json({ success: true });
      }
    } catch (error) {
      console.error("Error saving key:", error);
      return json({ 
        errors: ["Error al guardar la llave. Inténtalo de nuevo."],
        fields: { name, property, unit, door, notes } 
      }, { status: 500 });
    }
  }

  if (intent === "delete") {
    const deleted = await deleteKey(keyId, userId);
    
    if (!deleted) {
      return json({ 
        error: "No se pudo eliminar la llave" 
      }, { status: 400 });
    }

    return redirect("/keys");
  }

  return json({ error: "Acción no válida" }, { status: 400 });
}

export default function KeyDetails() {
  const navigate = useNavigate();
  const { isNewKey, imageUrl, key } = useLoaderData();
  const actionData = useActionData();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";

  // Initialize form data based on whether it's a new key or existing
  const initialFormData = isNewKey ? {
    name: "",
    property: "",
    unit: "",
    door: "",
    notes: "",
    imageUrl: imageUrl || "/api/placeholder/200/150"
  } : {
    name: key?.name || "",
    property: key?.description || "",
    unit: key?.unit || "",
    door: key?.door || "",
    notes: key?.notes || "",
    imageUrl: (key?.images && key.images.length > 0) ? key.images[0] : "/api/placeholder/200/150"
  };

  // State for form data
  const [formData, setFormData] = useState(initialFormData);
  const [originalData, setOriginalData] = useState(initialFormData);
  const [isEditing, setIsEditing] = useState(isNewKey); // Start in edit mode for new keys
  const [hasChanges, setHasChanges] = useState(isNewKey); // New keys have "changes" by default

  // Check if form is valid
  const isFormValid = formData.name.trim() !== "" && formData.property.trim() !== "";

  // Check if there are changes
  useEffect(() => {
    const changed = 
      formData.name !== originalData.name ||
      formData.property !== originalData.property ||
      formData.unit !== originalData.unit ||
      formData.door !== originalData.door ||
      formData.notes !== originalData.notes;
    
    setHasChanges(changed);
  }, [formData, originalData]);

  // Handle successful save - return to view mode
  useEffect(() => {
    if (actionData?.success && !isNewKey) {
      setIsEditing(false);
      setHasChanges(false);
      // Update original data with the new saved data
      setOriginalData(formData);
    }
  }, [actionData?.success, isNewKey, formData]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleSave = () => {
    if (isFormValid && hasChanges) {
      // The form will be submitted via Form component
      // This function is kept for compatibility
    }
  };

  const handleDelete = () => {
    // The delete will be handled via Form component
    // This function is kept for compatibility
  };

  const handleCancel = () => {
    setFormData(originalData);
    setIsEditing(false);
    setHasChanges(false);
  };

  const handleBackNavigation = () => {
    if (isNewKey) {
      navigate('/scan/new');
    } else {
      navigate('/keys');
    }
  };

return (
    <div className="key-details">
      {/* Edit button in the top right corner */}
      <div className="key-details__header-actions">
        {!isNewKey && !isEditing && (
          <button
            className="key-details__edit-button"
            onClick={() => setIsEditing(true)}
          >
            Edit
          </button>
        )}
        {!isNewKey && isEditing && (
          <button
            className="key-details__cancel-button"
            onClick={() => {
              setFormData(originalData);
              setIsEditing(false);
              setHasChanges(false);
            }}
          >
            Cancel
          </button>
        )}
      </div>

      {/* Main content */}
      <div className="key-details__content">
        {/* Key Image */}
        <div className="key-details__image-container">
          <img
            src={formData.imageUrl}
            alt={formData.name}
            className="key-details__image"
          />
        </div>

        {/* Form */}
        <Form method="post" encType="multipart/form-data" id="key-form">
          <input type="hidden" name="intent" value="save" />
          <input type="hidden" name="imageUrl" value={formData.imageUrl} />
          
          <div className="key-details__form">
            {/* Key Name */}
            <div className="key-details__field">
              <label className="key-details__label">
                Key Name<span className="key-details__required">*</span>
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder={isNewKey ? "E.g., Front Door Garage Key" : ""}
                className="key-details__input"
                disabled={!isEditing}
              />
            </div>

            {/* Property */}
            <div className="key-details__field">
              <label className="key-details__label">
                Property<span className="key-details__required">*</span>
              </label>
              <p className="key-details__hint">
                Ensure the property name is input consistently for best organization.
              </p>
              <input
                type="text"
                name="property"
                value={formData.property}
                onChange={(e) => handleInputChange('property', e.target.value)}
                placeholder={isNewKey ? "E.g., 123 Main St." : ""}
                className="key-details__input"
                disabled={!isEditing}
              />
            </div>

            {/* Unit */}
            <div className="key-details__field">
              <label className="key-details__label">
                Unit (optional)
              </label>
              <input
                type="text"
                name="unit"
                value={formData.unit}
                onChange={(e) => handleInputChange('unit', e.target.value)}
                placeholder={isNewKey ? "E.g., Unit 4" : ""}
                className="key-details__input"
                disabled={!isEditing}
              />
            </div>

            {/* Door */}
            <div className="key-details__field">
              <label className="key-details__label">
                Door (optional)
              </label>
              <input
                type="text"
                name="door"
                value={formData.door}
                onChange={(e) => handleInputChange('door', e.target.value)}
                placeholder={isNewKey ? "E.g., Front door" : ""}
                className="key-details__input"
                disabled={!isEditing}
              />
            </div>

            {/* Notes */}
            <div className="key-details__field">
              <label className="key-details__label">
                Notes (optional)
              </label>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={(e) => handleInputChange('notes', e.target.value)}
                placeholder={isNewKey ? "Add any notes about the key" : ""}
                className="key-details__textarea"
                disabled={!isEditing}
                rows={4}
              />
            </div>
          </div>
        </Form>
      </div>

      {/* Action Buttons */}
      <div className="key-details__actions">
        {!isNewKey && (
          <Form method="post">
            <input type="hidden" name="intent" value="delete" />
            <Button
              variant="secondary"
              size="large"
              type="submit"
              onClick={(e) => {
                if (!confirm("¿Estás seguro de que quieres eliminar esta llave? Esta acción no se puede deshacer.")) {
                  e.preventDefault();
                }
              }}
              className="key-details__delete-button"
            >
              Delete
            </Button>
          </Form>
        )}
        
        <Button
          variant="primary"
          size="large"
          type="submit"
          form="key-form"
          disabled={!isEditing || !isFormValid || !hasChanges}
          className={`key-details__save-button ${isNewKey ? 'key-details__save-button--full-width' : ''}`}
        >
          {isNewKey ? 'Save Key' : 'Save'}
        </Button>
      </div>
    </div>
  );
}