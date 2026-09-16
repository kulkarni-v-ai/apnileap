import React, { useState, useEffect } from 'react';
import apiClient from '../services/apiClient';

export default function AtlassianIntegration() {
  const [connection, setConnection] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

  const fetchConnection = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/api/integrations/atlassian');
      setConnection(res.data);
      setError(null);
    } catch (err) {
      setError('Failed to fetch Atlassian integration status.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConnection();

    // Check query params for OAuth return messages
    const params = new URLSearchParams(window.location.search);
    if (params.get('atlassian_connected')) {
      setMessage('Atlassian account successfully connected!');
      window.history.replaceState({}, document.title, window.location.pathname);
    } else if (params.get('integration_error')) {
      setError(`OAuth Error: ${params.get('integration_error')}`);
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  const handleConnect = () => {
    const baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001';
    window.location.href = `${baseURL}/api/integrations/atlassian/authorize`;
  };

  const handleValidate = async () => {
    setActionLoading(true);
    setMessage(null);
    setError(null);
    try {
      const res = await apiClient.post('/api/integrations/atlassian/validate');
      setMessage(res.data.message);
      fetchConnection();
    } catch (err) {
      setError(err.response?.data?.message || 'Validation failed.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRefresh = async () => {
    setActionLoading(true);
    setMessage(null);
    setError(null);
    try {
      const res = await apiClient.post('/api/integrations/atlassian/refresh');
      setMessage(res.data.message);
      fetchConnection();
    } catch (err) {
      setError(err.response?.data?.message || 'Token refresh failed.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDisconnect = async () => {
    if (!window.confirm('Are you sure you want to disconnect your Atlassian account?')) return;
    setActionLoading(true);
    setMessage(null);
    setError(null);
    try {
      await apiClient.delete(`/api/integrations/atlassian/${connection.connectionId}`);
      setMessage('Atlassian account disconnected.');
      fetchConnection();
    } catch (err) {
      setError(err.response?.data?.message || 'Disconnect failed.');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return <div style={{ padding: '20px', color: '#94a3b8' }}>Loading Atlassian Integration details...</div>;
  }

  return (
    <div style={{
      background: 'var(--card-bg, #1e293b)',
      border: '1px solid var(--border-color, #334155)',
      borderRadius: '12px',
      padding: '24px',
      color: '#f8fafc',
      marginTop: '20px'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <h3 style={{ fontSize: '18px', fontWeight: '600', margin: 0, color: '#f8fafc' }}>
            Atlassian OAuth 2.0 (3LO) Integration
          </h3>
          <p style={{ fontSize: '13px', color: '#94a3b8', marginTop: '4px', margin: 0 }}>
            Connect APNILEAP dynamically to Jira Cloud workspace without API tokens or passwords.
          </p>
        </div>
        <div>
          {connection?.connected ? (
            <span style={{
              background: '#059669',
              color: '#ecfdf5',
              padding: '6px 12px',
              borderRadius: '20px',
              fontSize: '12px',
              fontWeight: '600'
            }}>
              ● CONNECTED
            </span>
          ) : (
            <span style={{
              background: '#dc2626',
              color: '#fef2f2',
              padding: '6px 12px',
              borderRadius: '20px',
              fontSize: '12px',
              fontWeight: '600'
            }}>
              ● DISCONNECTED
            </span>
          )}
        </div>
      </div>

      {message && (
        <div style={{ background: '#064e3b', color: '#a7f3d0', padding: '12px 16px', borderRadius: '8px', marginBottom: '16px', fontSize: '14px' }}>
          {message}
        </div>
      )}

      {error && (
        <div style={{ background: '#7f1d1d', color: '#fecaca', padding: '12px 16px', borderRadius: '8px', marginBottom: '16px', fontSize: '14px' }}>
          {error}
        </div>
      )}

      {connection?.connected ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ background: '#0f172a', borderRadius: '8px', padding: '16px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '13px' }}>
            <div>
              <span style={{ color: '#94a3b8', display: 'block' }}>Connected Site Name</span>
              <strong style={{ color: '#e2e8f0', fontSize: '15px' }}>{connection.siteName || 'Atlassian Site'}</strong>
            </div>
            <div>
              <span style={{ color: '#94a3b8', display: 'block' }}>Site URL</span>
              <a href={connection.siteUrl} target="_blank" rel="noreferrer" style={{ color: '#38bdf8', textDecoration: 'none' }}>
                {connection.siteUrl}
              </a>
            </div>
            <div>
              <span style={{ color: '#94a3b8', display: 'block' }}>Cloud ID</span>
              <code style={{ background: '#1e293b', padding: '2px 6px', borderRadius: '4px', color: '#a5f3fc' }}>{connection.cloudId}</code>
            </div>
            <div>
              <span style={{ color: '#94a3b8', display: 'block' }}>Last Validated</span>
              <span style={{ color: '#cbd5e1' }}>{connection.lastValidatedAt ? new Date(connection.lastValidatedAt).toLocaleString() : 'N/A'}</span>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <button
              onClick={handleValidate}
              disabled={actionLoading}
              style={{
                background: '#2563eb',
                color: '#fff',
                border: 'none',
                padding: '8px 16px',
                borderRadius: '6px',
                cursor: 'pointer',
                fontWeight: '500'
              }}
            >
              Validate Connection
            </button>
            <button
              onClick={handleRefresh}
              disabled={actionLoading}
              style={{
                background: '#4f46e5',
                color: '#fff',
                border: 'none',
                padding: '8px 16px',
                borderRadius: '6px',
                cursor: 'pointer',
                fontWeight: '500'
              }}
            >
              Refresh Token
            </button>
            <button
              onClick={handleConnect}
              disabled={actionLoading}
              style={{
                background: '#d97706',
                color: '#fff',
                border: 'none',
                padding: '8px 16px',
                borderRadius: '6px',
                cursor: 'pointer',
                fontWeight: '500'
              }}
            >
              Reconnect
            </button>
            <button
              onClick={handleDisconnect}
              disabled={actionLoading}
              style={{
                background: '#dc2626',
                color: '#fff',
                border: 'none',
                padding: '8px 16px',
                borderRadius: '6px',
                cursor: 'pointer',
                fontWeight: '500'
              }}
            >
              Disconnect
            </button>
          </div>
        </div>
      ) : (
        <div style={{ textAlign: 'center', padding: '24px 0' }}>
          <p style={{ color: '#94a3b8', marginBottom: '16px' }}>
            No Atlassian account is currently linked. Connect to authorize APNILEAP to access Jira projects and tasks dynamically.
          </p>
          <button
            onClick={handleConnect}
            style={{
              background: '#2563eb',
              color: '#ffffff',
              border: 'none',
              padding: '12px 24px',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'pointer'
            }}
          >
            Connect Atlassian Account
          </button>
        </div>
      )}
    </div>
  );
}
