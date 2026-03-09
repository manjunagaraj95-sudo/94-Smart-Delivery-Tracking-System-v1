
import React, { useState, useEffect } from 'react';

// --- RBAC Configuration ---
const ROLES = {
  CUSTOMER: 'CUSTOMER',
  DELIVERY_PARTNER: 'DELIVERY_PARTNER',
  OPERATIONS_ADMIN: 'OPERATIONS_ADMIN',
};

const USER_PERMISSIONS = {
  [ROLES.CUSTOMER]: {
    canViewDashboard: true,
    canPlaceRequest: true,
    canTrackDeliveries: true,
    canViewPartners: false,
    canManageOperations: false,
  },
  [ROLES.DELIVERY_PARTNER]: {
    canViewDashboard: true,
    canPlaceRequest: false,
    canTrackDeliveries: true,
    canManageShipments: true,
    canViewPartners: false,
    canManageOperations: false,
  },
  [ROLES.OPERATIONS_ADMIN]: {
    canViewDashboard: true,
    canPlaceRequest: true,
    canTrackDeliveries: true,
    canViewPartners: true,
    canManageOperations: true,
    canApproveRequests: true,
    canManageSLAs: true,
  },
};

// --- Sample Data (Mock) ---
const mockDeliveries = [
  {
    id: 'DEL-001',
    customer: 'Alice Johnson',
    partner: 'Express Logistics',
    status: 'Approved',
    origin: 'New York, NY',
    destination: 'Los Angeles, CA',
    eta: '2023-11-15',
    progress: 75,
    lastUpdate: '2023-11-14 10:30 AM',
    items: ['Laptop', 'Monitor'],
    notes: 'Fragile items, handle with care.',
    slaStatus: 'On Track',
    workflow: ['Requested', 'Approved', 'Picked Up', 'In Transit', 'Out for Delivery', 'Delivered'],
    currentStage: 'In Transit',
    documents: [{ name: 'Shipping Label', url: '#', type: 'PDF' }],
  },
  {
    id: 'DEL-002',
    customer: 'Bob Williams',
    partner: 'Fast Ship Co.',
    status: 'In Progress',
    origin: 'Chicago, IL',
    destination: 'Houston, TX',
    eta: '2023-11-18',
    progress: 30,
    lastUpdate: '2023-11-14 09:00 AM',
    items: ['Books', 'Clothing'],
    notes: 'Standard delivery.',
    slaStatus: 'Warning',
    workflow: ['Requested', 'Approved', 'Picked Up', 'In Transit', 'Out for Delivery', 'Delivered'],
    currentStage: 'Picked Up',
    documents: [{ name: 'Pickup Receipt', url: '#', type: 'PNG' }],
  },
  {
    id: 'DEL-003',
    customer: 'Charlie Davis',
    partner: 'Swift Couriers',
    status: 'Pending',
    origin: 'Miami, FL',
    destination: 'Seattle, WA',
    eta: '2023-11-20',
    progress: 10,
    lastUpdate: '2023-11-13 04:15 PM',
    items: ['Artwork'],
    notes: 'Requires special handling.',
    slaStatus: 'Critical',
    workflow: ['Requested', 'Approved', 'Picked Up', 'In Transit', 'Out for Delivery', 'Delivered'],
    currentStage: 'Requested',
    documents: [],
  },
  {
    id: 'DEL-004',
    customer: 'Diana Prince',
    partner: 'Express Logistics',
    status: 'Rejected',
    origin: 'Dallas, TX',
    destination: 'Boston, MA',
    eta: '2023-11-16',
    progress: 0,
    lastUpdate: '2023-11-12 02:00 PM',
    items: ['Gadgets'],
    notes: 'Address issue.',
    slaStatus: 'N/A',
    workflow: ['Requested', 'Rejected'],
    currentStage: 'Rejected',
    documents: [],
  },
  {
    id: 'DEL-005',
    customer: 'Eve Adams',
    partner: 'Swift Couriers',
    status: 'Exception',
    origin: 'Denver, CO',
    destination: 'Atlanta, GA',
    eta: '2023-11-19',
    progress: 50,
    lastUpdate: '2023-11-14 01:00 PM',
    items: ['Sporting Goods'],
    notes: 'Weather delay.',
    slaStatus: 'Breached',
    workflow: ['Requested', 'Approved', 'Picked Up', 'In Transit', 'Out for Delivery', 'Delivered'],
    currentStage: 'In Transit',
    documents: [{ name: 'Incident Report', url: '#', type: 'DOCX' }],
  },
];

