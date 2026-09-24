import React, { useState } from 'react';
import './PharmacyCatalog.css'; // Assuming you'll keep the CSS in a separate file

interface Pharmacy {
  id: number;
  name: string;
  location: string;
  rating: number;
  reviewCount: number;
  status: 'open' | 'closed';
  tags: string[];
  logoColor: string;
  bannerImage?: string;
}

const PharmacyCatalog: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilters, setActiveFilters] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState('relevance');

  // Sample pharmacy data
  const pharmacies: Pharmacy[] = [
    {
      id: 1,
      name: 'MediCare Pharmacy',
      location: 'Dubai, UAE',
      rating: 4.8,
      reviewCount: 124,
      status: 'open',
      tags: ['24/7', 'Delivery'],
      logoColor: '#2A9D8F'
    },
    {
      id: 2,
      name: 'HealthPlus',
      location: 'Abu Dhabi, UAE',
      rating: 4.5,
      reviewCount: 89,
      status: 'open',
      tags: ['Insurance'],
      logoColor: '#E76F51'
    },
    {
      id: 3,
      name: 'Al Hayat Pharmacy',
      location: 'Sharjah, UAE',
      rating: 4.2,
      reviewCount: 56,
      status: 'closed',
      tags: ['Prescription'],
      logoColor: '#264653'
    }
  ];

  const filterOptions = [
    { id: '24/7', label: '24/7 Services' },
    { id: 'delivery', label: 'Delivery Available' },
    { id: 'insurance', label: 'Insurance Accepted' },
    { id: 'prescription', label: 'Prescription Services' }
  ];

  const toggleFilter = (filterId: string) => {
    setActiveFilters(prev =>
      prev.includes(filterId)
        ? prev.filter(f => f !== filterId)
        : [...prev, filterId]
    );
  };

  const clearFilters = () => {
    setActiveFilters([]);
    setSearchQuery('');
  };

  return (
    <div className="pharmacy-catalog">
      {/* Page Hero */}
      <section className="page-hero">
        <div className="page-hero__deco">
          <span className="plus plus--1"></span>
          <span className="plus plus--2"></span>
          <span className="dot dot--1"></span>
        </div>

        <div className="page-hero__inner">
          <div className="page-hero__eyebrow">🏥 Trusted Pharmacies</div>
          <h1 className="page-hero__title">Find the Best Pharmacies Near You</h1>
          <p className="page-hero__subtitle">
            Discover trusted pharmacies with verified ratings, services, and locations across the UAE
          </p>

          <div className="page-hero__search">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8"/>
              <path d="M21 21l-4.35-4.35"/>
            </svg>
            <input 
              type="text" 
              placeholder="Search by pharmacy name or location..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="page-hero__stats">
            <div>
              <strong>150+</strong>
              <span>Pharmacies</span>
            </div>
            <span className="stat-sep"></span>
            <div>
              <strong>4.5★</strong>
              <span>Average Rating</span>
            </div>
            <span className="stat-sep"></span>
            <div>
              <strong>24/7</strong>
              <span>Service Options</span>
            </div>
          </div>
        </div>
      </section>

      {/* Catalog Section */}
      <section className="section">
        <div className="catalog-layout">
          {/* Filters Sidebar */}
          <aside className="filters">
            <div className="filters__head">
              <h3>🔍 Filters</h3>
              <button className="filters__reset" onClick={clearFilters}>
                Reset All
              </button>
            </div>

            <div className="filter-group">
              <span className="filter-group__title">Services</span>
              <div className="filter-options">
                {filterOptions.map(option => (
                  <label key={option.id} className="filter-check">
                    <input 
                      type="checkbox" 
                      checked={activeFilters.includes(option.id)}
                      onChange={() => toggleFilter(option.id)}
                    />
                    {option.label}
                  </label>
                ))}
              </div>
            </div>

            <div className="filter-group">
              <span className="filter-group__title">Status</span>
              <div className="filter-options">
                <label className="filter-check">
                  <input type="checkbox" /> Open Now
                </label>
                <label className="filter-check">
                  <input type="checkbox" /> 24/7
                </label>
              </div>
            </div>

            <div className="filter-group">
              <span className="filter-group__title">Rating</span>
              <div className="filter-options">
                <label className="filter-check">
                  <input type="checkbox" /> 4.5+ Stars
                </label>
                <label className="filter-check">
                  <input type="checkbox" /> 4.0+ Stars
                </label>
                <label className="filter-check">
                  <input type="checkbox" /> 3.5+ Stars
                </label>
              </div>
            </div>
          </aside>

          {/* Results */}
          <main>
            <div className="results-toolbar">
              <div className="chip-row">
                {activeFilters.map(filter => {
                  const option = filterOptions.find(f => f.id === filter);
                  return option ? (
                    <span key={filter} className="chip is-active">
                      {option.label} ✕
                    </span>
                  ) : null;
                })}
                {activeFilters.length === 0 && (
                  <span className="chip">All Pharmacies</span>
                )}
              </div>

              <div className="sort-row">
                <span>Sort by:</span>
                <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                  <option value="relevance">Relevance</option>
                  <option value="rating">Highest Rated</option>
                  <option value="reviews">Most Reviews</option>
                </select>
              </div>
            </div>

            <div className="pharm-grid">
              {pharmacies.length > 0 ? (
                pharmacies.map(pharmacy => (
                  <div key={pharmacy.id} className="pharm-card">
                    <div 
                      className="pharm-card__banner"
                      style={{
                        backgroundImage: pharmacy.bannerImage 
                          ? `url(${pharmacy.bannerImage})` 
                          : `linear-gradient(135deg, ${pharmacy.logoColor}dd, ${pharmacy.logoColor})`
                      }}
                    >
                      <span className={`pharm-card__status ${pharmacy.status === 'closed' ? 'closed' : ''}`}>
                        {pharmacy.status === 'open' ? '● Open' : '● Closed'}
                      </span>
                    </div>

                    <div 
                      className="pharm-card__logo"
                      style={{ background: pharmacy.logoColor }}
                    >
                      {pharmacy.name.charAt(0)}
                    </div>

                    <div className="pharm-card__body">
                      <h4 className="pharm-card__name">{pharmacy.name}</h4>
                      
                      <div className="pharm-card__loc">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                          <circle cx="12" cy="10" r="3"/>
                        </svg>
                        {pharmacy.location}
                      </div>

                      <div className="pharm-card__rating">
                        <span className="stars">★★★★★</span>
                        <strong>{pharmacy.rating}</strong>
                        <span>({pharmacy.reviewCount} reviews)</span>
                      </div>

                      <div className="pharm-card__tags">
                        {pharmacy.tags.map(tag => (
                          <span key={tag} className="pharm-card__tag">{tag}</span>
                        ))}
                      </div>

                      <button className="pharm-card__cta">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                          <circle cx="12" cy="10" r="3"/>
                        </svg>
                        View Details
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="empty-state">
                  No pharmacies found matching your criteria
                </div>
              )}
            </div>

            <div className="load-more-wrap">
              <button className="chip">Load More Pharmacies</button>
            </div>
          </main>
        </div>
      </section>
    </div>
  );
};

export default PharmacyCatalog;