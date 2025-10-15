import { useNavigate } from "@remix-run/react";
import brandmarkLogo from "../../assets/KeyCliq_Brandmark_TwoTone_Dark.png";

/**
 * RecentKeys component for Homepage
 * @param {Object} props
 * @param {Array} props.keys - Array of recent keys
 * @param {boolean} props.isEmpty - Show empty state
 */
export function RecentKeys({ keys = [], isEmpty = true }) {
  const navigate = useNavigate();

  const handleKeyClick = (keyId) => {
    navigate(`/keys/${keyId}?from=/`);
  };

  if (isEmpty || keys.length === 0) {
    return (
      <div className="recent-keys">
        <h2 className="recent-keys__title">Recent Keys</h2>
        <div className="recent-keys__empty">
          <div className="recent-keys__empty-icon">
            <img 
              src={brandmarkLogo} 
              alt="" 
              className="recent-keys__brandmark"
            />
          </div>
          <p className="recent-keys__empty-text">Add your first key to get started</p>
        </div>
      </div>
    );
  }

  return (
    <div className="recent-keys">
      <h2 className="recent-keys__title">Recent Keys</h2>
      <div className="recent-keys__list">
        {keys.map((key) => (
          <div
            key={key.id}
            className="recent-keys__item"
            onClick={() => handleKeyClick(key.id)}
          >
            <div className="recent-keys__item-image">
              {key.imageUrl ? (
                <img
                  src={`/api/key-image/${key.id}`}
                  alt={key.name}
                  className="recent-keys__item-img"
                />
              ) : (
                <div className="recent-keys__item-placeholder">
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1721 9z" />
                  </svg>
                </div>
              )}
            </div>
            <div className="recent-keys__item-content">
              <h3 className="recent-keys__item-name">{key.name}</h3>
              <p className="recent-keys__item-property">{key.description || "Sin descripción"}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