const mockPartners = [
  {
    id: 'PART-001',
    name: 'Express Logistics',
    status: 'Approved',
    contact: 'John Doe',
    phone: '555-1234',
    email: 'john@express.com',
    deliveriesHandled: 1200,
    rating: 4.8,
    active: true,
  },
  {
    id: 'PART-002',
    name: 'Fast Ship Co.',
    status: 'In Progress',
    contact: 'Jane Smith',
    phone: '555-5678',
    email: 'jane@fastship.com',
    deliveriesHandled: 850,
    rating: 4.5,
    active: true,
  },
  {
    id: 'PART-003',
    name: 'Swift Couriers',
    status: 'Pending',
    contact: 'Robert Green',
    phone: '555-9012',
    email: 'robert@swift.com',
    deliveriesHandled: 600,
    rating: 4.2,
    active: false,
  },
];

const mockRequests = [
  {
    id: 'REQ-001',
    customer: 'Alice Johnson',
    type: 'New Delivery',
    status: 'Approved',
    requestedDate: '2023-11-10',
    approvalDate: '2023-11-11',
    items: 'Laptop, Monitor',
  },
  {
    id: 'REQ-002',
    customer: 'Bob Williams',
    type: 'Route Change',
    status: 'In Progress',
    requestedDate: '2023-11-12',
    items: 'Books, Clothing',
  },
  {
    id: 'REQ-003',
    customer: 'Charlie Davis',
    type: 'New Delivery',
    status: 'Pending',
    requestedDate: '2023-11-13',
    items: 'Artwork',
  },
];

const mockAuditLog = [
  { id: 1, timestamp: '2023-11-14 11:05 AM', user: 'Admin User', action: 'Delivery DEL-001 status updated to In Transit.', type: 'status_update' },
  { id: 2, timestamp: '2023-11-14 10:30 AM', user: 'System', action: 'SLA for DEL-002 flagged as Warning.', type: 'sla_alert' },
  { id: 3, timestamp: '2023-11-13 09:15 AM', user: 'Customer Alice Johnson', action: 'New delivery request REQ-001 submitted.', type: 'request_submission' },
  { id: 4, timestamp: '2023-11-12 04:00 PM', user: 'Admin User', action: 'Partner Swift Couriers activated.', type: 'partner_management' },
];

// --- Common UI Components ---

