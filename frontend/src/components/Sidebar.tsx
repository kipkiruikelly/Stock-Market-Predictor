import React, { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { 
  Activity, Briefcase, BarChart2, BookOpen, Settings, Cpu, Zap, Search, Layers, 
  ShieldCheck, Users, Sliders, ShieldAlert, DollarSign, Ticket, ChevronDown, ChevronRight, ToggleLeft, ToggleRight, PieChart,
  ChevronLeft, X
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface SidebarProps {
  mobileOpen?: boolean;
  onMobileClose?: () => void;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  mobileOpen = false,
  onMobileClose,
  collapsed = false,
  onToggleCollapse
}) => {
  const { user } = useAuth();
  const location = useLocation();
  const isAdminView = location.pathname.startsWith('/admin');
  
  const [enterpriseMode, setEnterpriseMode] = useState<boolean>(true);
  const [hoveredSection, setHoveredSection] = useState<string | null>(null);

  // Initialize expanded sections based on current route
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    'Dashboard': location.pathname.startsWith('/dashboard'),
    'Trading': location.pathname.startsWith('/trading') || location.pathname === '/live' || location.pathname === '/markets' || location.pathname === '/bots' || location.pathname === '/tools',
    'Portfolio': location.pathname.startsWith('/portfolio'),
    'Research Lab': location.pathname.startsWith('/researchlab') || location.pathname === '/research',
    'Machine Learning': location.pathname.includes('models') || location.pathname.includes('experiments'),
    'Operations': location.pathname === '/screener' || location.pathname === '/settings',
    'Executive': location.pathname.startsWith('/executive'),
    'Administration': location.pathname.startsWith('/admin'),
    'Knowledge Center': location.pathname.startsWith('/knowledge')
  });

  const sidebarStructure: Record<string, any[]> = {
    "Dashboard": [
      {"name": "Market Overview", "route": "/dashboard/market-overview"}
    ],
    "Trading": [
      {"name": "Trading Strategies", "route": "/trading/strategies"},
      {"name": "Trading Supervisor", "route": "/trading/supervisor"},
      {"name": "Positions PMS", "route": "/trading/positions"},
      {"name": "Orders OMS", "route": "/trading/orders"},
      {"name": "Smart Execution", "route": "/trading/smartexecution"},
      {"name": "Trading Signals", "route": "/trading/signals"},
      {"name": "Trading Performance", "route": "/trading/performance"},
      {"name": "Trading Terminal", "route": "/trading/tradingterminal"},
      {"name": "Markets Analytics", "route": "/trading/marketanalytics"},
      {"name": "AI Robots", "route": "/trading/airobots"},
      {"name": "Strategy Tools", "route": "/trading/strategytools"}
    ],
    "Portfolio": [
      {"name": "Holdings", "route": "/portfolio/holdings"},
      {"name": "Analytics", "route": "/portfolio/analytics"},
      {"name": "Allocation", "route": "/portfolio/allocation"},
      {"name": "Performance", "route": "/portfolio/performance"},
      {"name": "Risk Analysis", "route": "/portfolio/risk"}
    ],
    "Research Lab": [
      {"name": "Research Projects", "route": "/researchlab/projects"},
      {"name": "Data Catalog", "route": "/researchlab/datasets"},
      {"name": "ETL Pipelines", "route": "/researchlab/datapipeline"}
    ],
    "Machine Learning": [
      {"name": "Experiment Tracker", "route": "/researchlab/experiments"},
      {"name": "AI Model Inventory", "route": "/researchlab/models"},
      {"name": "Model Governance Registry", "route": "/researchlab/modelregistry"}
    ],
    "Operations": [
      {"name": "Screener Monitor", "route": "/screener"},
      {"name": "Settings Controls", "route": "/settings"}
    ],
    "Executive": [
      {"name": "Executive Command Center", "route": "/executive/dashboard"},
      {"name": "Business Analytics", "route": "/executive/business-analytics"},
      {"name": "Growth Planning", "route": "/executive/growth"},
      {"name": "Cloud FinOps", "route": "/executive/cloud-costs"}
    ],
    "Administration": [
      {"name": "User Management", "route": "/admin/users"},
      {"name": "RBAC Roles", "route": "/admin/roles"},
      {"name": "Tenant Organizations", "route": "/admin/organizations"},
      {"name": "Feature Flags", "route": "/admin/feature-flags"},
      {"name": "API Key Manager", "route": "/admin/api-keys"},
      {"name": "Billing Console", "route": "/admin/billing"},
      {"name": "System Settings", "route": "/admin/settings"}
    ],
    "Knowledge Center": [
      {"name": "Documentation Portal", "route": "/knowledge/documentation"},
      {"name": "API Explorer", "route": "/knowledge/api-explorer"},
      {"name": "SRE Runbooks", "route": "/knowledge/runbooks"},
      {"name": "User Guide", "route": "/knowledge/user-guide"},
      {"name": "Admin Guide", "route": "/knowledge/admin-guide"}
    ]
  };

  // Expand parent section automatically when route changes
  useEffect(() => {
    Object.keys(sidebarStructure).forEach(section => {
      const items = sidebarStructure[section];
      if (items.some(item => location.pathname === item.route)) {
        setExpandedSections(prev => ({ ...prev, [section]: true }));
      }
    });
  }, [location.pathname]);

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const getSectionIcon = (section: string) => {
    switch(section) {
      case 'Dashboard': return <Layers size={18} className="text-nexus-pur shrink-0" />;
      case 'Trading': return <Zap size={18} className="text-yellow-400 shrink-0" />;
      case 'Portfolio': return <Briefcase size={18} className="text-emerald-400 shrink-0" />;
      case 'Research Lab': return <Search size={18} className="text-blue-400 shrink-0" />;
      case 'Machine Learning': return <Cpu size={18} className="text-indigo-400 shrink-0" />;
      case 'Operations': return <Settings size={18} className="text-slate-400 shrink-0" />;
      case 'Executive': return <DollarSign size={18} className="text-amber-400 shrink-0" />;
      case 'Administration': return <Users size={18} className="text-pink-400 shrink-0" />;
      case 'Knowledge Center': return <BookOpen size={18} className="text-teal-400 shrink-0" />;
      default: return <Activity size={18} className="shrink-0" />;
    }
  };

  const legacyNavItems = isAdminView ? [
    { name: 'Overview', path: '/admin?tab=overview', icon: <Layers size={20} /> },
    { name: 'Client & User Management', path: '/admin?tab=client-management', icon: <Users size={20} /> },
    { name: 'TOMS/OMS Control', path: '/admin?tab=trade-management', icon: <Sliders size={20} /> },
    { name: 'Risk & Exposure', path: '/admin?tab=risk-management', icon: <ShieldAlert size={20} /> },
    { name: 'Finance & Ledgers', path: '/admin?tab=finance-accounting', icon: <DollarSign size={20} /> },
    { name: 'Promo & Gift Codes', path: '/admin?tab=gift-codes', icon: <Ticket size={20} /> },
    { name: 'System Admin & Settings', path: '/admin?tab=system-admin', icon: <Settings size={20} /> },
  ] : [
    { name: 'Trading Strategies', path: '/trading/strategies', icon: <Sliders size={20} /> },
    { name: 'Trading Supervisor', path: '/trading/supervisor', icon: <ShieldCheck size={20} /> },
    { name: 'Positions Management (PMS)', path: '/trading/positions', icon: <PieChart size={20} /> },
    { name: 'Order Management (OMS)', path: '/trading/orders', icon: <Layers size={20} /> },
    { name: 'Smart Execution', path: '/trading/smartexecution', icon: <Cpu size={20} /> },
    { name: 'Trading Signals', path: '/trading/signals', icon: <Zap size={20} /> },
    { name: 'Performance Dashboard', path: '/portfolio', icon: <Briefcase size={20} /> },
    { name: 'Trading Terminal', path: '/live', icon: <Zap size={20} /> },
    { name: 'Journal', path: '/journal', icon: <BookOpen size={20} /> },
    { name: 'Markets', path: '/markets', icon: <BarChart2 size={20} /> },
    { name: 'Research', path: '/research', icon: <Search size={20} /> },
    { name: 'Screener', path: '/screener', icon: <Activity size={20} /> },
    { name: 'AI Robots', path: '/bots', icon: <Cpu size={20} /> },
    { name: 'AI Workflows', path: '/pipeline', icon: <Layers size={20} /> },
    { name: 'Strategy Tools', path: '/tools', icon: <Zap size={20} /> },
    { name: 'Settings', path: '/settings', icon: <Settings size={20} /> },
  ];

  if (!isAdminView && user && user.role_level >= 3 && !enterpriseMode) {
    legacyNavItems.push({ name: 'Admin Console', path: '/admin', icon: <ShieldCheck size={20} /> });
  }

  // Common inner content
  const sidebarContent = (
    <div className="flex flex-col h-full w-full bg-nexus-sf border-r border-nexus-border select-none">
      
      {/* Header Controls */}
      <div className="p-3 border-b border-nexus-border flex items-center justify-between shrink-0">
        {!collapsed && (
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-nexus-white uppercase tracking-wider">
              {isAdminView ? 'Admin Console' : 'Navigation'}
            </span>
          </div>
        )}

        {/* Mobile Close Button */}
        {mobileOpen && (
          <button 
            onClick={onMobileClose}
            className="p-2 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg hover:bg-nexus-bg text-nexus-muted hover:text-white transition cursor-pointer"
            aria-label="Close navigation menu"
          >
            <X size={20} />
          </button>
        )}

        {/* Desktop Collapse Toggle Button */}
        {!mobileOpen && onToggleCollapse && (
          <button 
            onClick={onToggleCollapse}
            className="p-1.5 min-w-[36px] min-h-[36px] flex items-center justify-center rounded-lg hover:bg-nexus-bg text-nexus-muted hover:text-white transition cursor-pointer ml-auto"
            title={collapsed ? "Expand Sidebar (Ctrl+B)" : "Collapse Sidebar (Ctrl+B)"}
            aria-label={collapsed ? "Expand Sidebar" : "Collapse Sidebar"}
          >
            {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          </button>
        )}
      </div>

      {/* Mode Switcher */}
      {!isAdminView && !collapsed && (
        <div className="px-3 py-2 border-b border-nexus-border/60 flex items-center justify-between bg-nexus-bg/40">
          <span className="text-[10px] font-bold text-nexus-muted uppercase tracking-wider">Layout Format</span>
          <button 
            onClick={() => setEnterpriseMode(!enterpriseMode)}
            className="flex items-center gap-1.5 px-2 py-1 rounded bg-nexus-bg hover:bg-nexus-bg2 text-nexus-white transition cursor-pointer min-h-[36px]"
            title="Switch between Enterprise Workspaces and Legacy List"
          >
            {enterpriseMode ? (
              <>
                <ToggleRight size={16} className="text-nexus-pur" />
                <span className="text-[10px] font-bold text-nexus-pur">Enterprise</span>
              </>
            ) : (
              <>
                <ToggleLeft size={16} className="text-nexus-muted" />
                <span className="text-[10px] font-bold text-nexus-muted">Standard</span>
              </>
            )}
          </button>
        </div>
      )}

      {/* Main Navigation Scroll Region */}
      <div className="flex-1 overflow-y-auto py-3 px-2 space-y-2 custom-scrollbar">
        {enterpriseMode && !isAdminView ? (
          <div className="flex flex-col gap-2">
            {Object.keys(sidebarStructure).map((section) => {
              const isExpanded = !!expandedSections[section];
              const items = sidebarStructure[section] || [];
              const hasActiveChild = items.some((item: any) => location.pathname === item.route);

              if (collapsed) {
                return (
                  <div 
                    key={section} 
                    className="relative group flex justify-center py-2"
                    onMouseEnter={() => setHoveredSection(section)}
                    onMouseLeave={() => setHoveredSection(null)}
                  >
                    <button 
                      onClick={() => toggleSection(section)}
                      className={`p-2.5 rounded-xl transition flex items-center justify-center min-w-[44px] min-h-[44px] ${
                        hasActiveChild ? 'bg-nexus-pur/20 border border-nexus-pur/40 shadow-lg' : 'hover:bg-nexus-bg'
                      }`}
                      aria-label={section}
                    >
                      {getSectionIcon(section)}
                    </button>

                    {/* Tooltip Overlay on Collapsed Sidebar */}
                    {hoveredSection === section && (
                      <div className="absolute left-full top-0 ml-2 w-52 bg-nexus-sf border border-nexus-border rounded-xl shadow-2xl p-2 z-[999] flex flex-col gap-1 animate-fadeIn">
                        <div className="text-[11px] font-bold text-nexus-white uppercase border-b border-nexus-border/50 pb-1.5 px-2 flex items-center gap-2">
                          {getSectionIcon(section)}
                          <span>{section}</span>
                        </div>
                        <div className="flex flex-col gap-0.5 pt-1">
                          {items.map((item: any) => (
                            <NavLink
                              key={item.name}
                              to={item.route}
                              onClick={onMobileClose}
                              className={({ isActive }) => 
                                `px-2.5 py-1.5 rounded text-xs transition ${
                                  isActive ? 'bg-nexus-pur text-white font-bold' : 'text-nexus-muted hover:text-white hover:bg-nexus-bg'
                                }`
                              }
                            >
                              {item.name}
                            </NavLink>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              }

              return (
                <div key={section} className="border border-nexus-border/30 rounded-xl overflow-hidden bg-nexus-bg/20 transition-all duration-200">
                  <button 
                    onClick={() => toggleSection(section)}
                    className="w-full flex items-center justify-between px-3 py-2.5 hover:bg-nexus-bg transition cursor-pointer min-h-[44px]"
                    aria-expanded={isExpanded}
                  >
                    <div className="flex items-center gap-2.5">
                      {getSectionIcon(section)}
                      <span className={`text-xs font-bold tracking-wide ${hasActiveChild ? 'text-nexus-pur font-black' : 'text-nexus-white'}`}>
                        {section}
                      </span>
                    </div>
                    {isExpanded ? (
                      <ChevronDown size={14} className="text-nexus-muted" />
                    ) : (
                      <ChevronRight size={14} className="text-nexus-muted" />
                    )}
                  </button>

                  {isExpanded && (
                    <div className="flex flex-col border-t border-nexus-border/30 bg-nexus-bg/10 px-2 py-1 space-y-0.5">
                      {items.map((item: any) => (
                        <NavLink
                          key={item.name}
                          to={item.route}
                          onClick={onMobileClose}
                          className={({ isActive }) => 
                            `flex items-center gap-2.5 px-3 py-2 rounded-lg text-[11px] transition min-h-[38px] ${
                              isActive 
                                ? 'bg-nexus-pur/20 text-nexus-pur font-bold border-l-2 border-nexus-pur shadow-sm' 
                                : 'text-nexus-muted hover:text-nexus-white hover:bg-nexus-bg/50'
                            }`
                          }
                        >
                          <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${location.pathname === item.route ? 'bg-nexus-pur' : 'bg-nexus-muted/40'}`} />
                          <span className="truncate">{item.name}</span>
                        </NavLink>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <nav className="flex flex-col gap-1.5">
            {legacyNavItems.map((item) => (
              <NavLink
                key={item.name}
                to={item.path}
                onClick={onMobileClose}
                className={() => {
                  const isItemActive = isAdminView
                    ? location.search === item.path.substring(6) || (location.search === '' && item.path.endsWith('overview'))
                    : location.pathname === item.path;
                  return `flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-all min-h-[44px] ${
                    isItemActive 
                      ? 'bg-nexus-pur/20 text-nexus-pur font-bold border-l-2 border-nexus-pur' 
                      : 'text-nexus-muted hover:text-nexus-white hover:bg-nexus-bg'
                  }`;
                }}
              >
                {item.icon}
                {!collapsed && <span className="font-medium text-xs">{item.name}</span>}
              </NavLink>
            ))}
          </nav>
        )}
      </div>

      {isAdminView && !collapsed && (
        <div className="p-3 border-t border-nexus-border shrink-0">
          <NavLink
            to="/portfolio"
            onClick={onMobileClose}
            className="flex items-center justify-center gap-2 w-full py-2.5 bg-nexus-pur hover:bg-nexus-pur/80 text-white font-bold text-xs rounded-xl transition cursor-pointer min-h-[44px]"
          >
            ← Return to Workspace
          </NavLink>
        </div>
      )}
    </div>
  );

  // Render Off-Canvas Mobile Drawer vs Regular Desktop Sidebar
  if (mobileOpen) {
    return (
      <div className="fixed inset-0 z-[1000] flex lg:hidden">
        {/* Backdrop Overlay */}
        <div 
          className="fixed inset-0 bg-black/70 backdrop-blur-sm transition-opacity duration-300 animate-fadeIn" 
          onClick={onMobileClose}
          aria-hidden="true"
        />

        {/* Off-Canvas Drawer */}
        <div className="relative w-72 max-w-[85vw] h-full shadow-2xl z-[1001] animate-slideRight">
          {sidebarContent}
        </div>
      </div>
    );
  }

  return (
    <aside 
      className={`hidden lg:flex h-full transition-all duration-300 shrink-0 z-40 ${
        collapsed ? 'w-16' : 'w-64'
      }`}
    >
      {sidebarContent}
    </aside>
  );
};
