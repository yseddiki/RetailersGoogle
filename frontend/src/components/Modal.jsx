import React, { useState } from 'react';
import { saveAs } from 'file-saver';
import * as XLSX from 'xlsx';

const EnhancedModal = ({ isOpen, onClose, data }) => {
    const [activeTab, setActiveTab] = useState('overview');

    if (!isOpen || !data?.data?.result) return null;

    const place = data.data.result;

    const handleExport = () => {
        // Create comprehensive export data
        const exportData = {
            basic_info: {
                name: place.name,
                place_id: place.place_id,
                formatted_address: place.formatted_address,
                phone: place.formatted_phone_number,
                website: place.website,
                rating: place.rating,
                total_ratings: place.user_ratings_total,
                price_level: place.price_level,
                business_status: place.business_status
            },
            coordinates: place.coordinates,
            opening_hours: place.opening_hours_parsed?.weekday_text || [],
            types: place.all_types || [],
            reviews: place.formatted_reviews?.map(review => ({
                author: review.author_name,
                rating: review.rating,
                text: review.text,
                date: review.formatted_time,
                relative_time: review.relative_time_description
            })) || [],
            services: {
                wheelchair_accessible: place.wheelchair_accessible_entrance,
                delivery: place.delivery,
                dine_in: place.dine_in,
                takeout: place.takeout,
                reservable: place.reservable,
                serves_beer: place.serves_beer,
                serves_breakfast: place.serves_breakfast,
                serves_brunch: place.serves_brunch,
                serves_dinner: place.serves_dinner,
                serves_lunch: place.serves_lunch,
                serves_vegetarian_food: place.serves_vegetarian_food,
                serves_wine: place.serves_wine
            }
        };

        const worksheet = XLSX.utils.json_to_sheet([exportData]);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Place Details');
        const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
        const blob = new Blob([excelBuffer], { type: 'application/octet-stream' });
        saveAs(blob, `${place.name || 'place'}_details.xlsx`);
    };

    const formatPriceLevel = (level) => {
        if (level === undefined || level === null) return 'Not specified';
        return '💰'.repeat(level + 1) + ' (' + ['Free', 'Inexpensive', 'Moderate', 'Expensive', 'Very Expensive'][level] + ')';
    };

    const formatBusinessStatus = (status) => {
        const statusMap = {
            'OPERATIONAL': '✅ Operational',
            'CLOSED_TEMPORARILY': '⏰ Temporarily Closed',
            'CLOSED_PERMANENTLY': '❌ Permanently Closed'
        };
        return statusMap[status] || status;
    };

    const renderOverviewTab = () => (
        <div style={styles.tabContent}>
            {/* Header Section */}
            <div style={styles.headerSection}>
                <h2 style={styles.placeName}>{place.name || 'Unnamed Place'}</h2>
                
                {place.rating && (
                    <div style={styles.ratingSection}>
                        <span style={styles.ratingStars}>
                            {'★'.repeat(Math.floor(place.rating))}{'☆'.repeat(5-Math.floor(place.rating))}
                        </span>
                        <span style={styles.ratingText}>
                            {place.rating.toFixed(1)} ({place.user_ratings_total?.toLocaleString() || 0} reviews)
                        </span>
                    </div>
                )}

                <div style={styles.statusRow}>
                    <span style={styles.businessStatus}>
                        {formatBusinessStatus(place.business_status)}
                    </span>
                    {place.price_level !== undefined && (
                        <span style={styles.priceLevel}>
                            {formatPriceLevel(place.price_level)}
                        </span>
                    )}
                </div>
            </div>

            {/* Contact Information */}
            <div style={styles.section}>
                <h3 style={styles.sectionTitle}>📞 Contact Information</h3>
                <div style={styles.infoGrid}>
                    {place.formatted_address && (
                        <div style={styles.infoItem}>
                            <strong>Address:</strong> {place.formatted_address}
                        </div>
                    )}
                    {place.formatted_phone_number && (
                        <div style={styles.infoItem}>
                            <strong>Phone:</strong> 
                            <a href={`tel:${place.formatted_phone_number}`} style={styles.link}>
                                {place.formatted_phone_number}
                            </a>
                        </div>
                    )}
                    {place.website && (
                        <div style={styles.infoItem}>
                            <strong>Website:</strong> 
                            <a href={place.website} target="_blank" rel="noopener noreferrer" style={styles.link}>
                                Visit Website
                            </a>
                        </div>
                    )}
                    {place.url && (
                        <div style={styles.infoItem}>
                            <strong>Google Maps:</strong> 
                            <a href={place.url} target="_blank" rel="noopener noreferrer" style={styles.link}>
                                View on Google Maps
                            </a>
                        </div>
                    )}
                </div>
            </div>

            {/* Location Details */}
            {place.coordinates && (
                <div style={styles.section}>
                    <h3 style={styles.sectionTitle}>📍 Location</h3>
                    <div style={styles.infoGrid}>
                        <div style={styles.infoItem}>
                            <strong>Coordinates:</strong> {place.coordinates.lat.toFixed(6)}, {place.coordinates.lng.toFixed(6)}
                        </div>
                        {place.plus_code?.global_code && (
                            <div style={styles.infoItem}>
                                <strong>Plus Code:</strong> {place.plus_code.global_code}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Categories */}
            {place.all_types?.length > 0 && (
                <div style={styles.section}>
                    <h3 style={styles.sectionTitle}>🏷️ Categories</h3>
                    <div style={styles.tagsContainer}>
                        {place.all_types.map((type, index) => (
                            <span key={index} style={styles.tag}>
                                {type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                            </span>
                        ))}
                    </div>
                </div>
            )}

            {/* Editorial Summary */}
            {place.editorial_summary?.overview && (
                <div style={styles.section}>
                    <h3 style={styles.sectionTitle}>📝 About</h3>
                    <p style={styles.description}>{place.editorial_summary.overview}</p>
                </div>
            )}
        </div>
    );

    const renderHoursTab = () => (
        <div style={styles.tabContent}>
            <h3 style={styles.sectionTitle}>🕒 Opening Hours</h3>
            
            {place.opening_hours_parsed?.open_now !== undefined && (
                <div style={styles.statusBanner}>
                    <span style={{
                        ...styles.statusIndicator,
                        backgroundColor: place.opening_hours_parsed.open_now ? '#4CAF50' : '#f44336'
                    }}>
                        {place.opening_hours_parsed.open_now ? '🟢 Open Now' : '🔴 Closed Now'}
                    </span>
                </div>
            )}

            {place.opening_hours_parsed?.weekday_text?.length > 0 ? (
                <div style={styles.hoursList}>
                    {place.opening_hours_parsed.weekday_text.map((day, index) => (
                        <div key={index} style={styles.dayHours}>
                            {day}
                        </div>
                    ))}
                </div>
            ) : (
                <p style={styles.noData}>Opening hours not available</p>
            )}

            {place.secondary_opening_hours && (
                <div style={styles.section}>
                    <h4 style={styles.subsectionTitle}>Special Hours</h4>
                    <div style={styles.hoursList}>
                        {place.secondary_opening_hours.weekday_text?.map((day, index) => (
                            <div key={index} style={styles.dayHours}>
                                {day}
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );

    const renderServicesTab = () => {
        const services = [
            { key: 'wheelchair_accessible_entrance', label: '♿ Wheelchair Accessible', icon: '♿' },
            { key: 'delivery', label: '🚚 Delivery', icon: '🚚' },
            { key: 'dine_in', label: '🍽️ Dine In', icon: '🍽️' },
            { key: 'takeout', label: '🥡 Takeout', icon: '🥡' },
            { key: 'reservable', label: '📅 Reservations', icon: '📅' },
            { key: 'serves_beer', label: '🍺 Serves Beer', icon: '🍺' },
            { key: 'serves_wine', label: '🍷 Serves Wine', icon: '🍷' },
            { key: 'serves_breakfast', label: '🌅 Breakfast', icon: '🌅' },
            { key: 'serves_brunch', label: '🥞 Brunch', icon: '🥞' },
            { key: 'serves_lunch', label: '🥗 Lunch', icon: '🥗' },
            { key: 'serves_dinner', label: '🍽️ Dinner', icon: '🍽️' },
            { key: 'serves_vegetarian_food', label: '🥬 Vegetarian Options', icon: '🥬' }
        ];

        const availableServices = services.filter(service => place[service.key] !== undefined);

        return (
            <div style={styles.tabContent}>
                <h3 style={styles.sectionTitle}>🛎️ Services & Amenities</h3>
                
                {availableServices.length > 0 ? (
                    <div style={styles.servicesGrid}>
                        {availableServices.map(service => (
                            <div key={service.key} style={{
                                ...styles.serviceItem,
                                backgroundColor: place[service.key] ? '#e8f5e8' : '#ffeaea'
                            }}>
                                <span style={styles.serviceIcon}>
                                    {place[service.key] ? '✅' : '❌'}
                                </span>
                                <span style={styles.serviceLabel}>{service.label}</span>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p style={styles.noData}>Service information not available</p>
                )}
            </div>
        );
    };

    const renderReviewsTab = () => (
        <div style={styles.tabContent}>
            <h3 style={styles.sectionTitle}>⭐ Reviews</h3>
            
            {place.formatted_reviews?.length > 0 ? (
                <div style={styles.reviewsList}>
                    {place.formatted_reviews.map((review, index) => (
                        <div key={index} style={styles.reviewItem}>
                            <div style={styles.reviewHeader}>
                                <span style={styles.reviewAuthor}>{review.author_name}</span>
                                <span style={styles.reviewRating}>{review.rating_stars}</span>
                            </div>
                            <div style={styles.reviewMeta}>
                                <span style={styles.reviewDate}>{review.relative_time_description}</span>
                            </div>
                            <p style={styles.reviewText}>{review.text}</p>
                        </div>
                    ))}
                </div>
            ) : (
                <p style={styles.noData}>No reviews available</p>
            )}
        </div>
    );

    const renderPhotosTab = () => (
        <div style={styles.tabContent}>
            <h3 style={styles.sectionTitle}>📸 Photos</h3>
            
            {place.photo_urls?.length > 0 ? (
                <div style={styles.photosGrid}>
                    {place.photo_urls.map((url, index) => (
                        <div key={index} style={styles.photoContainer}>
                            <img 
                                src={url} 
                                alt={`${place.name} photo ${index + 1}`}
                                style={styles.photo}
                                loading="lazy"
                            />
                        </div>
                    ))}
                </div>
            ) : (
                <p style={styles.noData}>No photos available</p>
            )}
        </div>
    );

    const tabs = [
        { id: 'overview', label: '📋 Overview', content: renderOverviewTab },
        { id: 'hours', label: '🕒 Hours', content: renderHoursTab },
        { id: 'services', label: '🛎️ Services', content: renderServicesTab },
        { id: 'reviews', label: '⭐ Reviews', content: renderReviewsTab },
        { id: 'photos', label: '📸 Photos', content: renderPhotosTab }
    ];

    return (
        <div style={styles.overlay}>
            <div style={styles.modal}>
                {/* Header */}
                <div style={styles.header}>
                    <button style={styles.closeButton} onClick={onClose}>✕</button>
                    <button style={styles.exportButton} onClick={handleExport}>
                        📊 Export Data
                    </button>
                </div>

                {/* Tabs */}
                <div style={styles.tabsContainer}>
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            style={{
                                ...styles.tab,
                                ...(activeTab === tab.id ? styles.activeTab : {})
                            }}
                            onClick={() => setActiveTab(tab.id)}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Content */}
                <div style={styles.content}>
                    {tabs.find(tab => tab.id === activeTab)?.content()}
                </div>
            </div>
        </div>
    );
};

const styles = {
    overlay: {
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 2000,
    },
    modal: {
        backgroundColor: '#fff',
        borderRadius: '12px',
        width: '90%',
        maxWidth: '900px',
        height: '90%',
        maxHeight: '800px',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 10px 30px rgba(0, 0, 0, 0.3)',
        overflow: 'hidden'
    },
    header: {
        padding: '15px 20px',
        borderBottom: '1px solid #e0e0e0',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#f8f9fa'
    },
    closeButton: {
        background: 'none',
        border: 'none',
        fontSize: '20px',
        cursor: 'pointer',
        color: '#666',
        padding: '8px',
        borderRadius: '4px',
        transition: 'background-color 0.2s'
    },
    exportButton: {
        padding: '8px 16px',
        backgroundColor: '#28a745',
        color: 'white',
        border: 'none',
        borderRadius: '6px',
        cursor: 'pointer',
        fontSize: '14px',
        fontWeight: '500',
        transition: 'background-color 0.2s'
    },
    tabsContainer: {
        display: 'flex',
        borderBottom: '1px solid #e0e0e0',
        backgroundColor: '#f8f9fa'
    },
    tab: {
        padding: '12px 20px',
        border: 'none',
        backgroundColor: 'transparent',
        cursor: 'pointer',
        fontSize: '14px',
        fontWeight: '500',
        color: '#666',
        borderBottom: '3px solid transparent',
        transition: 'all 0.2s',
        whiteSpace: 'nowrap'
    },
    activeTab: {
        color: '#007bff',
        borderBottomColor: '#007bff',
        backgroundColor: 'white'
    },
    content: {
        flex: 1,
        overflow: 'auto',
        padding: '0'
    },
    tabContent: {
        padding: '20px',
        fontFamily: 'Arial, sans-serif'
    },
    headerSection: {
        marginBottom: '25px',
        paddingBottom: '20px',
        borderBottom: '2px solid #f0f0f0'
    },
    placeName: {
        margin: '0 0 10px 0',
        fontSize: '24px',
        fontWeight: 'bold',
        color: '#333'
    },
    ratingSection: {
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        marginBottom: '10px'
    },
    ratingStars: {
        fontSize: '18px',
        color: '#ffa500'
    },
    ratingText: {
        fontSize: '14px',
        color: '#666'
    },
    statusRow: {
        display: 'flex',
        gap: '15px',
        alignItems: 'center'
    },
    businessStatus: {
        fontSize: '14px',
        fontWeight: 'bold',
        padding: '4px 8px',
        borderRadius: '4px',
        backgroundColor: '#e8f5e8'
    },
    priceLevel: {
        fontSize: '14px',
        fontWeight: 'bold'
    },
    section: {
        marginBottom: '25px'
    },
    sectionTitle: {
        fontSize: '18px',
        fontWeight: 'bold',
        color: '#333',
        marginBottom: '15px',
        paddingBottom: '8px',
        borderBottom: '1px solid #e0e0e0'
    },
    subsectionTitle: {
        fontSize: '16px',
        fontWeight: 'bold',
        color: '#555',
        marginBottom: '10px'
    },
    infoGrid: {
        display: 'grid',
        gap: '10px'
    },
    infoItem: {
        fontSize: '14px',
        color: '#555',
        lineHeight: '1.5'
    },
    link: {
        color: '#007bff',
        textDecoration: 'none',
        marginLeft: '5px'
    },
    tagsContainer: {
        display: 'flex',
        flexWrap: 'wrap',
        gap: '8px'
    },
    tag: {
        background: '#e9ecef',
        color: '#495057',
        padding: '4px 8px',
        borderRadius: '12px',
        fontSize: '12px',
        fontWeight: '500'
    },
    description: {
        fontSize: '14px',
        lineHeight: '1.6',
        color: '#555',
        margin: 0
    },
    statusBanner: {
        marginBottom: '20px'
    },
    statusIndicator: {
        padding: '8px 16px',
        borderRadius: '20px',
        color: 'white',
        fontWeight: 'bold',
        fontSize: '14px'
    },
    hoursList: {
        display: 'grid',
        gap: '8px'
    },
    dayHours: {
        padding: '8px 12px',
        backgroundColor: '#f8f9fa',
        borderRadius: '6px',
        fontSize: '14px',
        color: '#555'
    },
    servicesGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
        gap: '12px'
    },
    serviceItem: {
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        padding: '12px',
        borderRadius: '8px',
        border: '1px solid #e0e0e0'
    },
    serviceIcon: {
        fontSize: '16px'
    },
    serviceLabel: {
        fontSize: '14px',
        fontWeight: '500',
        color: '#333'
    },
    reviewsList: {
        display: 'grid',
        gap: '20px'
    },
    reviewItem: {
        padding: '16px',
        backgroundColor: '#f8f9fa',
        borderRadius: '8px',
        border: '1px solid #e0e0e0'
    },
    reviewHeader: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '8px'
    },
    reviewAuthor: {
        fontWeight: 'bold',
        color: '#333',
        fontSize: '14px'
    },
    reviewRating: {
        color: '#ffa500',
        fontSize: '14px'
    },
    reviewMeta: {
        marginBottom: '10px'
    },
    reviewDate: {
        fontSize: '12px',
        color: '#888'
    },
    reviewText: {
        fontSize: '14px',
        lineHeight: '1.5',
        color: '#555',
        margin: 0
    },
    photosGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '15px'
    },
    photoContainer: {
        borderRadius: '8px',
        overflow: 'hidden',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
    },
    photo: {
        width: '100%',
        height: '200px',
        objectFit: 'cover',
        display: 'block'
    },
    noData: {
        textAlign: 'center',
        color: '#888',
        fontSize: '14px',
        padding: '40px 20px',
        fontStyle: 'italic'
    }
};

export default EnhancedModal;