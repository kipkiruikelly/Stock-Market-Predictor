import { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { 
  Activity, Briefcase, BarChart2, BookOpen, Settings, Cpu, Zap, Search, Layers, 
  ShieldCheck, Users, Sliders, ShieldAlert, DollarSign, Ticket, ChevronDown, ChevronRight, ToggleLeft, ToggleRight
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { apiFetch } from '../utils/api';

export const Sidebar: React.FC = () => {
  const { user } = useAuth();
  const location = useLocation();
  const isAdminView = location.pathname.startsWith('/admin');
  
  const [enterpriseMode, setEnterpriseMode] = useState<boolean>(true);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    'Dashboard': false,
    'Trading': true,
    'Portfolio': true,
    'Research Lab': false,
    'Machine Learning': false,
    'Operations': false,
    'Executive': false,
    'Administration': false,
    'Knowledge Center': false
  });

  const [sidebarStructure, setSidebarStructure] = useState<Record<string, any[]>>({
    "Dashboard": [
      {"name": "Market Overview", "route": "/markets"}
    ],
    "Trading": [
      {"name": "Orders OMS", "route": "/trading/orders"},
      {"name": "Smart Execution", "route": "/trading/smartexecution"},
      {"name": "Trading Signals", "route": "/trading/signals"},
      {"name": "Performance", "route": "/portfolio"},
      {"name": "Trading Terminal", "route": "/live"},
      {"name": "Markets Analytics", "route": "/markets"},
      {"name": "AI Robots", "route": "/bots"},
      {"name": "Strategy Tools", "route": "/tools"}
    ],
    "Portfolio": [
      {"name": "Holdings", "route": "/portfolio"},
      {"name": "Performance", "route": "/portfolio"},
      {"name": "Risk Analysis", "route": "/tools"}
    ],
    "Research Lab": [
      {"name": "Search Projects", "route": "/research"},
      {"name": "Feature Pipelines", "route": "/pipeline"}
    ],
    "Machine Learning": [
      {"name": "AI Workflows", "route": "/pipeline"},
      {"name": "AI Robots", "route": "/bots"}
    ],
    "Operations": [
      {"name": "Screener Monitor", "route": "/screener"},
      {"name": "Settings Controls", "route": "/settings"}
    ],
    "Executive": [
      {"name": "Journal Overview", "route": "/journal"}
    ],
    "Administration": [
      {"name": "Client Console", "route": "/admin"}
    ],
    "Knowledge Center": [
      {"name": "Journal Documentation", "route": "/journal"}
    ]
  });

  useEffect(() => {
    const fetchSidebar = async () => {
      try {
        const res = await apiFetch('/api/institutional/optimization/navigation-audit');
        if (res?.ok && res?.navigation_accessibility_audit?.sidebar_structure) {
          const struct = res.navigation_accessibility_audit.sidebar_structure;
          const mappedStruct: Record<string, any[]> = {};
          Object.keys(struct).forEach(key => {
            mappedStruct[key] = struct[key].map((item: any) => {
              let route = item.route;
              if (route.startsWith('/trading/market') || route.startsWith('/dashboard/market')) route = '/markets';
              else if (route.startsWith('/trading/strategies')) route = '/tools';
              else if (route.startsWith('/trading/execution') || route.startsWith('/trading/orders') || route.startsWith('/trading/positions')) route = '/live';
              else if (route.startsWith('/portfolio')) route = '/portfolio';
              else if (route.startsWith('/research/pipelines')) route = '/pipeline';
              else if (route.startsWith('/research')) route = '/research';
              else if (route.startsWith('/ml/predictions') || route.startsWith('/ml/health')) route = '/bots';
              else if (route.startsWith('/ops/center') || route.startsWith('/ops/incidents')) route = '/screener';
              else if (route.startsWith('/admin')) route = '/admin';
              else if (route.startsWith('/knowledge')) route = '/journal';
              else if (route.startsWith('/executive')) route = '/portfolio';
              return { ...item, route };
            });
          });
          setSidebarStructure(mappedStruct);
        }
      } catch (e) {
        console.error("Failed to fetch dynamic navigation audit sidebar structure", e);
      }
    };
    fetchSidebar();
  }, []);

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const getSectionIcon = (section: string) => {
    switch(section) {
      case 'Dashboard': return <Layers size={18} className="text-nexus-pur" />;
      case 'Trading': return <Zap size={18} className="text-yellow-400" />;
      case 'Portfolio': return <Briefcase size={18} className="text-emerald-400" />;
      case 'Research Lab': return <Search size={18} className="text-blue-400" />;
      case 'Machine Learning': return <Cpu size={18} className="text-indigo-400" />;
      case 'Operations': return <Settings size={18} className="text-slate-400" />;
      case 'Executive': return <DollarSign size={18} className="text-amber-400" />;
      case 'Administration': return <Users size={18} className="text-pink-400" />;
      case 'Knowledge Center': return <BookOpen size={18} className="text-teal-400" />;
      default: return <Activity size={18} />;
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

  return (
    <div className="w-64 h-full bg-nexus-sf border-r border-nexus-border flex flex-col shrink-0">
      {!isAdminView && (
        <div className="p-4 border-b border-nexus-border flex items-center justify-between">
          <span className="text-xs font-bold text-nexus-muted tracking-wider uppercase">Layout Configuration</span>
          <button 
            onClick={() => setEnterpriseMode(!enterpriseMode)}
            className="flex items-center gap-1.5 px-2 py-1 rounded bg-nexus-bg hover:bg-nexus-bg2 text-nexus-white transition cursor-pointer"
            title="Switch layout format between standard and 8 core enterprise spaces"
          >
            {enterpriseMode ? (
              <>
                <ToggleRight size={18} className="text-nexus-pur" />
                <span className="text-[10px] font-bold text-nexus-pur">Enterprise</span>
              </>
            ) : (
              <>
                <ToggleLeft size={18} className="text-nexus-muted" />
                <span className="text-[10px] font-bold text-nexus-muted">Standard</span>
              </>
            )}
          </button>
        </div>
      )}

      <div className="flex-1 overflow-y-auto py-4">
        {enterpriseMode && !isAdminView ? (
          <div className="flex flex-col gap-3 px-4">
            {Object.keys(sidebarStructure).map((section) => {
              const isExpanded = !!expandedSections[section];
              const items = sidebarStructure[section] || [];
              return (
                <div key={section} className="border border-nexus-border/30 rounded-lg overflow-hidden bg-nexus-bg/20">
                  <button 
                    onClick={() => toggleSection(section)}
                    className="w-full flex items-center justify-between px-3 py-2.5 hover:bg-nexus-bg transition cursor-pointer"
                  >
                    <div className="flex items-center gap-2.5">
                      {getSectionIcon(section)}
                      <span className="text-xs font-bold text-nexus-white tracking-wide">{section}</span>
                    </div>
                    {isExpanded ? (
                      <ChevronDown size={14} className="text-nexus-muted" />
                    ) : (
                      <ChevronRight size={14} className="text-nexus-muted" />
                    )}
                  </button>

                  {isExpanded && (
                    <div className="flex flex-col border-t border-nexus-border/30 bg-nexus-bg/5 px-2 py-1">
                      {items.map((item: any) => (
                        <NavLink
                          key={item.name}
                          to={item.route}
                          className={({ isActive }) => 
                            `flex items-center gap-2 px-3 py-2 rounded text-[11px] transition ${
                              isActive 
                                ? 'bg-nexus-pur/20 text-nexus-pur font-bold' 
                                : 'text-nexus-muted hover:text-nexus-white hover:bg-nexus-bg/50'
                            }`
                          }
                        >
                          <div className="w-1.5 h-1.5 rounded-full bg-nexus-pur/55 shrink-0" />
                          <span>{item.name}</span>
                        </NavLink>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <nav className="flex flex-col gap-2 px-4">
            {legacyNavItems.map((item) => (
              <NavLink
                key={item.name}
                to={item.path}
                className={() => {
                  const isItemActive = isAdminView
                    ? location.search === item.path.substring(6) || (location.search === '' && item.path.endsWith('overview'))
                    : location.pathname === item.path;
                  return `flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                    isItemActive 
                      ? 'bg-nexus-bg2 text-nexus-pur' 
                      : 'text-nexus-muted hover:text-nexus-white hover:bg-nexus-bg'
                  }`;
                }}
              >
                {item.icon}
                <span className="font-medium text-xs md:text-sm">{item.name}</span>
              </NavLink>
            ))}
          </nav>
        )}
      </div>

      {isAdminView && (
        <div className="p-4 border-t border-nexus-border">
          <NavLink
            to="/portfolio"
            className="flex items-center justify-center gap-2 w-full py-2.5 bg-nexus-pur hover:bg-nexus-pur/80 text-white font-bold text-xs rounded-xl transition cursor-pointer"
          >
            ← Return to Workspace
          </NavLink>
        </div>
      )}
    </div>
  );
};
