import { Link } from "@remix-run/react";

/**
 * RecentKeys component for Homepage
 * @param {Object} props
 * @param {Array} props.keys - Array of recent keys
 * @param {boolean} props.isEmpty - Show empty state
 */
export function RecentKeys({ keys = [], isEmpty = true }) {
  if (isEmpty || keys.length === 0) {
    return (
      <div className="recent-keys">
        <h2 className="recent-keys__title">Recent Keys</h2>
        <div className="recent-keys__empty">
          <div className="recent-keys__empty-icon">🗝️</div>
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
          <Link key={key.id} to={`/keys/${key.id}`} className="recent-keys__item">
            {key.imageUrl && (
              <img src={key.imageUrl} alt={key.label} className="recent-keys__item-image" />
            )}
            <div className="recent-keys__item-content">
              <h3 className="recent-keys__item-title">{key.label}</h3>
              <p className="recent-keys__item-subtitle">{key.property || "No property"}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
