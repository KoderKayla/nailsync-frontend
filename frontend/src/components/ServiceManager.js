import React, { useState, useEffect } from 'react';

const ServiceManager = () => {
    // 1. Point this directly to your live Render backend URL
    const API_BASE_URL = "https://nailsync-backend.onrender.com";

    const [services, setServices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    
    // Form State
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [price, setPrice] = useState('');
    const [duration, setDuration] = useState('60');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Dynamic, decoupled helper for operations outside the mount lifecycle
    const getAuthHeaders = () => {
        const token = localStorage.getItem('nailsync_token');
        return {
            'Content-Type': 'application/json',
            'Authorization': token ? `Bearer ${token}` : '',
        };
    };

    // React Lifecycle Hook for Initial Mount Fetching
    useEffect(() => {
        const fetchServices = async () => {
            try {
                setLoading(true);
                const token = localStorage.getItem('nailsync_token');
                
                // ✅ UPDATED: Added API_BASE_URL prefix
                const response = await fetch(`${API_BASE_URL}/api/services/`, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': token ? `Bearer ${token}` : '',
                    },
                });

                if (!response.ok) {
                    throw new Error('Failed to load your service catalog.');
                }

                const data = await response.json();
                setServices(data);
                setError(null);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchServices();
    }, []);

    // Handle form submission for a new service
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!name || !price) return;

        setIsSubmitting(true);
        try {
            // ✅ UPDATED: Added API_BASE_URL prefix
            const response = await fetch(`${API_BASE_URL}/api/services/`, {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify({
                    name,
                    description,
                    price: parseFloat(price).toFixed(2),
                    default_duration_minutes: parseInt(duration, 10),
                }),
            });

            if (!response.ok) {
                throw new Error('Could not create service. Check your inputs.');
            }

            const newService = await response.json();
            
            setServices((prevServices) => [...prevServices, newService]);

            // Reset Form fields on success
            setName('');
            setDescription('');
            setPrice('');
            setDuration('60');
        } catch (err) {
            alert(err.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    // Handle deleting a service option
    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to remove this service from your menu?')) return;

        try {
            // ✅ UPDATED: Added API_BASE_URL prefix
            const response = await fetch(`${API_BASE_URL}/api/services/${id}/`, {
                method: 'DELETE',
                headers: getAuthHeaders(),
            });

            if (!response.ok) {
                throw new Error('Failed to delete service.');
            }

            setServices(services.filter(service => service.id !== id));
        } catch (err) {
            alert(err.message);
        }
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', padding: '16px' }}>
            {/* Create Service Section */}
            <div style={{ background: '#f9f9f9', padding: '20px', borderRadius: '8px', border: '1px solid #eee' }}>
                <h3 style={{ marginTop: 0, marginBottom: '16px' }}>Add New Menu Service</h3>
                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                        <input
                            type="text"
                            placeholder="Service Name (e.g., Gel Full Set)"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            required
                            style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
                        />
                        <input
                            type="number"
                            placeholder="Price ($)"
                            step="0.01"
                            value={price}
                            onChange={(e) => setPrice(e.target.value)}
                            required
                            style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
                        />
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '12px' }}>
                        <select
                            value={duration}
                            onChange={(e) => setDuration(e.target.value)}
                            style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ccc', backgroundColor: '#fff' }}
                        >
                            <option value="30">30 Minutes</option>
                            <option value="45">45 Minutes</option>
                            <option value="60">60 Minutes (1 Hour)</option>
                            <option value="75">75 Minutes</option>
                            <option value="90">90 Minutes (1.5 Hours)</option>
                            <option value="120">120 Minutes (2 Hours)</option>
                        </select>
                    </div>
                    <textarea
                        placeholder="Optional Service Description..."
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ccc', minHeight: '60px', resize: 'vertical' }}
                    />
                    <button
                        type="submit"
                        disabled={isSubmitting}
                        style={{
                            padding: '10px',
                            background: '#0070f3',
                            color: '#fff',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontWeight: 'bold'
                        }}
                    >
                        {isSubmitting ? 'Saving...' : 'Add Service Option'}
                    </button>
                </form>
            </div>

            {/* Display Menu Catalog */}
            <div>
                <h3 style={{ marginBottom: '16px' }}>Your Service Catalog</h3>
                {loading && <p>Loading menu items...</p>}
                {error && <p style={{ color: 'red' }}>{error}</p>}
                {!loading && services.length === 0 && <p style={{ color: '#666' }}>Your service menu is currently empty. Add your first option above!</p>}
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {services.map((service) => (
                        <div
                            key={service.id}
                            style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                padding: '12px 16px',
                                background: '#fff',
                                border: '1px solid #ddd',
                                borderRadius: '6px'
                            }}
                        >
                            <div>
                                <strong style={{ fontSize: '16px' }}>{service.name}</strong>
                                <div style={{ color: '#666', fontSize: '14px', marginTop: '4px' }}>
                                    {service.default_duration_minutes} mins • ${service.price}
                                </div>
                                {service.description && (
                                    <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#888' }}>{service.description}</p>
                                )}
                            </div>
                            <button
                                onClick={() => handleDelete(service.id)}
                                style={{
                                    background: '#ff4d4d',
                                    color: '#fff',
                                    border: 'none',
                                    borderRadius: '4px',
                                    padding: '6px 12px',
                                    cursor: 'pointer',
                                    fontSize: '13px'
                                }}
                            >
                                Delete
                            </button>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default ServiceManager;