const Icon = ({ name, className = '' }) => (
  <svg className={`icon ${className}`} viewBox="0 0 24 24">
    {/* Placeholder SVG paths for illustrative purposes */}
    {name === 'search' && <path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0016 9.5a6.5 6.5 0 10-6.5 6.5c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>}
    {name === 'home' && <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/>}
    {name === 'truck' && <path d="M22 9V7h-2.23a2.996 2.996 0 00-5.54 0H5c-1.1 0-2 .9-2 2v6c0 1.1.9 2 2 2h1a2 2 0 100 4 2 2 0 000-4h8a2 2 0 100 4 2 2 0 000-4h1c1.1 0 2-.9 2-2v-3.37L23 12l-1-3zm-9 10a2 2 0 100-4 2 2 0 000 4zM7 19a2 2 0 100-4 2 2 0 000 4zM20 12l-1.42 1.42L18 12.84V10c0-.55-.45-1-1-1h-3V7c0-.55-.45-1-1-1h-2a1 1 0 00-1 1v2H9c-.55 0-1 .45-1 1v2.84l-.58.58L6 12l.58-.58L8 10.84V9h-.23a2.996 2.996 0 00-5.54 0H5c-1.1 0-2 .9-2 2v6c0 1.1.9 2 2 2h1a2 2 0 100 4 2 2 0 000-4h8a2 2 0 100 4 2 2 0 000-4h1c1.1 0 2-.9 2-2v-3.37L23 12l-1-3z"/>}
    {name === 'partner' && <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>}
    {name === 'request' && <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/>}
    {name === 'activity' && <path d="M13 3h-2v10h2V3zm4.5 15.5c-.97 0-1.87-.4-2.5-1.04v-3.51a.995.995 0 00-.99-.99H9.49c-.55 0-.99.44-.99.99v3.51c-.63.64-1.53 1.04-2.5 1.04-2.21 0-4 1.79-4 4h18c0-2.21-1.79-4-4-4z"/>}
    {name === 'settings' && <path d="M19.43 12.98c.04-.32.07-.64.07-.98s-.03-.66-.07-.98l2.11-1.65c.19-.15.24-.42.12-.64l-2-3.46c-.12-.22-.39-.3-.61-.22l-2.49 1c-.52-.4-1.09-.72-1.71-.98L14 2h-4L8.71 4.22c-.62.26-1.19.58-1.71.98l-2.49-1c-.22-.09-.49 0-.61.22l-2 3.46c-.12.22-.07.49.12.64l2.11 1.65c-.04.32-.07.65-.07.98s.03.66.07.98l-2.11 1.65c-.19.15-.24.42-.12.64l2 3.46c.12.22.39.3.61.22l2.49-1c.52.4 1.09.72 1.71.98L10 22h4l1.29-2.22c.62-.26 1.19-.58 1.71-.98l2.49 1c.22.09.49 0 .61-.22l2-3.46c.12-.22.07-.49-.12-.64l-2.11-1.65zM12 18c-3.31 0-6-2.69-6-6s2.69-6 6-6 6 2.69 6 6-2.69 6-6 6z"/>}
    {name === 'notification' && <path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6v-5c0-3.07-1.63-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.64 5.36 6 7.93 6 11v5l-2 2v1h16v-1l-2-2z"/>}
    {name === 'chart' && <path d="M19 11h-2V7h-4v10h4v-4h2v4h2V5h-4zM11 5H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h5V5zm-2 12H7V7h2v10z"/>}
    {name === 'document' && <path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z"/>}
    {name === 'milestone' && <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>}
    {name === 'user' && <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>}
  </svg>
);

const Header = ({ onSearchChange, currentRole, onRoleChange }) => (
  <header className="header">
    <div className="flex-row flex-center">
      <h1 className="header-title">Smart Delivery Tracking</h1>
      <div className="global-search-bar glassmorphism-surface">
        <Icon name="search" style={{ color: 'var(--color-slate-400)' }} />
        <input
          type="text"
          placeholder="Global Search (Deliveries, Partners, Requests...)"
          onChange={(e) => onSearchChange(e.target.value)}
          style={{ width: '100%', padding: 'var(--spacing-xs)', outline: 'none', background: 'transparent' }}
        />
      </div>
      <select className="role-switcher" value={currentRole} onChange={(e) => onRoleChange(e.target.value)}>
        {Object.values(ROLES).map(role => (
          <option key={role} value={role}>{role.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, c => c.toUpperCase())}</option>
        ))}
      </select>
    </div>
    <div className="flex-row flex-center gap-md">
      <button className="btn-outline">
        <Icon name="notification" />
      </button>
      <button className="btn-outline">
        <Icon name="settings" />
      </button>
      <button className="btn-outline">
        <Icon name="user" /> User Profile
      </button>
    </div>
  </header>
);

const Breadcrumbs = ({ path, onNavigate }) => (
  <nav className="breadcrumbs">
    <a href="#" onClick={() => onNavigate({ screen: 'DASHBOARD' })}>Home</a>
    {path.map((item, index) => (
      <React.Fragment key={index}>
        <span>/</span>
        {index < path.length - 1 ? (
          <a href="#" onClick={() => onNavigate(item.target)}>{item.label}</a>
        ) : (
          <span>{item.label}</span>
        )}
      </React.Fragment>
    ))}
  </nav>
);

const StatusBadge = ({ status }) => {
  let statusClass = '';
  switch (status) {
    case 'Approved': statusClass = 'status-approved'; break;
    case 'In Progress': statusClass = 'status-in-progress'; break;
    case 'Pending': statusClass = 'status-pending'; break;
    case 'Rejected': statusClass = 'status-rejected'; break;
    case 'Exception': statusClass = 'status-exception'; break;
    default: statusClass = 'status-slate-300'; break; // Default or unknown status
  }
  return (
    <span className={`status-badge ${statusClass}`}>
      {status}
    </span>
  );
};

const KPIWidget = ({ label, value, trend, isPulsing = false }) => (
  <div className={`kpi-widget ${isPulsing ? 'kpi-pulse-animation' : ''}`}>
    <div className="kpi-widget-value">
      {value}
      {trend && (
        <span style={{ fontSize: 'var(--font-size-sm)', marginLeft: 'var(--spacing-sm)', color: trend.startsWith('+') ? 'var(--color-primary-500)' : 'var(--color-accent-red)' }}>
          {trend}
        </span>
      )}
    </div>
    <div className="kpi-widget-label">{label}</div>
  </div>
);

const ChartContainer = ({ title, type }) => (
  <div className="chart-container">
    <Icon name="chart" style={{ fontSize: '3rem', marginBottom: 'var(--spacing-md)' }} />
    <span style={{ color: 'var(--color-slate-500)' }}>{title} ({type} Chart) - Data Visualization Placeholder</span>
  </div>
);

const MilestoneTracker = ({ workflowStages, currentStage, slaStatus }) => {
  const currentIndex = workflowStages?.indexOf(currentStage);

  const getSLAColor = (status) => {
    switch (status) {
      case 'On Track': return 'var(--color-primary-500)';
      case 'Warning': return 'var(--color-accent-orange)';
      case 'Critical': return 'var(--color-accent-red)';
      case 'Breached': return 'var(--color-accent-red)';
      default: return 'var(--color-slate-400)';
    }
  };

  return (
    <div className="milestone-tracker">
      <div className="milestone-line"></div>
      {workflowStages?.map((stage, index) => (
        <div key={stage} className="milestone-step">
          <div
            className={`milestone-dot ${index < currentIndex ? 'completed' : ''} ${index === currentIndex ? 'current' : ''}`}
          ></div>
          <span
            className={`milestone-label ${index < currentIndex ? 'completed' : ''} ${index === currentIndex ? 'current' : ''}`}
          >
            {stage}
          </span>
          {index === currentIndex && slaStatus && (
            <span style={{ fontSize: 'var(--font-size-xs)', marginTop: 'var(--spacing-xs)', color: getSLAColor(slaStatus), fontWeight: 'var(--font-weight-semibold)' }}>
              SLA: {slaStatus}
            </span>
          )}
        </div>
      ))}
    </div>
  );
};

const NewsFeed = ({ title, items, role }) => {
  const filteredItems = role === ROLES.CUSTOMER
    ? items.filter(item => item.type === 'request_submission') // Example filtering for Customer
    : items; // Admin sees all

  if (!filteredItems.length) {
    return null; // Or an empty state for the feed
  }

  return (
    <div className="news-feed">
      <h3 className="detail-section-title">{title}</h3>
      {filteredItems.map(item => (
        <div key={item.id} className="news-item">
          <div className="news-icon">
            <Icon name="activity" />
          </div>
          <div className="news-content">
            <div className="text-sm text-charcoal">{item.action}</div>
            <div className="news-meta">
              <strong>{item.user}</strong> on {item.timestamp}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

const EmptyState = ({ title, description, buttonText, onAction }) => (
  <div className="empty-state">
    <Icon name="truck" className="empty-state-icon" /> {/* Using truck for delivery system */}
    <h3 className="empty-state-title">{title}</h3>
    <p className="empty-state-description">{description}</p>
    {buttonText && onAction && (
      <button className="btn btn-primary" onClick={onAction}>{buttonText}</button>
    )}
  </div>
);

// --- Screen Components ---

const DashboardScreen = ({ onNavigate, currentUserRole }) => {
  const permissions = USER_PERMISSIONS[currentUserRole];

  const totalDeliveries = mockDeliveries.length;
  const inProgress = mockDeliveries.filter(d => d.status === 'In Progress').length;
  const completed = mockDeliveries.filter(d => d.status === 'Approved').length; // Assuming Approved means completed for KPI purposes
  const pending = mockDeliveries.filter(d => d.status === 'Pending').length;

  return (
    <div className="main-content">
      {permissions.canViewDashboard ? (
        <>
          <h2 style={{ fontSize: 'var(--font-size-2xl)', marginBottom: 'var(--spacing-xl)', color: 'var(--color-charcoal)' }}>
            Welcome, {currentUserRole.replace(/_/g, ' ')}!
          </h2>

          <div className="grid-cols-4 gap-lg mb-xl">
            <KPIWidget label="Total Deliveries" value={totalDeliveries} trend="+10%" isPulsing={true} />
            <KPIWidget label="In Progress" value={inProgress} trend="-2%" />
            <KPIWidget label="Completed (This Month)" value={completed} trend="+5%" />
            <KPIWidget label="Pending Requests" value={pending} trend="+1" />
          </div>

          <div className="flex-row flex-between mb-lg">
            <h3 style={{ fontSize: 'var(--font-size-xl)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--color-charcoal)' }}>
              Analytics & Trends
            </h3>
            <div className="flex-row gap-sm">
                <button className="btn btn-outline">Export to PDF</button>
                <button className="btn btn-outline">Export to Excel</button>
            </div>
          </div>

          <div className="grid-cols-2 gap-lg mb-xl">
            <ChartContainer title="Monthly Delivery Volume" type="Bar" />
            <ChartContainer title="SLA Compliance Rate" type="Donut" />
            <ChartContainer title="Avg. Delivery Time" type="Gauge" />
            <ChartContainer title="Real-time Route Optimization" type="Line" />
          </div>

          <div className="flex-row flex-between mb-lg">
            <h3 style={{ fontSize: 'var(--font-size-xl)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--color-charcoal)' }}>
              Recent Activities & Updates
            </h3>
            <div className="flex-row gap-sm">
                <button className="btn btn-primary">
                    <Icon name="activity" /> View All Activities
                </button>
            </div>
          </div>

          {mockDeliveries.length > 0 ? (
            <div className="grid-cols-3 gap-lg">
              {mockDeliveries.slice(0, 6).map(delivery => (
                <div
                  key={delivery.id}
                  className="card"
                  onClick={() => onNavigate({ screen: 'DELIVERY_DETAIL', params: { id: delivery.id } })}
                >
                  <div className="flex-between mb-sm">
                    <h4 style={{ fontSize: 'var(--font-size-lg)', fontWeight: 'var(--font-weight-semibold)', margin: 0 }}>
                      Delivery #{delivery.id}
                    </h4>
                    <StatusBadge status={delivery.status} />
                  </div>
                  <p className="text-sm text-slate-500 mb-sm">Customer: {delivery.customer}</p>
                  <p className="text-sm text-slate-500 mb-md">Destination: {delivery.destination}</p>
                  <div className="flex-between text-sm">
                    <span className="text-charcoal">ETA: {delivery.eta}</span>
                    <button className="btn btn-outline" style={{ fontSize: 'var(--font-size-sm)' }}>Track</button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              title="No Deliveries Yet"
              description="Start by placing a new delivery request or view available shipments."
              buttonText="Place New Request"
              onAction={() => onNavigate({ screen: 'NEW_REQUEST' })}
            />
          )}

          {/* Placeholder for other dashboard sections */}
          {permissions.canManageOperations && mockPartners.length > 0 && (
            <>
              <h3 style={{ fontSize: 'var(--font-size-xl)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--color-charcoal)', marginTop: 'var(--spacing-xl)', marginBottom: 'var(--spacing-lg)' }}>
                Logistics Partners Overview
              </h3>
              <div className="grid-cols-3 gap-lg">
                {mockPartners.slice(0,3).map(partner => (
                    <div
                        key={partner.id}
                        className="card"
                        onClick={() => onNavigate({ screen: 'PARTNER_DETAIL', params: { id: partner.id } })}
                    >
                        <div className="flex-between mb-sm">
                            <h4 style={{ fontSize: 'var(--font-size-lg)', fontWeight: 'var(--font-weight-semibold)', margin: 0 }}>
                                {partner.name}
                            </h4>
                            <StatusBadge status={partner.status} />
                        </div>
                        <p className="text-sm text-slate-500 mb-sm">Contact: {partner.contact}</p>
                        <p className="text-sm text-slate-500 mb-md">Handled: {partner.deliveriesHandled} deliveries</p>
                        <div className="flex-between text-sm">
                            <span className="text-charcoal">Rating: {partner.rating} / 5</span>
                            <button className="btn btn-outline" style={{ fontSize: 'var(--font-size-sm)' }}>Details</button>
                        </div>
                    </div>
                ))}
              </div>
            </>
          )}

        </>
      ) : (
        <EmptyState
          title="Access Denied"
          description="You do not have permission to view this dashboard."
        />
      )}
    </div>
  );
};

const DeliveryDetailScreen = ({ deliveryId, onNavigate, currentUserRole }) => {
  const delivery = mockDeliveries?.find(d => d.id === deliveryId);
  const permissions = USER_PERMISSIONS[currentUserRole];

  if (!delivery) {
    return (
      <EmptyState
        title="Delivery Not Found"
        description="The delivery you are looking for does not exist or you do not have access."
        buttonText="Back to Dashboard"
        onAction={() => onNavigate({ screen: 'DASHBOARD' })}
      />
    );
  }

  const breadcrumbsPath = [
    { label: 'Deliveries', target: { screen: 'DASHBOARD' } }, // Simplified for this example
    { label: delivery.id, target: { screen: 'DELIVERY_DETAIL', params: { id: delivery.id } } },
  ];

  const currentWorkflowStageIndex = delivery.workflow?.indexOf(delivery.currentStage);
  const progressPercentage = delivery.workflow ? ((currentWorkflowStageIndex + 1) / delivery.workflow.length) * 100 : 0;


  return (
    <div className="main-content">
      <Breadcrumbs path={breadcrumbsPath} onNavigate={onNavigate} />

      <div className="flex-between mb-md">
        <h2 style={{ fontSize: 'var(--font-size-2xl)', margin: 0, color: 'var(--color-charcoal)' }}>
          Delivery: {delivery.id}
        </h2>
        {permissions.canManageOperations && (
          <div className="flex-row gap-sm">
            <button className="btn btn-outline">Edit Delivery</button>
            <button className="btn btn-primary">Update Status</button>
          </div>
        )}
      </div>

      <div className="grid-cols-3 gap-lg mb-xl">
        <div className="glassmorphism-surface p-lg">
          <h3 className="detail-section-title">Summary</h3>
          <div className="detail-grid">
            <div className="detail-item">
              <div className="detail-item-label">Status</div>
              <div className="detail-item-value"><StatusBadge status={delivery.status} /></div>
            </div>
            <div className="detail-item">
              <div className="detail-item-label">Customer</div>
              <div className="detail-item-value">{delivery.customer}</div>
            </div>
            <div className="detail-item">
              <div className="detail-item-label">Logistics Partner</div>
              <div className="detail-item-value">{delivery.partner}</div>
            </div>
            <div className="detail-item">
              <div className="detail-item-label">Origin</div>
              <div className="detail-item-value">{delivery.origin}</div>
            </div>
            <div className="detail-item">
              <div className="detail-item-label">Destination</div>
              <div className="detail-item-value">{delivery.destination}</div>
            </div>
            <div className="detail-item">
              <div className="detail-item-label">Estimated ETA</div>
              <div className="detail-item-value">{delivery.eta}</div>
            </div>
          </div>
          <div style={{ marginTop: 'var(--spacing-md)' }}>
            <div className="detail-item-label mb-sm">Notes</div>
            <div className="text-sm text-charcoal">{delivery.notes || 'No notes provided.'}</div>
          </div>
        </div>

        <div className="glassmorphism-surface p-lg">
          <h3 className="detail-section-title">Current Progress ({progressPercentage.toFixed(0)}%)</h3>
          {delivery.workflow && (
            <MilestoneTracker
              workflowStages={delivery.workflow}
              currentStage={delivery.currentStage}
              slaStatus={delivery.slaStatus}
            />
          )}
          <div style={{ marginTop: 'var(--spacing-lg)' }}>
            <h4 style={{ fontSize: 'var(--font-size-md)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--color-charcoal)', marginBottom: 'var(--spacing-sm)' }}>
              SLA Tracking
            </h4>
            <p className="text-sm text-slate-500">
              Current SLA Status: <span style={{ color: getSLAColorForText(delivery.slaStatus), fontWeight: 'var(--font-weight-semibold)' }}>{delivery.slaStatus}</span>
            </p>
            {delivery.slaStatus === 'Breached' && (
              <p className="text-sm text-accent-red">Action required: SLA breached on {delivery.eta}.</p>
            )}
          </div>
        </div>

        <div className="glassmorphism-surface p-lg">
          <h3 className="detail-section-title">Related Information</h3>
          <div className="mb-lg">
            <h4 style={{ fontSize: 'var(--font-size-md)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--color-charcoal)', marginBottom: 'var(--spacing-sm)' }}>
              Items
            </h4>
            <ul style={{ margin: 0, padding: 0, listStyle: 'none' }}>
              {delivery.items?.map((item, index) => (
                <li key={index} className="text-sm text-charcoal" style={{ marginBottom: 'var(--spacing-xs)' }}>
                  <Icon name="activity" style={{ fontSize: '0.8em', marginRight: 'var(--spacing-xs)', color: 'var(--color-slate-400)' }} />
                  {item}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h4 style={{ fontSize: 'var(--font-size-md)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--color-charcoal)', marginBottom: 'var(--spacing-sm)' }}>
              Documents ({delivery.documents?.length || 0})
            </h4>
            {delivery.documents?.length > 0 ? (
              <ul style={{ margin: 0, padding: 0, listStyle: 'none' }}>
                {delivery.documents.map((doc, index) => (
                  <li key={index} className="text-sm text-charcoal" style={{ marginBottom: 'var(--spacing-xs)' }}>
                    <a href={doc.url} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center' }}>
                      <Icon name="document" style={{ marginRight: 'var(--spacing-xs)', color: 'var(--color-slate-500)' }} />
                      {doc.name} ({doc.type})
                    </a>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-slate-500">No documents attached.</p>
            )}
            {permissions.canManageOperations && (
                <button className="btn btn-outline" style={{ marginTop: 'var(--spacing-md)' }}>Upload Document</button>
            )}
          </div>
        </div>
      </div>

      {permissions.canViewDashboard && ( // Assuming audit logs are part of general dashboard view permissions
        <NewsFeed title="Activity Log" items={mockAuditLog.filter(log => log.action.includes(delivery.id))} role={currentUserRole} />
      )}
    </div>
  );
};

const PartnerDetailScreen = ({ partnerId, onNavigate, currentUserRole }) => {
  const partner = mockPartners?.find(p => p.id === partnerId);
  const permissions = USER_PERMISSIONS[currentUserRole];

  if (!partner || !permissions.canViewPartners) {
    return (
      <EmptyState
        title="Partner Not Found or Access Denied"
        description="The partner you are looking for does not exist or you do not have permission to view it."
        buttonText="Back to Dashboard"
        onAction={() => onNavigate({ screen: 'DASHBOARD' })}
      />
    );
  }

  const breadcrumbsPath = [
    { label: 'Partners', target: { screen: 'DASHBOARD' } }, // Simplified
    { label: partner.name, target: { screen: 'PARTNER_DETAIL', params: { id: partner.id } } },
  ];

  const getSLAColorForText = (status) => {
    switch (status) {
      case 'On Track': return 'var(--color-primary-700)';
      case 'Warning': return 'var(--color-accent-orange)';
      case 'Critical': return 'var(--color-accent-red)';
      case 'Breached': return 'var(--color-accent-red)';
      default: return 'var(--color-slate-600)';
    }
  };

  return (
    <div className="main-content">
      <Breadcrumbs path={breadcrumbsPath} onNavigate={onNavigate} />

      <div className="flex-between mb-md">
        <h2 style={{ fontSize: 'var(--font-size-2xl)', margin: 0, color: 'var(--color-charcoal)' }}>
          Logistics Partner: {partner.name}
        </h2>
        {permissions.canManageOperations && (
          <div className="flex-row gap-sm">
            <button className="btn btn-outline">Edit Partner</button>
            <button className="btn btn-primary">Activate/Deactivate</button>
          </div>
        )}
      </div>

      <div className="grid-cols-2 gap-lg mb-xl">
        <div className="glassmorphism-surface p-lg">
          <h3 className="detail-section-title">Partner Details</h3>
          <div className="detail-grid">
            <div className="detail-item">
              <div className="detail-item-label">Status</div>
              <div className="detail-item-value"><StatusBadge status={partner.status} /></div>
            </div>
            <div className="detail-item">
              <div className="detail-item-label">Contact Person</div>
              <div className="detail-item-value">{partner.contact}</div>
            </div>
            <div className="detail-item">
              <div className="detail-item-label">Phone</div>
              <div className="detail-item-value">{partner.phone}</div>
            </div>
            <div className="detail-item">
              <div className="detail-item-label">Email</div>
              <div className="detail-item-value">{partner.email}</div>
            </div>
            <div className="detail-item">
              <div className="detail-item-label">Deliveries Handled</div>
              <div className="detail-item-value">{partner.deliveriesHandled}</div>
            </div>
            <div className="detail-item">
              <div className="detail-item-label">Rating</div>
              <div className="detail-item-value">{partner.rating} / 5</div>
            </div>
          </div>
        </div>

        <div className="glassmorphism-surface p-lg">
          <h3 className="detail-section-title">Associated Deliveries</h3>
          {mockDeliveries.filter(d => d.partner === partner.name).length > 0 ? (
            <div>
              {mockDeliveries.filter(d => d.partner === partner.name).slice(0, 3).map(delivery => (
                <div
                  key={delivery.id}
                  className="card"
                  onClick={() => onNavigate({ screen: 'DELIVERY_DETAIL', params: { id: delivery.id } })}
                  style={{ padding: 'var(--spacing-md)' }}
                >
                  <div className="flex-between mb-sm">
                    <span className="text-charcoal font-bold">Delivery #{delivery.id}</span>
                    <StatusBadge status={delivery.status} />
                  </div>
                  <p className="text-sm text-slate-500">To: {delivery.destination} | ETA: {delivery.eta}</p>
                </div>
              ))}
              {mockDeliveries.filter(d => d.partner === partner.name).length > 3 && (
                <button className="btn btn-outline" style={{ marginTop: 'var(--spacing-md)' }}>View All {partner.name} Deliveries</button>
              )}
            </div>
          ) : (
            <p className="text-sm text-slate-500">No recent deliveries by this partner.</p>
          )}
        </div>
      </div>

      {permissions.canViewDashboard && (
        <NewsFeed title="Partner Activity Log" items={mockAuditLog.filter(log => log.action.includes(partner.name))} role={currentUserRole} />
      )}
    </div>
  );
};

const NewRequestScreen = ({ onNavigate, currentUserRole }) => {
  const permissions = USER_PERMISSIONS[currentUserRole];

  if (!permissions.canPlaceRequest) {
    return (
      <EmptyState
        title="Access Denied"
        description="You do not have permission to place new delivery requests."
        buttonText="Back to Dashboard"
        onAction={() => onNavigate({ screen: 'DASHBOARD' })}
      />
    );
  }

  const breadcrumbsPath = [
    { label: 'Dashboard', target: { screen: 'DASHBOARD' } },
    { label: 'New Delivery Request', target: { screen: 'NEW_REQUEST' } },
  ];

  // Placeholder for form submission handler
  const handleSubmit = (e) => {
    e.preventDefault();
    alert('New delivery request submitted! (Simulated)');
    onNavigate({ screen: 'DASHBOARD' }); // Redirect to dashboard after submission
  };

  return (
    <div className="main-content">
      <Breadcrumbs path={breadcrumbsPath} onNavigate={onNavigate} />

      <h2 style={{ fontSize: 'var(--font-size-2xl)', margin: 0, marginBottom: 'var(--spacing-xl)', color: 'var(--color-charcoal)' }}>
        Place New Delivery Request
      </h2>

      <div className="glassmorphism-surface p-xl" style={{ maxWidth: '800px', margin: '0 auto' }}>
        <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-lg)' }}>
          <div className="flex-col gap-sm">
            <label htmlFor="customerName" className="text-sm font-semibold">Customer Name <span style={{ color: 'var(--color-accent-red)' }}>*</span></label>
            <input type="text" id="customerName" required placeholder="e.g., Jane Doe" />
          </div>
          <div className="flex-col gap-sm">
            <label htmlFor="origin" className="text-sm font-semibold">Origin Address <span style={{ color: 'var(--color-accent-red)' }}>*</span></label>
            <input type="text" id="origin" required placeholder="e.g., 123 Main St, Anytown" />
          </div>
          <div className="flex-col gap-sm">
            <label htmlFor="destination" className="text-sm font-semibold">Destination Address <span style={{ color: 'var(--color-accent-red)' }}>*</span></label>
            <input type="text" id="destination" required placeholder="e.g., 456 Oak Ave, Anycity" />
          </div>
          <div className="flex-col gap-sm">
            <label htmlFor="deliveryDate" className="text-sm font-semibold">Requested Delivery Date <span style={{ color: 'var(--color-accent-red)' }}>*</span></label>
            <input type="date" id="deliveryDate" required />
          </div>
          <div className="flex-col gap-sm">
            <label htmlFor="items" className="text-sm font-semibold">Items to Deliver <span style={{ color: 'var(--color-accent-red)' }}>*</span></label>
            <textarea id="items" rows="3" required placeholder="e.g., 1x Laptop, 2x Monitor, Fragile"></textarea>
          </div>
          <div className="flex-col gap-sm">
            <label htmlFor="notes" className="text-sm font-semibold">Special Notes</label>
            <textarea id="notes" rows="3" placeholder="e.g., Handle with care, deliver after 2 PM"></textarea>
          </div>
          <div className="flex-col gap-sm" style={{ gridColumn: 'span 2' }}>
            <label htmlFor="fileUpload" className="text-sm font-semibold">Attach Documents</label>
            <input type="file" id="fileUpload" multiple />
          </div>
          <div style={{ gridColumn: 'span 2', display: 'flex', justifyContent: 'flex-end', gap: 'var(--spacing-md)', marginTop: 'var(--spacing-lg)' }}>
            <button type="button" className="btn btn-outline" onClick={() => onNavigate({ screen: 'DASHBOARD' })}>Cancel</button>
            <button type="submit" className="btn btn-primary">Submit Request</button>
          </div>
        </form>
      </div>
    </div>
  );
};


// Helper function for SLA color text
const getSLAColorForText = (status) => {
  switch (status) {
    case 'On Track': return 'var(--color-primary-700)';
    case 'Warning': return 'var(--color-accent-orange)';
    case 'Critical': return 'var(--color-accent-red)';
    case 'Breached': return 'var(--color-accent-red)';
    default: return 'var(--color-slate-600)';
  }
};


// --- Main Application Component ---
function App() {
  const [view, setView] = useState({ screen: 'DASHBOARD', params: {} });
  const [currentUserRole, setCurrentUserRole] = useState(ROLES.OPERATIONS_ADMIN); // Default to Admin for comprehensive view
  const [globalSearchTerm, setGlobalSearchTerm] = useState('');

  const handleCardClick = ({ screen, params }) => {
    setView({ screen, params });
  };

  const handleGlobalSearchChange = (term) => {
    setGlobalSearchTerm(term);
    // In a real app, this would trigger a global search API call and update displayed data
    console.log(`Global search term: ${term}`);
  };

  const handleRoleChange = (newRole) => {
    setCurrentUserRole(newRole);
    setView({ screen: 'DASHBOARD', params: {} }); // Reset to dashboard on role change
  };

  const renderScreen = () => {
    switch (view.screen) {
      case 'DASHBOARD':
        return <DashboardScreen onNavigate={handleCardClick} currentUserRole={currentUserRole} />;
      case 'DELIVERY_DETAIL':
        return <DeliveryDetailScreen deliveryId={view.params?.id} onNavigate={handleCardClick} currentUserRole={currentUserRole} />;
      case 'PARTNER_DETAIL':
        return <PartnerDetailScreen partnerId={view.params?.id} onNavigate={handleCardClick} currentUserRole={currentUserRole} />;
      case 'NEW_REQUEST':
        return <NewRequestScreen onNavigate={handleCardClick} currentUserRole={currentUserRole} />;
      default:
        return <DashboardScreen onNavigate={handleCardClick} currentUserRole={currentUserRole} />;
    }
  };

  return (
    <div className="app-container">
      <Header
        onSearchChange={handleGlobalSearchChange}
        currentRole={currentUserRole}
        onRoleChange={handleRoleChange}
      />
      {renderScreen()}
    </div>
  );
}

export default App;