import { json } from "@remix-run/node";
import { useNavigate, useLoaderData, useSearchParams } from "@remix-run/react";
import { useState, useMemo } from "react";
import { requireUserId } from "../utils/session.server.js";
import { getUserKeys, getKeyStats } from "../lib/keys.server.js";

export const handle = { 
  hideFooter: false, 
  title: 'My Keys', 
  showBackButton: false
};

export async function loader({ request }) {
  const userId = await requireUserId(request);
  const url = new URL(request.url);
  const search = url.searchParams.get("search") || "";

  const [keys, stats] = await Promise.all([
    getUserKeys(userId, search),
    getKeyStats(userId)
  ]);

  return json({ keys, stats, search });
}

export default function KeysInventory() {
  const navigate = useNavigate();
  const { keys, stats, search } = useLoaderData();
  const [searchParams] = useSearchParams();

  // State for filter and search
  const [activeFilter, setActiveFilter] = useState("All");
  const [searchTerm, setSearchTerm] = useState(search || "");

  // Get unique properties for filter chips
  const properties = useMemo(() => {
    const uniqueProps = [...new Set(keys.map(key => key.description || "Sin descripción"))];
    return uniqueProps;
  }, [keys]);

  // Filter keys based on active filter and search term
  const filteredKeys = useMemo(() => {
    let filtered = keys;

    // Filter by search term
    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(key => 
        key.name.toLowerCase().includes(searchLower) ||
        (key.description && key.description.toLowerCase().includes(searchLower))
      );
    }

    // Filter by property/description
    if (activeFilter !== "All") {
      filtered = filtered.filter(key => (key.description || "Sin descripción") === activeFilter);
    }

    return filtered;
  }, [keys, activeFilter, searchTerm]);

  const handleKeyClick = (keyId) => {
    navigate(`/keys/${keyId}`);
  };

  const handleFilterClick = (filter) => {
    setActiveFilter(filter);
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  return (
    <div className="keys-inventory">

      {/* Search Bar */}
      <div className="keys-inventory__search">
        <input
          type="text"
          placeholder="Search Key"
          value={searchTerm}
          onChange={handleSearchChange}
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
                  {key.images && key.images.length > 0 ? (
                    <img
                      src={key.images[0]}
                      alt={key.name}
                      className="keys-inventory__item-img"
                    />
                  ) : (
                    <div className="keys-inventory__item-placeholder">
                      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1721 9z" />
                      </svg>
                    </div>
                  )}
                </div>
                <div className="keys-inventory__item-content">
                  <h3 className="keys-inventory__item-name">{key.name}</h3>
                  <p className="keys-inventory__item-property">{key.description || "Sin descripción"}</p>
                  {/* Status badge hidden for now - will be shown when Key Scan is implemented */}
                  {/* <div className="keys-inventory__item-status">
                    <span className={`keys-inventory__status-badge keys-inventory__status-badge--${key.sigStatus}`}>
                      {key.sigStatus === "ready" ? "Lista" :
                       key.sigStatus === "pending" ? "Pendiente" : "Fallida"}
                    </span>
                  </div> */}
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