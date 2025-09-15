import { json } from "@remix-run/node";
import { useNavigate } from "@remix-run/react";
import { useState, useMemo } from "react";
import { requireUserId } from "../utils/session.server.js";

export const handle = { 
  hideFooter: false, 
  title: 'My Keys', 
  showBackButton: false
};

export async function loader({ request }) {
  await requireUserId(request);
  return json({});
}

export default function KeysInventory() {
  const navigate = useNavigate();
  
  // Mock data - will be replaced with real data later
  const mockKeys = [
    {
      id: "key-1",
      name: "Bedroom Key",
      property: "15 Main St.",
      imageUrl: "https://imgur.com/xdCqMes.jpg"
    },
    {
      id: "key-2", 
      name: "Garage Key",
      property: "10 Main St.",
      imageUrl: "https://imgur.com/UdNqZEM.jpg"
    },
    {
      id: "key-3",
      name: "Main Door Key", 
      property: "2 Main St.",
      imageUrl: "https://imgur.com/3AympjL.jpg"
    },
    {
      id: "key-4",
      name: "Back Door Key",
      property: "2 Main St.", 
      imageUrl: "https://imgur.com/gi5oVWo.jpg"
    }
  ];

  // State for search and filter
  const [searchTerm, setSearchTerm] = useState("");
  const [activeFilter, setActiveFilter] = useState("All");

  // Get unique properties for filter chips
  const properties = useMemo(() => {
    const uniqueProps = [...new Set(mockKeys.map(key => key.property))];
    return uniqueProps;
  }, []);

  // Filter keys based on search and active filter
  const filteredKeys = useMemo(() => {
    let filtered = mockKeys;

    // Filter by property
    if (activeFilter !== "All") {
      filtered = filtered.filter(key => key.property === activeFilter);
    }

    // Filter by search term
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(key => 
        key.name.toLowerCase().includes(term) || 
        key.property.toLowerCase().includes(term)
      );
    }

    return filtered;
  }, [mockKeys, activeFilter, searchTerm]);

  const handleKeyClick = (keyId) => {
    navigate(`/keys/${keyId}`);
  };

  const handleFilterClick = (filter) => {
    setActiveFilter(filter);
  };

  return (
    <div className="keys-inventory">

      {/* Search Bar */}
      <div className="keys-inventory__search">
        <input
          type="text"
          placeholder="Search Key"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="keys-inventory__search-input"
        />
      </div>

      {/* Filter Chips */}
      <div className="keys-inventory__filters">
        <button
          className={`keys-inventory__filter-chip ${activeFilter === "All" ? "keys-inventory__filter-chip--active" : ""}`}
          onClick={() => handleFilterClick("All")}
        >
          All
        </button>
        {properties.map((property) => (
          <button
            key={property}
            className={`keys-inventory__filter-chip ${activeFilter === property ? "keys-inventory__filter-chip--active" : ""}`}
            onClick={() => handleFilterClick(property)}
          >
            {property}
          </button>
        ))}
      </div>

      {/* Keys List */}
      <div className="keys-inventory__content">
        {filteredKeys.length > 0 ? (
          <div className="keys-inventory__list">
            {filteredKeys.map((key) => (
              <div
                key={key.id}
                className="keys-inventory__item"
                onClick={() => handleKeyClick(key.id)}
              >
                <div className="keys-inventory__item-image">
                  <img
                    src={key.imageUrl}
                    alt={key.name}
                    className="keys-inventory__item-img"
                  />
                </div>
                <div className="keys-inventory__item-content">
                  <h3 className="keys-inventory__item-name">{key.name}</h3>
                  <p className="keys-inventory__item-property">{key.property}</p>
                </div>
              </div>
          ))}
        </div>
        ) : (
          <div className="keys-inventory__empty">
            <div className="keys-inventory__empty-icon">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
              </svg>
            </div>
            <h3 className="keys-inventory__empty-title">No keys yet</h3>
            <p className="keys-inventory__empty-text">Scan your first key to get started.</p>
          </div>
        )}
      </div>
    </div>
  );
}