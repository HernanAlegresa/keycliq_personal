import { json } from "@remix-run/node";
import { useNavigate, useParams } from "@remix-run/react";
import { useState, useEffect } from "react";
import { requireUserId } from "../utils/session.server.js";
import { Button } from "../components/ui/Button.jsx";

export const handle = { 
  hideFooter: true, 
  title: 'Key Details', 
  showBackButton: true,
  backTo: 'dynamic' // Will use DynamicBackButton
};

export async function loader({ request, params }) {
  await requireUserId(request);
  return json({ keyId: params.id });
}

export default function KeyDetails() {
  const navigate = useNavigate();
  const { id } = useParams();
  
  // Check if this is a new key (from "Save as New Key")
  const isNewKey = id === 'new-key';
  
  // Determine the previous screen based on URL parameters or navigation state
  const getPreviousScreen = () => {
    // Check URL search params for navigation source
    const urlParams = new URLSearchParams(window.location.search);
    const from = urlParams.get('from');
    
    if (from) {
      return from;
    }
    
    // Default fallbacks based on key type
    if (isNewKey) {
      return '/scan/no_match'; // Default for new keys
    } else {
      return '/keys'; // Default for existing keys
    }
  };
  
  const previousScreen = getPreviousScreen();
  
  // Mock data - will be replaced with real data later
  const mockKeysDatabase = {
    "key-1": {
      id: "key-1",
      name: "Bedroom Key",
      property: "15 Main St.",
      unit: "Unit 2",
      door: "Bedroom door",
      notes: "Spare key for bedroom",
      imageUrl: "https://imgur.com/xdCqMes.jpg"
    },
    "key-2": {
      id: "key-2",
      name: "Garage Key",
      property: "10 Main St.",
      unit: "",
      door: "Garage door",
      notes: "",
      imageUrl: "https://imgur.com/UdNqZEM.jpg"
    },
    "key-3": {
      id: "key-3",
      name: "Main Door Key",
      property: "2 Main St.",
      unit: "",
      door: "Main entrance",
      notes: "Primary key for main door",
      imageUrl: "https://imgur.com/3AympjL.jpg"
    },
    "key-4": {
      id: "key-4",
      name: "Back Door Key",
      property: "2 Main St.",
      unit: "",
      door: "Back entrance",
      notes: "",
      imageUrl: "https://imgur.com/gi5oVWo.jpg"
    }
  };

  // Get key data or create empty form for new key
  const initialKeyData = isNewKey ? {
    id: 'new-key',
    name: "",
    property: "",
    unit: "",
    door: "",
    notes: "",
    imageUrl: "/api/placeholder/200/150" // Will be replaced with scanned image
  } : (mockKeysDatabase[id] || mockKeysDatabase["key-1"]); // Fallback to first key if not found

  // State for form data
  const [formData, setFormData] = useState(initialKeyData);
  const [originalData, setOriginalData] = useState(initialKeyData);
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
      // TODO: Save to backend
      console.log('Saving key data:', formData);
      
      if (isNewKey) {
        // For new keys, redirect to My Keys after saving
        console.log('New key saved, redirecting to My Keys');
        navigate('/keys');
      } else {
        // For existing keys, stay in edit mode
        setOriginalData(formData);
        setIsEditing(false);
        setHasChanges(false);
      }
    }
  };

  const handleDelete = () => {
    // TODO: Delete key from backend
    console.log('Deleting key:', id);
    navigate('/keys');
  };

  const handleCancel = () => {
    setFormData(originalData);
    setIsEditing(false);
    setHasChanges(false);
  };

  const handleBackNavigation = () => {
    navigate(previousScreen);
  };

return (
    <div className="key-details">
      {/* Edit button in the top right corner */}
      <div className="key-details__header-actions">
        {!isEditing ? (
          <button
            className="key-details__edit-button"
            onClick={handleEdit}
          >
            Edit
          </button>
        ) : (
          <button
            className="key-details__cancel-button"
            onClick={handleCancel}
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
        <div className="key-details__form">
          {/* Key Name */}
          <div className="key-details__field">
            <label className="key-details__label">
              Key Name<span className="key-details__required">*</span>
            </label>
            <input
              type="text"
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
              value={formData.notes}
              onChange={(e) => handleInputChange('notes', e.target.value)}
              placeholder={isNewKey ? "Add any notes about the key" : ""}
              className="key-details__textarea"
              disabled={!isEditing}
              rows={4}
            />
          </div>
</div>
</div>

      {/* Action Buttons */}
      <div className="key-details__actions">
        {!isNewKey && (
          <Button
            variant="secondary"
            size="large"
            onClick={handleDelete}
            className="key-details__delete-button"
          >
            Delete
          </Button>
        )}
        
        <Button
          variant="primary"
          size="large"
          onClick={handleSave}
          disabled={!isEditing || !isFormValid || !hasChanges}
          className={`key-details__save-button ${isNewKey ? 'key-details__save-button--full-width' : ''}`}
        >
          {isNewKey ? 'Save Key' : 'Save'}
        </Button>
</div>
</div>
);
}