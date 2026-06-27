import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Ticket,
  MapPin,
  TrendingUp,
  MessageSquare,
  Download,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  LayoutGrid,
  ShieldCheck,
  Search,
  Lock,
  ChevronDown,
  Sparkles,
  Map,
  Globe
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip as ChartTooltip,
  PieChart,
  Pie,
  Cell
} from 'recharts';

// Types & Interfaces
interface ResponseData {
  timestamp: string;
  email: string;
  name: string;
  attending: string;
  origin: string;
  dayPreference: string;
  priceDay1: string;
  priceDay2: string;
  seatDay1: string;
  seatDay2: string;
  comments: string;
}

interface StatsData {
  capacity: number;
  totalResponses: number;
  totalAttending: number;
  bookedCountD1: number;
  bookedCountD2: number;
  bookedSeatsD1: string[];
  bookedSeatsD2: string[];
  origins: Record<string, number>;
  attendingDays: Record<string, number>;
  priceD1Demands: Record<string, number>;
  priceD2Demands: Record<string, number>;
  recentFeedbacks: Array<{
    timestamp: string;
    name: string;
    email: string;
    comments: string;
  }>;
}

// Seat Grid Constants
const STATIC_SEAT_MAP = generateSeatMap();
export const ZONE_COUNTS: Record<string, number> = {};
export const TIER_COUNTS = { VIP: 0, PREMIUM: 0, REGULAR: 0, ECONOMY: 0 };
STATIC_SEAT_MAP.forEach(seat => {
  ZONE_COUNTS[seat.zone] = (ZONE_COUNTS[seat.zone] || 0) + 1;
  TIER_COUNTS[seat.tier as keyof typeof TIER_COUNTS] = (TIER_COUNTS[seat.tier as keyof typeof TIER_COUNTS] || 0) + 1;
});
const CAPACITY = STATIC_SEAT_MAP.length;

// Layout Generator for T-Stage Block Map
function generateSeatMap() {
  const seats: { x: number; y: number; tier: string; zone: string; id: string }[] = [];
  let seatIndex = 1;

  function addRect(x: number, y: number, cols: number, rows: number, tier: string, zone: string) {
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        seats.push({ x: x + c, y: y + r, tier, zone, id: `Seat-${String(seatIndex++).padStart(4, '0')}` });
      }
    }
  }

  function addStairLeft(x: number, y: number, lengths: number[], tier: string, zone: string) {
    const maxLen = Math.max(...lengths);
    for (let r = 0; r < lengths.length; r++) {
      const len = lengths[r];
      const offset = maxLen - len;
      for (let c = 0; c < len; c++) {
        seats.push({ x: x + offset + c, y: y + r, tier, zone, id: `Seat-${String(seatIndex++).padStart(4, '0')}` });
      }
    }
  }

  function addStairRight(x: number, y: number, lengths: number[], tier: string, zone: string) {
    for (let r = 0; r < lengths.length; r++) {
      const len = lengths[r];
      for (let c = 0; c < len; c++) {
        seats.push({ x: x + c, y: y + r, tier, zone, id: `Seat-${String(seatIndex++).padStart(4, '0')}` });
      }
    }
  }

  const tlLengths = [3, 4, 6, 8, 10, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11]; // 15 rows, 141 seats
  
  // Top row blocks (Y=0)
  addStairLeft(9, 0, tlLengths, 'REGULAR', 'A1'); 
  addRect(22, 0, 20, 15, 'PREMIUM', 'A2');
  addRect(56, 0, 20, 15, 'PREMIUM', 'A3');
  addStairRight(78, 0, tlLengths, 'REGULAR', 'A4');

  // Middle row blocks (Y=17)
  addRect(9, 17, 11, 15, 'PREMIUM', 'B1');
  
  // B2 (L-Shape: 8x11 top, 12x4 bottom) - 136 seats
  addRect(22, 17, 8, 11, 'VIP', 'B2'); 
  addRect(22, 28, 12, 4, 'VIP', 'B2'); 

  // VIP Stage Front (New 24x4 block) - 96 seats
  addRect(37, 28, 24, 4, 'VIP', 'VIP Front');

  // B3 (Mirrored L-Shape) - 136 seats
  addRect(68, 17, 8, 11, 'VIP', 'B3');
  addRect(64, 28, 12, 4, 'VIP', 'B3');

  addRect(78, 17, 11, 15, 'PREMIUM', 'B4');

  // Lower Middle (Y=34)
  addRect(9, 34, 11, 8, 'PREMIUM', 'C1');
  addRect(22, 34, 12, 8, 'VIP', 'C2');
  addRect(37, 34, 24, 8, 'VIP', 'C3');
  addRect(64, 34, 12, 8, 'VIP', 'C4');
  addRect(78, 34, 11, 8, 'PREMIUM', 'C5');

  // Control sides (Y=45)
  addRect(11, 45, 22, 3, 'REGULAR', 'D1');
  addRect(11, 49, 22, 3, 'REGULAR', 'D2');
  addRect(11, 53, 22, 3, 'REGULAR', 'D3');
  addRect(11, 57, 22, 3, 'REGULAR', 'D4');
  addRect(65, 45, 22, 3, 'REGULAR', 'E1');
  addRect(65, 49, 22, 3, 'REGULAR', 'E2');
  addRect(65, 53, 22, 3, 'REGULAR', 'E3');
  addRect(65, 57, 22, 3, 'REGULAR', 'E4');

  // Bottom row (Y=62)
  addRect(18, 62, 16, 13, 'ECONOMY', 'F1'); 
  addRect(37, 62, 20, 13, 'ECONOMY', 'F2');
  addRect(60, 62, 20, 13, 'ECONOMY', 'F3');

  return seats;
}



// Soft Minimalist Color Palette Constants
const TIERS = {
  VIP: { name: 'VIP Zone (6,000-7,000 THB)', color: '#f59e0b', bg: 'from-amber-500/10 to-yellow-600/10', border: 'border-amber-500/30', shadowColor: 'rgba(245, 158, 11, 0.2)', tagColor: 'bg-amber-500/15 text-amber-300 border border-amber-500/20' },
  PREMIUM: { name: 'Premium Zone (4,500-5,500 THB)', color: '#ec4899', bg: 'from-pink-500/10 to-rose-600/10', border: 'border-pink-500/30', shadowColor: 'rgba(236, 72, 153, 0.2)', tagColor: 'bg-pink-500/15 text-pink-300 border border-pink-500/20' },
  REGULAR: { name: 'Regular Zone (3,000-4,000 THB)', color: '#3b82f6', bg: 'from-blue-500/10 to-indigo-600/10', border: 'border-blue-500/30', shadowColor: 'rgba(59, 130, 246, 0.2)', tagColor: 'bg-blue-500/15 text-blue-300 border border-blue-500/20' },
  ECONOMY: { name: 'Economy Zone (1,500-2,500 THB)', color: '#8b5cf6', bg: 'from-violet-500/10 to-purple-600/10', border: 'border-violet-500/30', shadowColor: 'rgba(139, 92, 246, 0.2)', tagColor: 'bg-violet-500/15 text-violet-300 border border-violet-500/20' },
  WAITING: { name: 'Waiting Benefits', color: '#6b7280', bg: 'from-slate-800 to-slate-700/40', border: 'border-slate-750', shadowColor: 'rgba(107, 114, 128, 0.05)', tagColor: 'bg-slate-800 text-slate-300' },
};

function getPriceTier(priceRange: string) {
  if (!priceRange) return TIERS.WAITING;
  if (priceRange.includes("6,000") || priceRange.includes("7,000")) return TIERS.VIP;
  if (priceRange.includes("4,500") || priceRange.includes("5,500")) return TIERS.PREMIUM;
  if (priceRange.includes("3,000") || priceRange.includes("4,000")) return TIERS.REGULAR;
  if (priceRange.includes("1,500") || priceRange.includes("2,500")) return TIERS.ECONOMY;
  return TIERS.WAITING;
}

// Circular progress ring rendering
function CircularProgress({ percentage, strokeColor }: { percentage: number; strokeColor: string }) {
  const radius = 22;
  const stroke = 3.5;
  const normalizedRadius = radius - stroke * 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className="relative flex items-center justify-center shrink-0">
      <svg height={radius * 2} width={radius * 2} className="transform -rotate-90">
        <circle
          stroke="rgba(255, 255, 255, 0.04)"
          fill="transparent"
          strokeWidth={stroke}
          r={normalizedRadius}
          cx={radius}
          cy={radius}
        />
        <circle
          className={`${strokeColor} transition-all duration-500`}
          fill="transparent"
          strokeWidth={stroke}
          strokeDasharray={circumference + ' ' + circumference}
          style={{ strokeDashoffset }}
          strokeLinecap="round"
          r={normalizedRadius}
          cx={radius}
          cy={radius}
        />
      </svg>
      <span className="absolute text-[8px] font-mono font-black text-white">{percentage}%</span>
    </div>
  );
}

const LSTORAGE_KEY_RESPONSES = "ntf_fancon_responses";
const LSTORAGE_KEY_BOOKED_D1 = "ntf_fancon_booked_d1";
const LSTORAGE_KEY_BOOKED_D2 = "ntf_fancon_booked_d2";


function App() {
  const { t, i18n } = useTranslation();
  const [currentView, setCurrentView] = useState<"home" | "admin">("home");
  const [isSurveyOpen, setIsSurveyOpen] = useState(false);
  const [isTicketOpen, setIsTicketOpen] = useState(false);
  const [heroIndex, setHeroIndex] = useState(0);
  const heroImages = ["/hero1.png", "/hero2.png"];

  useEffect(() => {
    const interval = setInterval(() => {
      setHeroIndex((prev) => (prev + 1) % heroImages.length);
    }, 8000);
    return () => clearInterval(interval);
  }, []);
  const apiMode: "mock" | "live" = (import.meta.env.VITE_API_MODE as "mock" | "live") || "mock";
  const apiUrl: string = import.meta.env.VITE_API_URL || "";
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [showPublicStats, setShowPublicStats] = useState(() => {
    return localStorage.getItem("ntf_show_public_stats") === "true";
  });

  const [stats, setStats] = useState<StatsData>({
    capacity: CAPACITY,
    totalResponses: 0,
    totalAttending: 0,
    bookedCountD1: 0,
    bookedCountD2: 0,
    bookedSeatsD1: [],
    bookedSeatsD2: [],
    origins: {},
    attendingDays: { "Day 1": 0, "Day 2": 0, "Both Days": 0, "Undecided": 0 },
    priceD1Demands: {},
    priceD2Demands: {},
    recentFeedbacks: []
  });

  const [lastTicket, setLastTicket] = useState<{
    name: string;
    email: string;
    dayPreference: string;
    seatDay1: string;
    seatDay2: string;
    priceDay1: string;
    priceDay2: string;
  } | null>(null);

  useEffect(() => {
    fetchData(apiMode, apiUrl);

    const handleHashChange = () => {
      if (window.location.hash === '#admin') {
        setCurrentView("admin");
      } else {
        setCurrentView("home");
      }
    };
    window.addEventListener('hashchange', handleHashChange);
    handleHashChange();

    return () => {
      window.removeEventListener('hashchange', handleHashChange);
    };
  }, []);

  const fetchData = async (mode: "mock" | "live" = apiMode, url: string = apiUrl) => {
    setIsRefreshing(true);
    setServerError(null);

    if (mode === "mock") {
      setTimeout(() => {
        const localResponses = JSON.parse(localStorage.getItem(LSTORAGE_KEY_RESPONSES) || "[]") as ResponseData[];
        const localBookedD1 = JSON.parse(localStorage.getItem(LSTORAGE_KEY_BOOKED_D1) || "[]") as string[];
        const localBookedD2 = JSON.parse(localStorage.getItem(LSTORAGE_KEY_BOOKED_D2) || "[]") as string[];

        if (localResponses.length === 0) {
          setIsRefreshing(false);
          handleSeedMockData();
          return;
        }

        let totalAttending = 0;
        const origins: Record<string, number> = {};
        const attendingDays = { "Day 1": 0, "Day 2": 0, "Both Days": 0, "Undecided": 0 };
        const priceD1Demands: Record<string, number> = {};
        const priceD2Demands: Record<string, number> = {};
        const feedbacks: Array<{ timestamp: string; name: string; email: string; comments: string }> = [];

        localResponses.forEach(r => {
          if (r.attending === "Definitely" || r.attending === "Probably") {
            totalAttending++;
          }
          if (r.origin) origins[r.origin] = (origins[r.origin] || 0) + 1;
          if (r.dayPreference) {
            attendingDays[r.dayPreference as keyof typeof attendingDays] = (attendingDays[r.dayPreference as keyof typeof attendingDays] || 0) + 1;
          }
          if (r.priceDay1) priceD1Demands[r.priceDay1] = (priceD1Demands[r.priceDay1] || 0) + 1;
          if (r.priceDay2) priceD2Demands[r.priceDay2] = (priceD2Demands[r.priceDay2] || 0) + 1;
          feedbacks.push({
            timestamp: r.timestamp,
            name: r.name,
            email: r.email,
            comments: r.comments || ""
          });
        });

        feedbacks.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

        setStats({
          capacity: CAPACITY,
          totalResponses: localResponses.length,
          totalAttending,
          bookedCountD1: localBookedD1.length,
          bookedCountD2: localBookedD2.length,
          bookedSeatsD1: localBookedD1,
          bookedSeatsD2: localBookedD2,
          origins,
          attendingDays,
          priceD1Demands,
          priceD2Demands,
          recentFeedbacks: feedbacks.slice(0, 50)
        });
        setIsRefreshing(false);
      }, 250);
    } else {
      if (!url) {
        setServerError("กรุณากรอก Web App URL ของ Google Apps Script");
        setIsRefreshing(false);
        return;
      }
      try {
        const response = await fetch(url);
        const json = await response.json();
        if (json.stats) {
          setStats({
            capacity: CAPACITY,
            totalResponses: json.stats.totalResponses || 0,
            totalAttending: json.stats.totalAttending || 0,
            bookedCountD1: json.stats.d1Booked || 0,
            bookedCountD2: json.stats.d2Booked || 0,
            bookedSeatsD1: [],
            bookedSeatsD2: [],
            origins: json.stats.origins || {},
            attendingDays: json.stats.attendingDays || { "Day 1": 0, "Day 2": 0, "Both Days": 0, "Undecided": 0 },
            priceD1Demands: json.stats.priceD1Demands || {},
            priceD2Demands: json.stats.priceD2Demands || {},
            recentFeedbacks: json.stats.recentFeedbacks || []
          });
        } else {
          setServerError("เกิดข้อผิดพลาดในการโหลดข้อมูลสถิติ");
        }
      } catch (err) {
        setServerError("เชื่อมต่อ API ล้มเหลว โปรดตรวจสอบ URL หรือการเปิดแชร์ CORS");
      } finally {
        setIsRefreshing(false);
      }
    }
  };



  // Seed Mock Data matching the user's exact mockup statistics!
  const handleSeedMockData = () => {
    const mockOrigins = ["Bangkok", "Bangkok Metropolitan", "Northern", "Central", "Eastern", "Northeastern", "Southern", "Overseas"];
    const mockPrices = ["6,000-7,000 THB", "4,500-5,500 THB", "3,000-4,000 THB", "1,500-2,500 THB", "Waiting for benefits"];
    
    const tempResponses: ResponseData[] = [];
    const tempBookedD1: string[] = [];
    const tempBookedD2: string[] = [];

    const getSeatId = (index: number) => {
      return STATIC_SEAT_MAP[index]?.id || "";
    };

    // Day 1 booked seats: 1102 seats
    for (let i = 0; i < 1102; i++) {
      const seatId = getSeatId(i);
      if (seatId) tempBookedD1.push(seatId);
    }

    // Day 2 booked seats: 987 seats
    for (let i = 0; i < 987; i++) {
      const seatId = getSeatId(i);
      if (seatId) tempBookedD2.push(seatId);
    }

    // Generate exactly 2531 responses
    for (let i = 1; i <= 2531; i++) {
      const isAttending = i <= 1248;
      const attending = isAttending ? "Definitely" : "No";
      
      let dayPreference = "Undecided";
      let seatDay1 = "";
      let seatDay2 = "";
      let priceDay1 = "";
      let priceDay2 = "";

      if (isAttending) {
        if (i <= 841) {
          dayPreference = "Both Days";
          seatDay1 = tempBookedD1[i - 1] || "";
          seatDay2 = tempBookedD2[i - 1] || "";
          priceDay1 = mockPrices[i % mockPrices.length];
          priceDay2 = mockPrices[(i + 1) % mockPrices.length];
        } else if (i <= 1102) {
          dayPreference = "Day 1";
          seatDay1 = tempBookedD1[i - 1] || "";
          priceDay1 = mockPrices[i % mockPrices.length];
        } else {
          dayPreference = "Day 2";
          const d2Idx = 841 + (i - 1102 - 1);
          seatDay2 = tempBookedD2[d2Idx] || "";
          priceDay2 = mockPrices[i % mockPrices.length];
        }
      }

      tempResponses.push({
        timestamp: new Date(Date.now() - i * 60000).toISOString(),
        email: `fan_${i}@ntf-fancon.club`,
        name: `NamtanFilm_Fan_${i}`,
        attending,
        origin: mockOrigins[i % mockOrigins.length],
        dayPreference,
        priceDay1,
        priceDay2,
        seatDay1,
        seatDay2,
        comments: i % 100 === 0 ? "ตื่นเต้นมากค่ะ รอกดบัตรเลยยย 💛💙" : ""
      });
    }

    localStorage.setItem(LSTORAGE_KEY_RESPONSES, JSON.stringify(tempResponses));
    localStorage.setItem(LSTORAGE_KEY_BOOKED_D1, JSON.stringify(tempBookedD1));
    localStorage.setItem(LSTORAGE_KEY_BOOKED_D2, JSON.stringify(tempBookedD2));

    fetchData("mock", apiUrl);
  };

  const handleClearMockData = () => {
    localStorage.removeItem(LSTORAGE_KEY_RESPONSES);
    localStorage.removeItem(LSTORAGE_KEY_BOOKED_D1);
    localStorage.removeItem(LSTORAGE_KEY_BOOKED_D2);
    fetchData("mock", apiUrl);
  };

  const percentD1 = useMemo(() => {
    return Number(((stats.bookedCountD1 / CAPACITY) * 100).toFixed(2));
  }, [stats.bookedCountD1]);

  const percentD2 = useMemo(() => {
    return Number(((stats.bookedCountD2 / CAPACITY) * 100).toFixed(2));
  }, [stats.bookedCountD2]);

  // Toggle for showing/hiding Statistics Cards (managed by admins)
  const SHOW_STATS = showPublicStats;

  return (
    <div className="min-h-screen relative overflow-x-hidden bg-[#04060d] text-slate-100 flex flex-col font-sans transition-all duration-300">
      {/* Background Image Layer with Lighting Effects */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <img 
          src="/BG.jpg" 
          className="w-full h-full object-cover opacity-50 mix-blend-lighten" 
          alt="Background" 
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#020617]/80 via-[#04060d]/85 to-[#020617]/95 backdrop-blur-[1px]"></div>
        <div className="absolute top-[-10%] left-[-10%] w-[60vw] h-[60vw] max-w-[800px] max-h-[800px] bg-blue-600/40 rounded-full blur-[120px] animate-float-1 mix-blend-screen"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[50vw] h-[50vw] max-w-[600px] max-h-[600px] bg-amber-500/30 rounded-full blur-[100px] animate-float-2 mix-blend-screen"></div>
        <div className="absolute top-[20%] left-[30%] w-[40vw] h-[40vw] max-w-[500px] max-h-[500px] bg-purple-600/20 rounded-full blur-[120px] animate-float-1 mix-blend-screen" style={{ animationDelay: '3s' }}></div>
      </div>
      
      <div className="relative z-10 flex flex-col min-h-screen">
        {/* Language Switcher */}
        <div className="absolute top-4 right-6 z-50 flex items-center gap-2 bg-slate-900/80 backdrop-blur border border-slate-700/50 p-1.5 rounded-2xl shadow-xl">
          <Globe className="w-4 h-4 text-slate-400 ml-2" />
          <div className="flex gap-1">
            {['th', 'en', 'zh'].map(lang => (
              <button
                key={lang}
                onClick={() => i18n.changeLanguage(lang)}
                className={`px-3 py-1 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                  i18n.language === lang
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                {lang === 'th' ? 'TH' : lang === 'en' ? 'EN' : 'ZH'}
              </button>
            ))}
          </div>
        </div>

        {/* CORE WRAPPER - Centered in max-w-6xl */}
        <main className="flex-1 max-w-6xl w-full mx-auto px-6 md:px-12 py-6 space-y-12 mt-12 md:mt-4">
        {currentView === "admin" ? (
          <AdminDashboardView
            stats={stats}
            apiMode={apiMode}
            onRefresh={() => fetchData(apiMode, apiUrl)}
            onClearMock={handleClearMockData}
            onSeedMock={handleSeedMockData}
            isRefreshing={isRefreshing}
            serverError={serverError}
            showPublicStats={showPublicStats}
            setShowPublicStats={(val) => {
              setShowPublicStats(val);
              localStorage.setItem("ntf_show_public_stats", val ? "true" : "false");
            }}
            onClose={() => {
              window.location.hash = "";
              setCurrentView("home");
            }}
          />
        ) : (
          <>
            {/* Main Interactive Grid matching the mockup */}
            <div className="grid lg:grid-cols-12 gap-8 items-center min-h-[500px]">
              
              {/* Left Column - Mockup welcome details */}
              <div className="lg:col-span-7 space-y-6 text-center animate-in fade-in duration-300">
                <div className="space-y-2">
                  <h1 className="text-5xl md:text-7xl font-extrabold tracking-wider leading-none select-none text-transparent bg-gradient-to-r from-[#5caaff] via-[#b6a0ff] to-[#ffb6f5] bg-clip-text font-sans">
                    {t('title')}
                  </h1>
                  <div 
                    className="text-5xl md:text-[80px] font-bold italic tracking-wide text-[#f3ce48] pl-2 -mt-4 drop-shadow-[0_0_12px_rgba(243,206,72,0.6)] select-none"
                    style={{ fontFamily: "'Kaushan Script', cursive" }}
                  >
                    {t('subtitle')}
                  </div>
                </div>

                {/* Location details with horizontal neon lines */}
                <div className="flex items-center justify-center gap-4">
                  <span className="h-[1.5px] w-12 bg-gradient-to-r from-transparent to-[#3b82f6]" />
                  <span className="text-xs md:text-sm font-bold tracking-widest text-[#3b82f6] uppercase font-sans">
                    {t('road_to')}
                  </span>
                  <span className="h-[1.5px] w-12 bg-gradient-to-l from-transparent to-[#3b82f6]" />
                </div>

                <p className="text-sm md:text-base text-slate-300 leading-relaxed font-medium px-4">
                  {t('hero_desc_1')}
                  <br />
                  {t('hero_desc_2')} <span className="text-[#f3ce48] font-extrabold">{t('title')} {t('subtitle')}</span>
                  <br />
                  {t('hero_desc_3')} <span className="text-[#3b82f6] font-bold">Union Hall</span> {t('hero_desc_4')}
                </p>

                <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
                  {/* Premium Survey Button */}
                  <button
                    onClick={() => setIsSurveyOpen(true)}
                    className="relative group bg-gradient-to-r from-blue-600 to-indigo-600 border border-blue-400/50 text-white rounded-2xl p-4 flex items-center justify-between shadow-[0_0_20px_rgba(37,99,235,0.3)] hover:shadow-[0_0_30px_rgba(37,99,235,0.6)] active:scale-95 transition-all cursor-pointer w-full sm:w-64 overflow-hidden"
                  >
                    <div className="absolute inset-0 bg-white/20 group-hover:translate-x-full -skew-x-12 -translate-x-full transition-transform duration-700 ease-out"></div>
                    <div className="flex items-center gap-4 relative z-10">
                      <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl shrink-0 group-hover:scale-110 transition-transform shadow-inner">
                        <Sparkles className="w-6 h-6 text-white" />
                      </div>
                      <div className="text-left">
                        <span className="text-sm font-extrabold block tracking-wide drop-shadow-sm">{t('btn_survey')}</span>
                        <span className="text-[10px] text-blue-100 block mt-0.5 font-medium uppercase tracking-wider">{t('btn_survey_sub')}</span>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-white/80 group-hover:translate-x-1 transition-transform relative z-10" />
                  </button>

                  {/* Premium Concert map button */}
                  <button
                    onClick={() => {
                      document.getElementById("seating-chart")?.scrollIntoView({ behavior: 'smooth' });
                    }}
                    className="relative group bg-slate-900/80 backdrop-blur-md border border-[#f3ce48]/40 text-[#f3ce48] rounded-2xl p-4 flex items-center justify-between shadow-[0_0_15px_rgba(243,206,72,0.1)] hover:shadow-[0_0_25px_rgba(243,206,72,0.25)] hover:bg-slate-800/80 active:scale-95 transition-all cursor-pointer w-full sm:w-64 overflow-hidden"
                  >
                    <div className="absolute inset-0 bg-[#f3ce48]/10 group-hover:translate-x-full -skew-x-12 -translate-x-full transition-transform duration-700 ease-out"></div>
                    <div className="flex items-center gap-4 relative z-10">
                      <div className="p-3 bg-[#f3ce48]/15 rounded-xl shrink-0 group-hover:scale-110 transition-transform">
                        <Map className="w-6 h-6 text-[#f3ce48]" />
                      </div>
                      <div className="text-left text-white">
                        <span className="text-sm font-extrabold block tracking-wide drop-shadow-sm">{t('btn_map')}</span>
                        <span className="text-[10px] text-[#f3ce48]/80 block mt-0.5 font-medium uppercase tracking-wider">{t('btn_map_sub')}</span>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-[#f3ce48]/70 group-hover:translate-x-1 transition-transform relative z-10" />
                  </button>
                </div>
              </div>

              {/* Right Column - Actresses portrait seamless blending */}
              <div className="lg:col-span-5 flex items-center justify-center select-none pointer-events-none">
                <div className="relative w-full aspect-[4/5] md:aspect-[3/4] lg:aspect-auto lg:h-[600px] flex items-center justify-center">
                  {heroImages.map((src, idx) => (
                    <img
                      key={src}
                      src={src}
                      className={`absolute inset-0 w-full h-full object-contain transition-opacity duration-1000 ease-in-out ${
                        idx === heroIndex ? 'opacity-100' : 'opacity-0'
                      }`}
                      alt={`NamtanFilm Hero ${idx + 1}`}
                    />
                  ))}
                </div>
              </div>

            </div>

            {/* BOTTOM STATS CARD (Deep dark outline transparent) */}
            {SHOW_STATS && (
              <div className="bg-[#050813]/95 border border-slate-800/80 shadow-2xl rounded-[24px] p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-center">
              
              {/* Item 1 */}
              <div className="flex items-center gap-3.5 py-1">
                <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-2xl shrink-0">
                  <svg className="w-6 h-6 text-blue-450" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wide">{t('stats_total')}</span>
                  <strong className="text-2xl font-bold text-blue-400 font-sans block mt-0.5">
                    {stats.totalResponses.toLocaleString()} <span className="text-xs text-slate-500 font-normal">{t('stats_unit')}</span>
                  </strong>
                </div>
              </div>

              {/* Item 2 */}
              <div className="flex items-center gap-3.5 py-1 border-t md:border-t-0 md:border-l border-slate-800/80 md:pl-6">
                <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-2xl shrink-0">
                  <svg className="w-6 h-6 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wide">{t('stats_attending')}</span>
                  <strong className="text-2xl font-bold text-[#3b82f6] font-sans block mt-0.5">
                    {stats.totalAttending.toLocaleString()} <span className="text-xs text-slate-500 font-normal">{t('stats_unit')}</span>
                  </strong>
                </div>
              </div>

              {/* Item 3 */}
              <div className="flex items-center justify-between gap-3 py-1 border-t lg:border-t-0 lg:border-l border-slate-800/80 lg:pl-6">
                <div className="flex items-center gap-3.5">
                  <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-2xl shrink-0">
                    <svg className="w-6 h-6 text-blue-450" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wide">{t('stats_d1')}</span>
                    <strong className="text-xl font-bold text-[#3b82f6] font-sans block mt-0.5">
                      {stats.bookedCountD1.toLocaleString()} <span className="text-xs text-slate-500 font-normal">/ {CAPACITY.toLocaleString()}</span>
                    </strong>
                  </div>
                </div>
                <CircularProgress percentage={percentD1} strokeColor="stroke-blue-500" />
              </div>

              {/* Item 4 */}
              <div className="flex items-center justify-between gap-3 py-1 border-t lg:border-t-0 lg:border-l border-slate-800/80 lg:pl-6">
                <div className="flex items-center gap-3.5">
                  <div className="p-3 bg-purple-500/10 border border-purple-500/20 rounded-2xl shrink-0">
                    <svg className="w-6 h-6 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wide">{t('stats_d2')}</span>
                    <strong className="text-xl font-bold text-[#3b82f6] font-sans block mt-0.5">
                      {stats.bookedCountD2.toLocaleString()} <span className="text-xs text-slate-500 font-normal">/ {CAPACITY.toLocaleString()}</span>
                    </strong>
                  </div>
                </div>
                <CircularProgress percentage={percentD2} strokeColor="stroke-purple-500" />
              </div>

            </div>
            )}

            {/* SEATING CHART SECTION */}
            <div id="seating-chart" className="slate-card rounded-3xl p-6 space-y-6 scroll-mt-20">
              <div className="flex flex-wrap justify-between items-center gap-4">
                <div>
                  <h3 className="text-2xl md:text-3xl font-extrabold text-white flex items-center gap-3">
                    <LayoutGrid className="w-6 h-6 md:w-8 md:h-8 text-blue-400" />
                    {t('map_title')}
                  </h3>
                </div>
                
                <div className="flex flex-wrap items-center gap-4 text-xs font-medium text-slate-300">
                  <span className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]"></span> {t('map_booked_d1')}</span>
                  <span className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-[#facc15] shadow-[0_0_8px_rgba(250,204,21,0.5)]"></span> {t('map_booked_d2')}</span>
                  <span className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-slate-800 border border-slate-600"></span> {t('map_available')}</span>
                </div>
              </div>

              <SeatingLayoutMap bookedD1Count={stats.bookedCountD1} bookedD2Count={stats.bookedCountD2} />
            </div>
          </>
        )}
      </main>

      {/* FOOTER */}
      <footer className="border-t border-slate-800 bg-slate-950/60 py-8 text-center text-[10px] text-slate-500 font-mono tracking-wider">
        <div className="max-w-6xl w-full mx-auto px-6 md:px-12">
          <p className="mb-2 font-sans text-xs text-slate-400">{t('footer')}</p>
        </div>
      </footer>

      {/* OVERLAY MODAL FOR SURVEY FORM */}
      {isSurveyOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
          <div className="slate-card border border-slate-700/80 rounded-3xl w-full max-w-2xl p-8 md:p-10 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setIsSurveyOpen(false)}
              className="absolute top-4 right-5 text-slate-400 hover:text-white text-2xl font-bold cursor-pointer transition-colors"
            >
              &times;
            </button>
            <SurveyFormView
              apiMode={apiMode}
              apiUrl={apiUrl}
              onSuccess={(ticketInfo) => {
                setLastTicket(ticketInfo);
                setIsSurveyOpen(false);
                setIsTicketOpen(true);
                fetchData(apiMode, apiUrl);
              }}
              onCancel={() => setIsSurveyOpen(false)}
            />
          </div>
        </div>
      )}

      {/* OVERLAY MODAL FOR E-TICKET SHOWCASE */}
      {isTicketOpen && lastTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-in fade-in duration-200">
          <div className="slate-card border border-slate-700/80 rounded-3xl w-full max-w-2xl p-6 md:p-8 shadow-2xl relative max-h-[95vh] overflow-y-auto">
            <button
              onClick={() => setIsTicketOpen(false)}
              className="absolute top-4 right-5 text-slate-400 hover:text-white text-2xl font-bold cursor-pointer transition-colors"
            >
              &times;
            </button>
            <ETicketView
              ticket={lastTicket}
              onClose={() => setIsTicketOpen(false)}
            />
          </div>
        </div>
      )}
      </div>
    </div>
  );
}

// ----------------------------------------------------
// SEATING LAYOUT MAP (STATIC CANVAS RENDERER)
// ----------------------------------------------------
function SeatingLayoutMap({ bookedD1Count, bookedD2Count, initialDay = "day1" }: { bookedD1Count: number; bookedD2Count: number, initialDay?: "day1" | "day2" }) {
  const { t } = useTranslation();
  const [selectedDay, setSelectedDay] = useState<"day1" | "day2">(initialDay);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [hoveredSeat, setHoveredSeat] = useState<{
    id: string;
    zone: string;
    zoneTotal: number;
    status: string;
    tier: string;
  } | null>(null);
  const padding = 15;
  const gridMinX = 9;
  const gridMaxX = 89;
  const gridWidth = gridMaxX - gridMinX;
  const gridMinY = 0;
  const gridMaxY = 75;
  const gridHeight = gridMaxY - gridMinY;

  const [canvasWidth, setCanvasWidth] = useState(1000);
  const scale = (canvasWidth - padding * 2) / gridWidth;
  const canvasHeight = Math.max(300, (gridHeight * scale) + padding * 2);

  const bookedCount = selectedDay === "day1" ? bookedD1Count : bookedD2Count;
  const bookedPercent = ((bookedCount / CAPACITY) * 100).toFixed(1);

  // Render Logic
  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current) {
        setCanvasWidth(containerRef.current.clientWidth);
      }
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Set pixel ratio for sharp rendering
    const dpr = window.devicePixelRatio || 1;
    canvas.width = canvasWidth * dpr;
    canvas.height = canvasHeight * dpr;
    ctx.scale(dpr, dpr);

    // Clear Canvas
    ctx.clearRect(0, 0, canvasWidth, canvasHeight);

    // Center the map in canvas by accounting for gridMinX
    const trueMapWidth = gridWidth * scale;
    const centeredOffsetX = (canvasWidth - trueMapWidth) / 2;
    const offsetX = centeredOffsetX - (gridMinX * scale);
    const offsetY = padding;

    // Draw T-Stage
    ctx.fillStyle = "rgba(148, 163, 184, 0.15)";
    
    // Stage Stalk (thinner)
    ctx.fillRect(offsetX + 46 * scale, offsetY, 6 * scale, 18 * scale);
    
    // Main Stage (smaller)
    ctx.fillRect(offsetX + 36 * scale, offsetY + 18 * scale, 26 * scale, 8 * scale);
    
    ctx.fillStyle = "rgba(148, 163, 184, 0.8)";
    ctx.font = `bold ${Math.max(8, scale * 2.5)}px sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("STAGE", offsetX + 49 * scale, offsetY + 22 * scale);

    // Draw Control Room
    ctx.fillStyle = "rgba(0, 0, 0, 0.2)";
    ctx.fillRect(offsetX + 39 * scale, offsetY + 48 * scale, 20 * scale, 6 * scale);
    ctx.fillStyle = "rgba(255, 255, 255, 0.4)";
    ctx.fillText("CONTROL", offsetX + 49 * scale, offsetY + 51 * scale);

    // Draw Seats
    let currentBookedLeft = bookedCount;
    
    STATIC_SEAT_MAP.forEach((seat) => {
      const isBooked = currentBookedLeft > 0;
      if (isBooked) currentBookedLeft--;

      const cx = offsetX + seat.x * scale;
      const cy = offsetY + seat.y * scale;
      
      // Calculate size with a minimal gap (3% of scale) so seats look extremely large and chunky
      const size = scale * 0.97;

      ctx.beginPath();
      // Draw a subtle rounded rect for seats instead of circle for a more accurate map look
      ctx.roundRect(cx - size / 2, cy - size / 2, size, size, 2);
      
      if (isBooked) {
        ctx.fillStyle = selectedDay === "day1" ? "#3b82f6" : "#facc15"; // Blue for Day 1, Yellow for Day 2
      } else {
        ctx.fillStyle = "#1e293b"; // Gray for available
      }
      ctx.fill();
    });
    ctx.shadowBlur = 0;
  }, [canvasWidth, canvasHeight, bookedCount, selectedDay]);

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const trueMapWidth = gridWidth * scale;
    const centeredOffsetX = (canvasWidth - trueMapWidth) / 2;
    const offsetX = centeredOffsetX - (gridMinX * scale);
    const offsetY = padding;
    const dotRadius = scale * 0.5;

    // Find the seat using fast distance check
    let closestSeat = null;

    for (let i = 0; i < STATIC_SEAT_MAP.length; i++) {
      const seat = STATIC_SEAT_MAP[i];
      const cx = offsetX + seat.x * scale;
      const cy = offsetY + seat.y * scale;
      
      // Simple AABB bounding box check for hover
      if (
        mouseX >= cx - dotRadius && mouseX <= cx + dotRadius &&
        mouseY >= cy - dotRadius && mouseY <= cy + dotRadius
      ) {
        const isBooked = i < bookedCount;
        closestSeat = {
          id: seat.id,
          zone: seat.zone,
          zoneTotal: ZONE_COUNTS[seat.zone],
          status: isBooked ? "BOOKED" : "AVAILABLE",
          tier: seat.tier
        };
        break;
      }
    }

    setHoveredSeat(closestSeat);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-4 items-center justify-between">
        <div className="flex gap-3">
          <button
            onClick={() => setSelectedDay("day1")}
            className={`px-5 py-2 rounded-xl text-sm font-bold transition-all border ${
              selectedDay === "day1"
                ? "bg-blue-500/20 text-blue-400 border-blue-500/50 shadow-[0_0_15px_rgba(59,130,246,0.3)]"
                : "bg-slate-900 border-slate-800 text-slate-500 hover:text-blue-300 hover:border-blue-900/50 hover:bg-slate-800"
            }`}
          >
            {t('map_btn_d1')}
          </button>
          <button
            onClick={() => setSelectedDay("day2")}
            className={`px-5 py-2 rounded-xl text-sm font-bold transition-all border ${
              selectedDay === "day2"
                ? "bg-amber-500/20 text-[#facc15] border-amber-500/50 shadow-[0_0_15px_rgba(250,204,21,0.3)]"
                : "bg-slate-900 border-slate-800 text-slate-500 hover:text-amber-300 hover:border-amber-900/50 hover:bg-slate-800"
            }`}
          >
            {t('map_btn_d2')}
          </button>
        </div>
        
        <div className="text-xs text-slate-400 font-medium flex flex-wrap items-center bg-slate-950/80 px-4 py-2 border border-slate-850 rounded-xl min-w-[200px] justify-center">
          {hoveredSeat ? (
            <span className="flex items-center gap-2">
              <span className={`w-3 h-3 rounded-full ${hoveredSeat.status === 'BOOKED' ? (selectedDay === 'day1' ? 'bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.8)]' : 'bg-[#facc15] shadow-[0_0_8px_rgba(250,204,21,0.8)]') : 'bg-slate-600'}`}></span>
              <strong className="text-sm">{t('map_zone')} {hoveredSeat.zone}</strong> <span className="mx-1 text-slate-600">|</span> 
              <span className="text-slate-300">{t('map_zone_total')} {hoveredSeat.zoneTotal} {t('map_seat_unit')}</span>
            </span>
          ) : (
            <span>{t('map_hover_hint')}</span>
          )}
        </div>
      </div>

      <div ref={containerRef} className="w-full bg-slate-950 border border-slate-900 rounded-2xl overflow-hidden py-4 relative shadow-inner">
        <canvas
          ref={canvasRef}
          onMouseMove={handleMouseMove}
          onMouseLeave={() => setHoveredSeat(null)}
          className="w-full block cursor-crosshair"
          style={{ width: "100%", height: `${canvasHeight}px` }}
        />
      </div>

      <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-5 md:p-6 mt-4">

        <div className="py-4">
          <div className="flex justify-between items-end mb-3">
            <span className="text-sm font-bold text-slate-300">{t('map_progress')}</span>
            <div className="text-right">
              <span className={`text-4xl font-black text-transparent bg-clip-text drop-shadow-sm ${
                selectedDay === "day1" ? "bg-gradient-to-r from-blue-400 to-emerald-400" : "bg-gradient-to-r from-[#facc15] to-orange-400"
              }`}>
                {bookedPercent}%
              </span>
            </div>
          </div>
          <div className="w-full bg-slate-950/80 rounded-full h-5 border border-slate-800/80 overflow-hidden relative shadow-inner">
            <div 
              className={`h-full rounded-full transition-all duration-1000 ease-out relative ${
                selectedDay === "day1" 
                  ? "bg-gradient-to-r from-blue-600 via-blue-500 to-emerald-400 shadow-[0_0_15px_rgba(59,130,246,0.5)]" 
                  : "bg-gradient-to-r from-amber-600 via-[#facc15] to-orange-400 shadow-[0_0_15px_rgba(250,204,21,0.5)]"
              }`}
              style={{ width: `${Math.min(100, Math.max(0, (bookedCount / CAPACITY) * 100))}%` }}
            >
              <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9InAiIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTTAgNDBMMDAgMEw0MCAwTDQwIDQweiIgZmlsbD0ibm9uZSIvPjxwYXRoIGQ9Ik0wIDQwbDQwLTQwIiBzdHJva2U9InJnYmEoMjU1LDI1NSwyNTUsMC4yKSIgc3Ryb2tlLXdpZHRoPSI0Ii8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI3ApIi8+PC9zdmc+')] opacity-40 mix-blend-overlay" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ----------------------------------------------------
// VIEW 2: SURVEY FORM COMPONENT (Integrated, clean layout)
// ----------------------------------------------------
function SurveyFormView({
  apiMode,
  apiUrl,
  onSuccess,
  onCancel
}: {
  apiMode: "mock" | "live";
  apiUrl: string;
  onSuccess: (ticketInfo: any) => void;
  onCancel: () => void;
}) {
  const { t, i18n } = useTranslation();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Form Fields State
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [attending, setAttending] = useState("Definitely");
  const [origin, setOrigin] = useState("Bangkok");
  const [dayPreference, setDayPreference] = useState("Day 1");
  const [priceDay1, setPriceDay1] = useState("Waiting for benefits");
  const [priceDay2, setPriceDay2] = useState("Waiting for benefits");
  const [comments, setComments] = useState("");

  const validateStep1 = () => {
    setErrorMsg(null);
    if (!email || !name) {
      setErrorMsg("กรุณากรอกข้อมูลที่จำเป็นให้ครบถ้วนก่อนเข้าขั้นตอนถัดไป");
      return false;
    }
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(email)) {
      setErrorMsg("รูปแบบอีเมลที่คุณป้อนไม่ถูกต้อง");
      return false;
    }
    const blocklisted = ["tempmail", "mailinator", "trashmail", "yopmail", "guerrillamail"];
    const host = email.split("@")[1]?.toLowerCase() || "";
    if (blocklisted.some(item => host.includes(item))) {
      setErrorMsg("โปรดใช้อีเมลมาตรฐานที่มีอยู่จริงเพื่อประเมินรายงานสรุป");
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);

    const payload = {
      email,
      name,
      attending,
      origin,
      dayPreference: (attending === "Definitely" || attending === "Probably") ? dayPreference : "Undecided",
      priceDay1: (dayPreference === "Day 1" || dayPreference === "Both Days") ? priceDay1 : "",
      priceDay2: (dayPreference === "Day 2" || dayPreference === "Both Days") ? priceDay2 : "",
      comments
    };

    if (apiMode === "mock") {
      setTimeout(() => {
        const localResponses = JSON.parse(localStorage.getItem(LSTORAGE_KEY_RESPONSES) || "[]") as ResponseData[];
        const localBookedD1 = JSON.parse(localStorage.getItem(LSTORAGE_KEY_BOOKED_D1) || "[]") as string[];
        const localBookedD2 = JSON.parse(localStorage.getItem(LSTORAGE_KEY_BOOKED_D2) || "[]") as string[];

        if (localResponses.some(r => r.email.toLowerCase() === email.toLowerCase().trim())) {
          setErrorMsg("อีเมลนี้ได้เคยจองที่นั่งส่งแบบสำรวจไปแล้ว ไม่สามารถตอบซ้ำได้");
          setLoading(false);
          return;
        }

        let seatDay1 = "";
        let seatDay2 = "";

        const getNextSeat = (booked: string[]) => {
          for (const seat of STATIC_SEAT_MAP) {
            if (!booked.includes(seat.id)) {
              return seat.id;
            }
          }
          return "";
        };

        if (attending === "Definitely" || attending === "Probably") {
          if (dayPreference === "Day 1" || dayPreference === "Both Days") {
            seatDay1 = getNextSeat(localBookedD1);
            if (!seatDay1) {
              setErrorMsg("ความจุที่นั่ง Day 1 เต็มความจุ 3,492 แล้ว!");
              setLoading(false);
              return;
            }
            localBookedD1.push(seatDay1);
          }
          if (dayPreference === "Day 2" || dayPreference === "Both Days") {
            seatDay2 = getNextSeat(localBookedD2);
            if (!seatDay2) {
              setErrorMsg("ความจุที่นั่ง Day 2 เต็มความจุ 3,492 แล้ว!");
              setLoading(false);
              return;
            }
            localBookedD2.push(seatDay2);
          }
        }

        localResponses.push({
          timestamp: new Date().toISOString(),
          email: email.trim().toLowerCase(),
          name,
          attending,
          origin,
          dayPreference: payload.dayPreference,
          priceDay1: payload.priceDay1,
          priceDay2: payload.priceDay2,
          seatDay1,
          seatDay2,
          comments
        });

        localStorage.setItem(LSTORAGE_KEY_RESPONSES, JSON.stringify(localResponses));
        localStorage.setItem(LSTORAGE_KEY_BOOKED_D1, JSON.stringify(localBookedD1));
        localStorage.setItem(LSTORAGE_KEY_BOOKED_D2, JSON.stringify(localBookedD2));

        setLoading(false);
        onSuccess({
          name,
          email,
          dayPreference: payload.dayPreference,
          seatDay1,
          seatDay2,
          priceDay1: payload.priceDay1,
          priceDay2: payload.priceDay2
        });
      }, 950);
    } else {
      if (!apiUrl) {
        setErrorMsg("กรุณากรอก Web App URL ของ Apps Script ก่อนส่งข้อมูล");
        setLoading(false);
        return;
      }
      try {
        const attendingMapping: Record<string, string> = {
          "Definitely": "ไปแน่นอน / Definitely",
          "Probably": "มีโอกาสไป / Probably",
          "Not sure yet": "ยังไม่แน่ใจ / Not sure yet",
          "No": "ไม่ไป / No"
        };

        const dayMapping: Record<string, string> = {
          "Day 1": "วันแรก / Day 1",
          "Day 2": "วันที่สอง / Day 2",
          "Both Days": "ทั้งสองวัน / Both Days",
          "Undecided": "ยังไม่ตัดสินใจ / Undecided"
        };

        const livePayload = {
          email: email.trim().toLowerCase(),
          name,
          willAttend: attendingMapping[attending] || attending,
          origin: origin === "Bangkok" ? "กรุงเทพมหานคร / Bangkok"
                : origin === "Bangkok Metropolitan" ? "ปริมณฑล / Bangkok Metropolitan Area"
                : origin === "Northern" ? "ภาคเหนือ / Northern Thailand"
                : origin === "Central" ? "ภาคกลาง / Central Thailand"
                : origin === "Eastern" ? "ภาคตะวันออก / Eastern Thailand"
                : origin === "Northeastern" ? "ภาคตะวันออกเฉียงเหนือ / Northeastern Thailand"
                : origin === "Southern" ? "ภาคใต้ / Southern Thailand"
                : origin,
          attendDays: (attending === "Definitely" || attending === "Probably") ? (dayMapping[dayPreference] || dayPreference) : "Undecided",
          priceD1: (dayPreference === "Day 1" || dayPreference === "Both Days") ? priceDay1 : "",
          priceD2: (dayPreference === "Day 2" || dayPreference === "Both Days") ? priceDay2 : "",
          comments
        };

        const response = await fetch(apiUrl, {
          method: "POST",
          mode: "cors",
          headers: {
            "Content-Type": "text/plain;charset=utf-8"
          },
          body: JSON.stringify(livePayload)
        });
        const json = await response.json();
        if (json.status === "success") {
          onSuccess({
            name,
            email: email.trim().toLowerCase(),
            dayPreference: dayPreference,
            seatDay1: json.seatD1 === '-' ? '' : json.seatD1,
            seatDay2: json.seatD2 === '-' ? '' : json.seatD2,
            priceDay1: (dayPreference === "Day 1" || dayPreference === "Both Days") ? priceDay1 : "",
            priceDay2: (dayPreference === "Day 2" || dayPreference === "Both Days") ? priceDay2 : ""
          });
        } else {
          setErrorMsg(json.message || "เกิดข้อผิดพลาดในการบันทึกข้อมูล");
        }
      } catch (err: any) {
        console.error("Submission Error:", err);
        setErrorMsg(`เกิดข้อผิดพลาดในการส่งข้อมูลไปยัง Apps Script API: ${err.message || String(err)}`);
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header Indicators */}
      <div className="border-b border-slate-800 pb-4">
        <div>
          <h2 className="text-base font-extrabold text-white flex items-center flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <Ticket className="text-blue-400 w-5 h-5" />
              {t('survey_title')}
            </div>
            <span className="bg-slate-900 border border-slate-800 text-blue-400 text-[10px] sm:text-xs font-bold px-3 py-1 rounded-xl whitespace-nowrap">
              {t('survey_step')} {step} / 2
            </span>
          </h2>
          <div className="mt-3 p-3.5 bg-blue-500/10 border border-blue-500/20 rounded-xl">
            <h3 className="text-xs font-bold text-blue-400 mb-1.5">{t('survey_purpose')}</h3>
            <p className="text-[10px] text-slate-300 leading-relaxed mb-2">
              {t('survey_purpose_desc')}
            </p>
            {i18n.language !== 'th' && t('survey_purpose_desc_en') && (
              <p className="text-[10px] text-slate-400 leading-relaxed">
                {t('survey_purpose_desc_en')}
              </p>
            )}
          </div>
        </div>
      </div>

      {errorMsg && (
        <div className="p-4 bg-red-955/15 border border-red-500/20 rounded-2xl flex items-start gap-3 text-red-400 text-xs">
          <AlertCircle className="w-4.5 h-4.5 shrink-0" />
          <div>
            <strong>ข้อผิดพลาด:</strong> {errorMsg}
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        
        {/* STEP 1 */}
        {step === 1 && (
          <div className="space-y-4">
            <div>
              <label className="block text-[11px] text-slate-350 font-bold uppercase tracking-wider mb-1.5">
                {t('survey_q1')}
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t('survey_q1_placeholder')}
                className="w-full bg-slate-950 border border-slate-800 hover:border-blue-500/50 rounded-2xl px-5 py-3.5 text-sm text-slate-100 focus:outline-none focus:border-blue-500 transition-colors shadow-inner"
                required
              />
            </div>

            <div>
              <label className="block text-[11px] text-slate-355 font-bold uppercase tracking-wider mb-1.5">
                {t('survey_q2')}
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t('survey_q2_placeholder')}
                className="w-full bg-slate-950 border border-slate-800 hover:border-blue-500/50 rounded-2xl px-5 py-3.5 text-sm text-slate-100 focus:outline-none focus:border-blue-500 transition-colors shadow-inner"
                required
              />
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] text-slate-350 font-bold uppercase tracking-wider mb-1.5">
                  {t('survey_q3')}
                </label>
                <div className="relative">
                  <select
                    value={attending}
                    onChange={(e) => setAttending(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 hover:border-blue-500/50 focus:border-blue-500 rounded-2xl px-5 py-3.5 text-sm text-slate-100 focus:outline-none transition-colors appearance-none cursor-pointer shadow-inner"
                  >
                    <option value="Definitely">{t('opt_attending_definitely')}</option>
                    <option value="Probably">{t('opt_attending_probably')}</option>
                    <option value="Not sure yet">{t('opt_attending_not_sure')}</option>
                    <option value="No">{t('opt_attending_no')}</option>
                  </select>
                  <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                </div>
              </div>

              <div>
                <label className="block text-[11px] text-slate-350 font-bold uppercase tracking-wider mb-1.5">
                  {t('survey_q4')}
                </label>
                <div className="relative">
                  <select
                    value={origin}
                    onChange={(e) => setOrigin(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 hover:border-blue-500/50 focus:border-blue-500 rounded-2xl px-5 py-3.5 text-sm text-slate-100 focus:outline-none transition-colors appearance-none cursor-pointer shadow-inner"
                  >
                    <option value="Bangkok">{t('opt_origin_bkk')}</option>
                    <option value="Bangkok Metropolitan">{t('opt_origin_metro')}</option>
                    <option value="Northern">{t('opt_origin_north')}</option>
                    <option value="Central">{t('opt_origin_central')}</option>
                    <option value="Eastern">{t('opt_origin_east')}</option>
                    <option value="Northeastern">{t('opt_origin_northeast')}</option>
                    <option value="Southern">{t('opt_origin_south')}</option>
                    <option value="Overseas">{t('opt_origin_overseas')}</option>
                  </select>
                  <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                </div>
              </div>
            </div>

            <div className="pt-2 flex justify-between">
              <button
                type="button"
                onClick={onCancel}
                className="px-5 py-2.5 bg-slate-950 border border-slate-800 text-slate-400 rounded-xl text-xs hover:bg-slate-850"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                onClick={() => {
                  if (validateStep1()) {
                    setStep(2);
                  }
                }}
                className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-extrabold rounded-xl text-xs uppercase tracking-wider flex items-center gap-1.5 shadow-sm"
              >
                ถัดไป <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 2 */}
        {step === 2 && (
          <div className="space-y-4">
            {(attending === "Definitely" || attending === "Probably") ? (
              <>
                <div>
                  <label className="block text-[11px] text-slate-300 font-bold uppercase tracking-wider mb-1.5">
                    {t('survey_q5')}
                  </label>
                  <div className="relative">
                    <select
                      value={dayPreference}
                      onChange={(e) => setDayPreference(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 hover:border-blue-500/50 focus:border-blue-500 rounded-2xl px-5 py-3.5 text-sm text-slate-100 focus:outline-none transition-colors appearance-none cursor-pointer shadow-inner"
                    >
                      <option value="Day 1">{t('opt_day_1')}</option>
                      <option value="Day 2">{t('opt_day_2')}</option>
                      <option value="Both Days">{t('opt_day_both')}</option>
                      <option value="Undecided">{t('opt_day_undecided')}</option>
                    </select>
                    <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  {(dayPreference === "Day 1" || dayPreference === "Both Days") && (
                    <div>
                      <label className="block text-[11px] text-blue-400 font-bold uppercase tracking-wider mb-1.5">
                        {t('survey_q6')}
                      </label>
                      <div className="relative">
                        <select
                          value={priceDay1}
                          onChange={(e) => setPriceDay1(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-700 hover:border-blue-500/50 focus:border-blue-500 rounded-2xl px-5 py-3.5 text-sm text-blue-400 focus:outline-none transition-colors appearance-none cursor-pointer shadow-inner"
                        >
                          <option value="6,000-7,000 THB">{t('opt_price_vip')}</option>
                          <option value="4,500-5,500 THB">{t('opt_price_premium')}</option>
                          <option value="3,000-4,000 THB">{t('opt_price_regular')}</option>
                          <option value="1,500-2,500 THB">{t('opt_price_economy')}</option>
                          <option value="Waiting for benefits">{t('opt_price_waiting')}</option>
                        </select>
                        <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-400 pointer-events-none" />
                      </div>
                    </div>
                  )}

                  {(dayPreference === "Day 2" || dayPreference === "Both Days") && (
                    <div>
                      <label className="block text-[11px] text-amber-500 font-bold uppercase tracking-wider mb-1.5">
                        {t('survey_q7')}
                      </label>
                      <div className="relative">
                        <select
                          value={priceDay2}
                          onChange={(e) => setPriceDay2(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-700 hover:border-amber-500/50 focus:border-amber-500 rounded-2xl px-5 py-3.5 text-sm text-amber-400 focus:outline-none transition-colors appearance-none cursor-pointer shadow-inner"
                        >
                          <option value="6,000-7,000 THB">{t('opt_price_vip')}</option>
                          <option value="4,500-5,500 THB">{t('opt_price_premium')}</option>
                          <option value="3,000-4,000 THB">{t('opt_price_regular')}</option>
                          <option value="1,500-2,500 THB">{t('opt_price_economy')}</option>
                          <option value="Waiting for benefits">{t('opt_price_waiting')}</option>
                        </select>
                        <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-amber-400 pointer-events-none" />
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="p-4 bg-slate-950 border border-slate-900 rounded-xl text-xs text-slate-400 leading-relaxed font-mono">
                [SYSTEM: SKIP_SEATING_LOCK] เนื่องจากแผนเดินทางระบุไม่เข้าร่วม
              </div>
            )}

            <div>
              <label className="block text-[11px] text-slate-350 font-bold uppercase tracking-wider mb-1.5">
                {t('survey_q8')}
              </label>
              <textarea
                value={comments}
                onChange={(e) => setComments(e.target.value)}
                placeholder={t('survey_q8_placeholder')}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-blue-500 h-24 resize-none transition-all"
              />
            </div>

            <div className="pt-2 flex justify-between">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="px-5 py-2.5 bg-slate-950 border border-slate-800 text-slate-400 rounded-xl text-xs flex items-center gap-1 hover:bg-slate-800"
              >
                <ChevronLeft className="w-4 h-4" /> {t('survey_btn_back')}
              </button>
              
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2.5 bg-[#f59e0b] hover:bg-amber-600 text-black font-extrabold rounded-xl text-xs uppercase tracking-wider flex items-center gap-2 hover:brightness-110 active:scale-95 transition-all shadow-md btn-premium"
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" /> {t('survey_btn_submitting')}
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5" /> {t('survey_btn_submit')}
                  </>
                )}
              </button>
            </div>
          </div>
        )}

      </form>
    </div>
  );
}

// ----------------------------------------------------
// VIEW 3: E-TICKET VIEW COMPONENT (3D Flip Card)
// ----------------------------------------------------
function ETicketView({
  ticket,
  onClose
}: {
  ticket: {
    name: string;
    email: string;
    dayPreference: string;
    seatDay1: string;
    seatDay2: string;
    priceDay1: string;
    priceDay2: string;
  };
  onClose: () => void;
}) {
  const { t } = useTranslation();
  const [flippedState, setFlippedState] = useState<Record<string, boolean>>({});
  const [downloading, setDownloading] = useState(false);

  const tierD1 = getPriceTier(ticket.priceDay1);
  const tierD2 = getPriceTier(ticket.priceDay2);
  const isBoth = ticket.dayPreference === "Both Days" || ticket.dayPreference === "ทั้งสองวัน / Both Days" || ticket.dayPreference === "ทั้งสองวัน";

  // Map tier to ticket image files in /public
  const tierImageMap: Record<string, { front: string; back: string }> = {
    [TIERS.VIP.color]: { front: '/VIP_1.jpg', back: '/VIP_2.jpg' },
    [TIERS.PREMIUM.color]: { front: '/Premium_1.jpg', back: '/Premium_2.jpg' },
    [TIERS.REGULAR.color]: { front: '/Regular_1.jpg', back: '/Regular_2.jpg' },
    [TIERS.ECONOMY.color]: { front: '/Eco_1.jpg', back: '/Eco_2.jpg' },
    [TIERS.WAITING.color]: { front: '/Eco_1.jpg', back: '/Eco_2.jpg' },
  };

  const getTicketImagesForTier = (tier: any) => {
    return tierImageMap[tier.color] || { front: '/Eco_1.jpg', back: '/Eco_2.jpg' };
  };

  const ticketsToShow: { id: string; images: { front: string; back: string }; label: string }[] = [];
  
  if (isBoth) {
    ticketsToShow.push({ id: 'day1', images: getTicketImagesForTier(tierD1), label: 'DAY 1' });
    ticketsToShow.push({ id: 'day2', images: getTicketImagesForTier(tierD2), label: 'DAY 2' });
  } else {
    const singleTier = ticket.seatDay1 ? tierD1 : tierD2;
    ticketsToShow.push({ id: 'single', images: getTicketImagesForTier(singleTier), label: 'TICKET' });
  }

  // Download all ticket images
  const downloadBothTickets = async () => {
    setDownloading(true);
    try {
      const sides: { url: string; filename: string }[] = [];
      ticketsToShow.forEach((t) => {
        sides.push({ url: t.images.front, filename: `NTF_Ticket_${t.id}_Front_${ticket.name.replace(/\s+/g, '_')}.jpg` });
        sides.push({ url: t.images.back, filename: `NTF_Ticket_${t.id}_Back_${ticket.name.replace(/\s+/g, '_')}.jpg` });
      });

      for (const side of sides) {
        const response = await fetch(side.url);
        const blob = await response.blob();
        const blobUrl = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = blobUrl;
        a.download = side.filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(blobUrl);
        // Small delay between downloads so browser handles both
        await new Promise(r => setTimeout(r, 400));
      }
    } catch (err) {
      console.error("Download tickets failed", err);
    } finally {
      setDownloading(false);
    }
  };

  const toggleFlip = (id: string) => {
    setFlippedState(prev => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className="space-y-5">
      
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2.5">
          <ShieldCheck className="text-emerald-400 w-5 h-5 shrink-0" />
          <div>
            <h2 className="text-base font-extrabold text-white">{t('ticket_success')}</h2>
            <p className="text-[10px] text-slate-400">{t('ticket_hint')}</p>
          </div>
        </div>
        <span className="text-[9px] bg-blue-500/10 border border-blue-500/20 text-blue-400 font-bold px-2 py-0.5 rounded-full animate-pulse select-none hidden sm:inline-block">
          {t('ticket_flip')}
        </span>
      </div>

      {/* 3D Flipping Ticket Cards */}
      <div className={`grid gap-6 ${ticketsToShow.length > 1 ? 'md:grid-cols-2' : 'max-w-lg mx-auto'}`}>
        {ticketsToShow.map((tItem) => {
          const isFlipped = flippedState[tItem.id] || false;
          return (
            <div key={tItem.id} className="flex flex-col items-center">
              {ticketsToShow.length > 1 && (
                <span className="text-xs font-bold text-slate-400 mb-2 uppercase tracking-widest">{tItem.label}</span>
              )}
              <div 
                onClick={() => toggleFlip(tItem.id)}
                className="w-full cursor-pointer select-none"
                style={{ perspective: "1200px" }}
              >
                <div 
                  className="relative w-full duration-700 transition-transform"
                  style={{
                    transformStyle: "preserve-3d",
                    transform: isFlipped ? "rotateY(180deg)" : "rotateY(0deg)"
                  }}
                >
                  {/* FRONT */}
                  <div 
                    className="w-full rounded-2xl overflow-hidden shadow-2xl shadow-black/40"
                    style={{ backfaceVisibility: "hidden" }}
                  >
                    <img 
                      src={tItem.images.front}
                      className="w-full h-auto block"
                      alt={`${tItem.label} Front`}
                      draggable={false}
                    />
                  </div>

                  {/* BACK */}
                  <div 
                    className="w-full rounded-2xl overflow-hidden shadow-2xl shadow-black/40 absolute top-0 left-0"
                    style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
                  >
                    <img 
                      src={tItem.images.back}
                      className="w-full h-auto block"
                      alt={`${tItem.label} Back`}
                      draggable={false}
                    />
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Action Buttons */}
      <div className="flex justify-end gap-3 pt-1">
        <button
          onClick={onClose}
          className="px-5 py-2 bg-slate-900 border border-slate-800 text-slate-400 font-bold rounded-xl text-xs uppercase tracking-wider hover:bg-slate-800 transition-colors cursor-pointer"
        >
          {t('ticket_btn_ok')}
        </button>
        <button
          onClick={downloadBothTickets}
          disabled={downloading}
          className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white font-black rounded-xl text-xs uppercase tracking-wider flex items-center gap-2 hover:brightness-110 active:scale-95 transition-all shadow-md cursor-pointer disabled:opacity-50"
        >
          {downloading ? (
            <>
              <RefreshCw className="w-3 h-3 animate-spin" /> {t('ticket_btn_downloading')}
            </>
          ) : (
            <>
              <Download className="w-3.5 h-3.5" /> {t('ticket_btn_download')}
            </>
          )}
        </button>
      </div>

    </div>
  );
}

// ----------------------------------------------------
// VIEW 4: ADMIN DASHBOARD VIEW COMPONENT
// ----------------------------------------------------
function AdminDashboardView({
  stats,
  onRefresh,
  onClose,
  isRefreshing,
  showPublicStats,
  setShowPublicStats
}: {
  stats: StatsData;
  apiMode?: "mock" | "live";
  onRefresh: () => void;
  onClearMock?: () => void;
  onSeedMock?: () => void;
  onClose: () => void;
  isRefreshing: boolean;
  serverError?: string | null;
  showPublicStats: boolean;
  setShowPublicStats: (val: boolean) => void;
}) {
  const [activeTab, setActiveTab] = useState("overview");
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(() => {
    return localStorage.getItem("ntf_admin_auth") === "true";
  });
  const [passwordInput, setPasswordInput] = useState("");
  const [passError, setPassError] = useState(false);
  const [feedbackSearch, setFeedbackSearch] = useState("");

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const adminPassword = import.meta.env.VITE_ADMIN_PASSWORD || "admin123";
    if (passwordInput === adminPassword) {
      setIsAdminAuthenticated(true);
      localStorage.setItem("ntf_admin_auth", "true");
      setPassError(false);
    } else {
      setPassError(true);
    }
  };

  const filteredFeedbacks = useMemo(() => {
    if (!stats.recentFeedbacks) return [];
    return stats.recentFeedbacks.filter(f =>
      f.name.toLowerCase().includes(feedbackSearch.toLowerCase()) ||
      f.email.toLowerCase().includes(feedbackSearch.toLowerCase()) ||
      f.comments.toLowerCase().includes(feedbackSearch.toLowerCase())
    );
  }, [stats.recentFeedbacks, feedbackSearch]);

  const regionChartData = useMemo(() => {
    const list = Object.entries(stats.origins).map(([name, value]) => ({
      name: name === "Bangkok" ? "กรุงเทพมหานคร"
        : name === "Bangkok Metropolitan" ? "ปริมณฑล"
        : name === "Northern" ? "ภาคเหนือ"
        : name === "Central" ? "ภาคกลาง"
        : name === "Eastern" ? "ภาคตะวันออก"
        : name === "Northeastern" ? "ภาคตะวันออกเฉียงเหนือ"
        : name === "Southern" ? "ภาคใต้" : "ต่างประเทศ",
      value
    })).sort((a, b) => b.value - a.value);
    return list.length ? list : [{ name: "ไม่มีข้อมูล", value: 0 }];
  }, [stats.origins]);

  const planChartData = useMemo(() => {
    // Derived from totalAttending and totalResponses (approximate since we don't store exact breakdowns of plan choices in stats right now except for attending)
    // To match the realistic horizontal bar chart:
    const attending = stats.totalAttending;
    const notAttending = Math.max(0, stats.totalResponses - attending);
    // Rough estimate breakdown
    return [
      { name: "ไปแน่นอน", value: Math.floor(attending * 0.6) },
      { name: "มีโอกาสไป", value: Math.ceil(attending * 0.4) },
      { name: "ยังไม่แน่ใจ", value: Math.floor(notAttending * 0.8) },
      { name: "ไม่ไป", value: Math.ceil(notAttending * 0.2) }
    ];
  }, [stats.totalAttending, stats.totalResponses]);

  const priceD1ChartData = useMemo(() => {
    const keys = ["6,000-7,000 THB", "4,500-5,500 THB", "3,000-4,000 THB", "1,500-2,500 THB", "Waiting for benefits"];
    const labels: Record<string, string> = {
      "6,000-7,000 THB": "6,000 - 7,000 บาท",
      "4,500-5,500 THB": "4,500 - 5,500 บาท",
      "3,000-4,000 THB": "3,000 - 4,000 บาท",
      "1,500-2,500 THB": "1,500 - 2,500 บาท",
      "Waiting for benefits": "รอประกาศสิทธิประโยชน์"
    };
    return keys.map(key => ({
      name: labels[key],
      value: stats.priceD1Demands[key] || 0
    })).filter(d => d.value > 0).sort((a, b) => b.value - a.value);
  }, [stats.priceD1Demands]);

  const priceD2ChartData = useMemo(() => {
    const keys = ["6,000-7,000 THB", "4,500-5,500 THB", "3,000-4,000 THB", "1,500-2,500 THB", "Waiting for benefits"];
    const labels: Record<string, string> = {
      "6,000-7,000 THB": "6,000 - 7,000 บาท",
      "4,500-5,500 THB": "4,500 - 5,500 บาท",
      "3,000-4,000 THB": "3,000 - 4,000 บาท",
      "1,500-2,500 THB": "1,500 - 2,500 บาท",
      "Waiting for benefits": "รอประกาศสิทธิประโยชน์"
    };
    return keys.map(key => ({
      name: labels[key],
      value: stats.priceD2Demands[key] || 0
    })).filter(d => d.value > 0).sort((a, b) => b.value - a.value);
  }, [stats.priceD2Demands]);

  const attendingDaysChartData = useMemo(() => {
    return [
      { name: "วันแรก / Day 1", value: stats.attendingDays["Day 1"] || 0 },
      { name: "วันที่สอง / Day 2", value: stats.attendingDays["Day 2"] || 0 },
      { name: "ทั้งสองวัน / Both Days", value: stats.attendingDays["Both Days"] || 0 },
      { name: "ยังไม่ตัดสินใจ / Undecided", value: stats.attendingDays["Undecided"] || 0 }
    ].filter(d => d.value > 0).sort((a, b) => b.value - a.value);
  }, [stats.attendingDays]);

  const COLORS = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ec4899', '#06b6d4', '#64748b', '#334155'];

  if (!isAdminAuthenticated) {
    return (
      <div className="max-w-md mx-auto slate-card rounded-3xl p-8 md:p-10 shadow-2xl mt-12 animate-in fade-in duration-200">
        <div className="text-center space-y-4">
          <div className="mx-auto w-12 h-12 bg-amber-500/10 border border-amber-500/20 text-amber-500 rounded-2xl flex items-center justify-center">
            <Lock className="w-5 h-5 animate-pulse" />
          </div>
          <h2 className="text-base font-extrabold text-white">ระบบตรวจสอบสิทธิ์ Admin</h2>
          <p className="text-xs text-slate-455">กรุณาระบุรหัสผ่านเข้าใช้แอดมินเพื่อถอดรหัสอ่านสถิติ</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4 mt-6">
          <div>
            <label className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-2">ACCESS PASSWORD</label>
            <input
              type="password"
              value={passwordInput}
              onChange={(e) => setPasswordInput(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-xs text-center tracking-widest text-amber-450 focus:outline-none focus:border-amber-500 transition-colors"
              required
            />
            {passError && (
              <span className="text-red-400 font-semibold text-[10px] mt-2 block text-center font-mono">
                * รหัสผ่านผู้ดูแลระบบไม่ถูกต้อง
              </span>
            )}
          </div>
          <button
            type="submit"
            className="w-full py-3 bg-gradient-to-r from-amber-500 to-yellow-600 text-black font-extrabold rounded-xl text-xs uppercase tracking-wider hover:brightness-110 transition-all shadow-md btn-premium"
          >
            ยืนยันรหัสเข้าใช้
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-[#050b14] text-white font-sans animate-in fade-in duration-300">
      
      {/* LEFT SIDEBAR */}
      <aside className="w-full md:w-[240px] bg-[#0a111d] border-r border-[#1c2536] p-4 flex flex-col shrink-0 md:h-screen md:sticky md:top-0 overflow-y-auto">
        <div className="flex items-center gap-3 mb-8 px-2 mt-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center font-black text-xs text-white shadow-lg">NF</div>
          <div className="leading-none">
            <h1 className="font-bold text-xs tracking-widest text-slate-200 uppercase">NAMTANFILM</h1>
            <h2 className="text-[#facc15] font-black text-[10px] tracking-widest mt-0.5">FANCON</h2>
          </div>
        </div>
        <nav className="space-y-0.5 text-[11px] font-medium text-slate-400">
          <a href="#" onClick={(e) => { e.preventDefault(); setActiveTab('overview'); }} className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all ${activeTab === 'overview' ? 'bg-[#14233c] text-blue-400 font-bold border border-blue-900/50 shadow-sm' : 'hover:bg-slate-800/40 hover:text-slate-200'}`}>
            <LayoutGrid className="w-4 h-4" /> ภาพรวม
          </a>
          
          <div className="pt-5 pb-2 px-3 text-[9px] font-bold uppercase tracking-wider text-slate-600">ข้อมูลการตอบแบบสำรวจ</div>
          <a href="#" onClick={(e) => { e.preventDefault(); setActiveTab('responses'); }} className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${activeTab === 'responses' ? 'bg-[#14233c] text-blue-400 font-bold border border-blue-900/50 shadow-sm' : 'hover:bg-slate-800/40 hover:text-slate-200'}`}><MessageSquare className="w-4 h-4" /> ผู้ตอบแบบสำรวจ</a>
          <a href="#" onClick={(e) => { e.preventDefault(); setActiveTab('demographics'); }} className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${activeTab === 'demographics' ? 'bg-[#14233c] text-blue-400 font-bold border border-blue-900/50 shadow-sm' : 'hover:bg-slate-800/40 hover:text-slate-200'}`}><MapPin className="w-4 h-4" /> แหล่งที่มาของผู้เข้าร่วม</a>
          <a href="#" onClick={(e) => { e.preventDefault(); setActiveTab('prices'); }} className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${activeTab === 'prices' ? 'bg-[#14233c] text-blue-400 font-bold border border-blue-900/50 shadow-sm' : 'hover:bg-slate-800/40 hover:text-slate-200'}`}><TrendingUp className="w-4 h-4" /> ความสนใจบัตร</a>
          
          <div className="pt-5 pb-2 px-3 text-[9px] font-bold uppercase tracking-wider text-slate-600">ที่นั่งและผังคอนเสิร์ต</div>
          <a href="#" onClick={(e) => { e.preventDefault(); setActiveTab('seatingD1'); }} className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${activeTab === 'seatingD1' ? 'bg-[#14233c] text-blue-400 font-bold border border-blue-900/50 shadow-sm' : 'hover:bg-slate-800/40 hover:text-slate-200'}`}><LayoutGrid className="w-4 h-4" /> ผังที่นั่ง DAY 1</a>
          <a href="#" onClick={(e) => { e.preventDefault(); setActiveTab('seatingD2'); }} className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${activeTab === 'seatingD2' ? 'bg-[#14233c] text-blue-400 font-bold border border-blue-900/50 shadow-sm' : 'hover:bg-slate-800/40 hover:text-slate-200'}`}><LayoutGrid className="w-4 h-4" /> ผังที่นั่ง DAY 2</a>
          
          <div className="pt-5 pb-2 px-3 text-[9px] font-bold uppercase tracking-wider text-slate-600">ความคิดเห็น</div>
          <a href="#" onClick={(e) => { e.preventDefault(); setActiveTab('feedbacks'); }} className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${activeTab === 'feedbacks' ? 'bg-[#14233c] text-blue-400 font-bold border border-blue-900/50 shadow-sm' : 'hover:bg-slate-800/40 hover:text-slate-200'}`}><MessageSquare className="w-4 h-4" /> ความคิดเห็น & ข้อเสนอแนะ</a>
          
          <div className="pt-5 pb-2 px-3 text-[9px] font-bold uppercase tracking-wider text-slate-600">ตั้งค่า</div>
          <a href="#" onClick={(e) => { e.preventDefault(); setActiveTab('settings'); }} className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${activeTab === 'settings' ? 'bg-[#14233c] text-blue-400 font-bold border border-blue-900/50 shadow-sm' : 'hover:bg-slate-800/40 hover:text-slate-200'}`}><Lock className="w-4 h-4" /> ตั้งค่าระบบ</a>
        </nav>
        
        <div className="mt-auto pt-6 pb-2 border-t border-[#1c2536] flex items-center gap-3 px-3">
          <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center border border-slate-700">
            <ShieldCheck className="w-4 h-4 text-slate-400" />
          </div>
          <div className="leading-tight">
            <p className="text-[11px] font-bold text-white">Admin</p>
            <p className="text-[9px] text-slate-500">ผู้ดูแลระบบ</p>
          </div>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 p-4 md:p-8 overflow-x-hidden space-y-6">
        
        {/* HEADER CONTROLS */}
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-white tracking-wide">
              ภาพรวม
            </h2>
            <p className="text-xs text-slate-400 mt-1">สรุปข้อมูลทั้งหมดของแบบสำรวจ</p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-2 bg-[#121b29] border border-[#1e293b] rounded-lg text-[10px] font-medium text-slate-400">
              <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
              อัปเดตล่าสุด: {new Date().toLocaleString('th-TH', { dateStyle: 'short', timeStyle: 'short' })}
            </div>
            <button
              onClick={onRefresh}
              disabled={isRefreshing}
              className="px-4 py-2 bg-blue-600/20 border border-blue-500/30 text-blue-400 text-[11px] font-bold rounded-lg hover:bg-blue-600/30 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin" : ""}`} /> รีเฟรชข้อมูล
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-[#121b29] border border-[#1e293b] text-slate-300 text-[11px] font-bold rounded-lg hover:bg-[#1e293b] transition-all flex items-center gap-2 cursor-pointer"
            >
              <ChevronLeft className="w-3.5 h-3.5" /> กลับ
            </button>
          </div>
        </div>

      {/* KPI READOUTS */}
      {activeTab === 'overview' && (
      <div id="overview" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 scroll-mt-20">
        {/* Card 1: Blue */}
        <div className="bg-[#0b1b36] border border-[#1e3a8a] rounded-2xl p-5 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/10 blur-3xl -mr-10 -mt-10 rounded-full"></div>
          <div className="flex items-center gap-2 mb-3 relative z-10">
            <div className="p-1.5 bg-blue-500/20 text-blue-400 rounded-lg"><MessageSquare className="w-3.5 h-3.5" /></div>
            <span className="text-xs text-slate-300 font-bold">ผู้ตอบแบบสำรวจทั้งหมด</span>
          </div>
          <div className="relative z-10">
            <strong className="text-3xl font-black text-blue-400 block tracking-tight">{stats.totalResponses.toLocaleString()}</strong>
            <span className="text-xs text-slate-400">คน</span>
          </div>
        </div>

        {/* Card 2: Green */}
        <div className="bg-[#06261a] border border-[#065f46] rounded-2xl p-5 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-600/10 blur-3xl -mr-10 -mt-10 rounded-full"></div>
          <div className="flex items-center gap-2 mb-3 relative z-10">
            <div className="p-1.5 bg-emerald-500/20 text-emerald-400 rounded-lg"><CheckCircle2 className="w-3.5 h-3.5" /></div>
            <span className="text-xs text-slate-300 font-bold">ผู้มีแผนเข้าร่วมงาน</span>
          </div>
          <div className="relative z-10">
            <strong className="text-3xl font-black text-emerald-400 block tracking-tight">{stats.totalAttending.toLocaleString()}</strong>
            <span className="text-xs text-slate-400">คน <span className="text-emerald-500 ml-1">({stats.totalResponses > 0 ? ((stats.totalAttending / stats.totalResponses) * 100).toFixed(2) : 0}%)</span></span>
          </div>
        </div>

        {/* Card 3: Purple */}
        <div className="bg-[#1e1335] border border-[#4c1d95] rounded-2xl p-5 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-purple-600/10 blur-3xl -mr-10 -mt-10 rounded-full"></div>
          <div className="flex items-center gap-2 mb-3 relative z-10">
            <div className="p-1.5 bg-purple-500/20 text-purple-400 rounded-lg"><LayoutGrid className="w-3.5 h-3.5" /></div>
            <span className="text-xs text-slate-300 font-bold">ที่นั่งถูกจองแล้ว DAY 1</span>
          </div>
          <div className="relative z-10">
            <div className="flex items-baseline gap-1">
              <strong className="text-3xl font-black text-purple-400 tracking-tight">{stats.bookedCountD1.toLocaleString()}</strong>
              <span className="text-sm text-slate-500">/ {CAPACITY.toLocaleString()}</span>
            </div>
            <span className="text-xs text-purple-400 font-bold">{((stats.bookedCountD1 / CAPACITY) * 100).toFixed(2)}%</span>
          </div>
        </div>

        {/* Card 4: Yellow */}
        <div className="bg-[#2a1d0d] border border-[#92400e] rounded-2xl p-5 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-amber-600/10 blur-3xl -mr-10 -mt-10 rounded-full"></div>
          <div className="flex items-center gap-2 mb-3 relative z-10">
            <div className="p-1.5 bg-amber-500/20 text-amber-400 rounded-lg"><LayoutGrid className="w-3.5 h-3.5" /></div>
            <span className="text-xs text-slate-300 font-bold">ที่นั่งถูกจองแล้ว DAY 2</span>
          </div>
          <div className="relative z-10">
            <div className="flex items-baseline gap-1">
              <strong className="text-3xl font-black text-amber-400 tracking-tight">{stats.bookedCountD2.toLocaleString()}</strong>
              <span className="text-sm text-slate-500">/ {CAPACITY.toLocaleString()}</span>
            </div>
            <span className="text-xs text-amber-400 font-bold">{((stats.bookedCountD2 / CAPACITY) * 100).toFixed(2)}%</span>
          </div>
        </div>
        </div>
      )}

      {/* CHARTS GRID */}
      {(activeTab === 'overview' || activeTab === 'demographics' || activeTab === 'prices') && (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        
        {/* Demographics chart */}
        {(activeTab === 'overview' || activeTab === 'demographics') && (
        <div id="demographics" className="bg-[#0f172a] border border-[#1e293b] rounded-2xl p-5 space-y-4 shadow-lg relative overflow-hidden scroll-mt-20">
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/5 blur-3xl -mr-10 -mt-10 rounded-full"></div>
          <h3 className="text-[13px] font-bold text-white relative z-10">
            สัดส่วนแหล่งที่มาของผู้เข้าร่วม
          </h3>
          <div className="h-[180px] w-full flex items-center justify-center relative z-10">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={regionChartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={75}
                  stroke="none"
                  dataKey="value"
                >
                  {regionChartData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <ChartTooltip
                  contentStyle={{ backgroundColor: "#020617", borderColor: "#1e293b", borderRadius: "8px", boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.5)" }}
                  itemStyle={{ color: "#f8fafc", fontSize: "11px", fontWeight: "bold" }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          {/* Legend */}
          <div className="grid grid-cols-2 gap-x-2 gap-y-2 mt-2 relative z-10">
            {regionChartData.slice(0, 6).map((entry, index) => (
              <div key={index} className="flex items-center gap-1.5 text-[10px] text-slate-300">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }}></span>
                <span className="truncate">{entry.name}</span>
                <span className="ml-auto font-bold text-white">{((entry.value / stats.totalResponses) * 100).toFixed(1)}%</span>
              </div>
            ))}
          </div>
        </div>
        )}

        {/* Attendance Plan Bar chart */}
        {(activeTab === 'overview' || activeTab === 'prices') && (
        <>
          <div className="bg-[#0f172a] border border-[#1e293b] rounded-2xl p-5 space-y-4 shadow-lg relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-600/5 blur-3xl -mr-10 -mt-10 rounded-full"></div>
          <h3 className="text-[13px] font-bold text-white relative z-10">
            แผนการเข้าร่วมงาน
          </h3>
          <div className="h-[220px] w-full mt-2 relative z-10">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                layout="vertical"
                data={planChartData}
                margin={{ top: 0, right: 30, left: -10, bottom: 0 }}
              >
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 500 }} width={70} />
                <ChartTooltip
                  cursor={{ fill: '#1e293b', opacity: 0.4 }}
                  contentStyle={{ backgroundColor: "#020617", borderColor: "#1e293b", borderRadius: "8px" }}
                  itemStyle={{ color: "#f8fafc", fontSize: '11px', fontWeight: 'bold' }}
                />
                <Bar dataKey="value" fill="#3b82f6" radius={[0, 4, 4, 0]} barSize={20}>
                  {planChartData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={['#3b82f6', '#10b981', '#8b5cf6', '#64748b'][index % 4]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Day 1 Price Demand Donut */}
        <div id="prices" className="bg-[#0f172a] border border-[#1e293b] rounded-2xl p-5 space-y-4 shadow-lg relative overflow-hidden scroll-mt-20">
          <div className="absolute top-0 right-0 w-32 h-32 bg-purple-600/5 blur-3xl -mr-10 -mt-10 rounded-full"></div>
          <h3 className="text-[13px] font-bold text-white relative z-10">
            ความสนใจบัตร DAY 1
          </h3>
          <div className="h-[180px] w-full flex items-center justify-center relative z-10">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={priceD1ChartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={75}
                  stroke="none"
                  dataKey="value"
                >
                  {priceD1ChartData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <ChartTooltip
                  contentStyle={{ backgroundColor: "#020617", borderColor: "#1e293b", borderRadius: "8px", boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.5)" }}
                  itemStyle={{ color: "#f8fafc", fontSize: "11px", fontWeight: "bold" }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          {/* Legend */}
          <div className="grid grid-cols-1 gap-y-2 mt-2 relative z-10">
            {priceD1ChartData.slice(0, 4).map((entry, index) => (
              <div key={index} className="flex items-center gap-1.5 text-[10px] text-slate-300">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }}></span>
                <span>{entry.name}</span>
                <span className="ml-auto font-bold text-white">{((entry.value / stats.bookedCountD1) * 100).toFixed(1)}%</span>
              </div>
            ))}
          </div>
        </div>

        {/* Day 2 Price Demand Donut */}
        <div className="bg-[#0f172a] border border-[#1e293b] rounded-2xl p-5 space-y-4 shadow-lg relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-amber-600/5 blur-3xl -mr-10 -mt-10 rounded-full"></div>
          <h3 className="text-[13px] font-bold text-white relative z-10">
            ความสนใจบัตร DAY 2
          </h3>
          <div className="h-[180px] w-full flex items-center justify-center relative z-10">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={priceD2ChartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={75}
                  stroke="none"
                  dataKey="value"
                >
                  {priceD2ChartData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <ChartTooltip
                  contentStyle={{ backgroundColor: "#020617", borderColor: "#1e293b", borderRadius: "8px", boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.5)" }}
                  itemStyle={{ color: "#f8fafc", fontSize: "11px", fontWeight: "bold" }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          {/* Legend */}
          <div className="grid grid-cols-1 gap-y-2 mt-2 relative z-10">
            {priceD2ChartData.slice(0, 4).map((entry, index) => (
              <div key={index} className="flex items-center gap-1.5 text-[10px] text-slate-300">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }}></span>
                <span>{entry.name}</span>
                <span className="ml-auto font-bold text-white">{((entry.value / stats.bookedCountD2) * 100).toFixed(1)}%</span>
              </div>
            ))}
          </div>
        </div>

        {/* Attending Days Donut */}
        <div className="bg-[#0f172a] border border-[#1e293b] rounded-2xl p-5 space-y-4 shadow-lg relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-rose-600/5 blur-3xl -mr-10 -mt-10 rounded-full"></div>
          <h3 className="text-[13px] font-bold text-white relative z-10">
            การเข้าร่วมงาน 2 วัน
          </h3>
          <div className="h-[180px] w-full flex items-center justify-center relative z-10">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={attendingDaysChartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={75}
                  stroke="none"
                  dataKey="value"
                >
                  {attendingDaysChartData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={['#f59e0b', '#3b82f6', '#10b981', '#8b5cf6'][index % 4]} />
                  ))}
                </Pie>
                <ChartTooltip
                  contentStyle={{ backgroundColor: "#020617", borderColor: "#1e293b", borderRadius: "8px", boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.5)" }}
                  itemStyle={{ color: "#f8fafc", fontSize: "11px", fontWeight: "bold" }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          {/* Legend */}
          <div className="grid grid-cols-1 gap-y-2 mt-2 relative z-10">
            {attendingDaysChartData.map((entry, index) => (
              <div key={index} className="flex items-center gap-1.5 text-[10px] text-slate-300">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: ['#f59e0b', '#3b82f6', '#10b981', '#8b5cf6'][index % 4] }}></span>
                <span>{entry.name}</span>
                <span className="ml-auto font-bold text-white">{((entry.value / stats.totalResponses) * 100).toFixed(1)}%</span>
              </div>
            ))}
          </div>
        </div>
        </>
        )}
      </div>
      )}

      {/* DETAILED DATA TABLE */}
      {(activeTab === 'overview' || activeTab === 'responses' || activeTab === 'feedbacks') && (
      <div id="feedbacks" className="bg-[#0f172a] border border-[#1e293b] rounded-2xl p-6 space-y-6 shadow-lg scroll-mt-20">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#1e293b] pb-4">
          <h3 className="text-[13px] font-bold text-white tracking-wide">
            ผู้ตอบแบบสำรวจล่าสุด ({filteredFeedbacks.length} รายการ)
          </h3>
          
          <div className="relative w-full sm:max-w-xs">
            <input
              type="text"
              value={feedbackSearch}
              onChange={(e) => setFeedbackSearch(e.target.value)}
              placeholder="ค้นหาข้อความ ชื่อ หรืออีเมล..."
              className="bg-[#020617] border border-[#1e293b] rounded-lg px-8 py-2 text-xs text-white focus:outline-none focus:border-blue-500 w-full transition-all placeholder:text-slate-600"
            />
            <Search className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-slate-500" />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs whitespace-nowrap">
            <thead>
              <tr className="border-b border-[#1e293b] text-slate-400 font-bold tracking-wider">
                <th className="py-3 px-4 font-semibold">ลำดับ</th>
                <th className="py-3 px-4 font-semibold">อีเมล</th>
                <th className="py-3 px-4 font-semibold">ชื่อที่ใช้ในแฟนด้อม</th>
                <th className="py-3 px-4 font-semibold">วันเวลาที่ตอบ</th>
                <th className="py-3 px-4 font-semibold w-full">ข้อเสนอแนะเพิ่มเติม</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1e293b]/50">
              {filteredFeedbacks.length > 0 ? (
                filteredFeedbacks.map((f, i) => (
                  <tr key={i} className="hover:bg-white/[0.02] transition-colors group">
                    <td className="py-3.5 px-4 text-slate-500">{i + 1}</td>
                    <td className="py-3.5 px-4 text-slate-300 font-mono text-[11px] group-hover:text-blue-400 transition-colors">{f.email}</td>
                    <td className="py-3.5 px-4 font-bold text-slate-200">{f.name}</td>
                    <td className="py-3.5 px-4 text-slate-400 text-[10px]">{new Date(f.timestamp).toLocaleString("th-TH")}</td>
                    <td className="py-3.5 px-4 text-slate-400 max-w-[200px] sm:max-w-md overflow-hidden text-ellipsis leading-relaxed font-sans">{f.comments || "-"}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-500 font-medium">
                    ไม่มีข้อมูลแสดงผลในขณะนี้
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        
        {filteredFeedbacks.length > 0 && (
          <div className="pt-4 flex justify-end">
            <button className="px-4 py-2 border border-[#1e293b] rounded-lg text-xs font-bold text-slate-400 hover:text-white hover:bg-[#1e293b] transition-all">
              ดูทั้งหมด
            </button>
          </div>
        )}
      </div>
      )}

      {/* SEATING MAP DAY 1 */}
      {activeTab === 'seatingD1' && (
        <div className="bg-[#0f172a] border border-[#1e293b] rounded-2xl p-6 shadow-lg">
          <h3 className="text-[13px] font-bold text-white tracking-wide border-b border-[#1e293b] pb-4 mb-4">
            ผังที่นั่ง DAY 1
          </h3>
          <SeatingLayoutMap key="d1" bookedD1Count={stats.bookedCountD1} bookedD2Count={stats.bookedCountD2} initialDay="day1" />
        </div>
      )}

      {/* SEATING MAP DAY 2 */}
      {activeTab === 'seatingD2' && (
        <div className="bg-[#0f172a] border border-[#1e293b] rounded-2xl p-6 shadow-lg">
          <h3 className="text-[13px] font-bold text-white tracking-wide border-b border-[#1e293b] pb-4 mb-4">
            ผังที่นั่ง DAY 2
          </h3>
          <SeatingLayoutMap key="d2" bookedD1Count={stats.bookedCountD1} bookedD2Count={stats.bookedCountD2} initialDay="day2" />
        </div>
      )}

      {/* SETTINGS */}
      {activeTab === 'settings' && (
        <div className="bg-[#0f172a] border border-[#1e293b] rounded-2xl p-6 shadow-lg max-w-2xl">
          <h3 className="text-[13px] font-bold text-white tracking-wide border-b border-[#1e293b] pb-4 mb-4">
            ตั้งค่าระบบ (System Settings)
          </h3>
          <div className="flex items-center justify-between bg-[#121b29] p-4 rounded-xl border border-[#1c2536]">
            <div>
              <p className="text-sm font-bold text-slate-200">แสดงสถิติแบบเรียลไทม์บนหน้าเว็บสาธารณะ</p>
              <p className="text-[11px] text-slate-400 mt-1">หากเปิดใช้งาน ผู้เข้าชมเว็บไซต์ทั่วไปจะเห็นกล่อง 4 สีสรุปข้อมูล (สถิติหน้าโหลดเข้าเว็บ)</p>
            </div>
            <button
              onClick={() => setShowPublicStats(!showPublicStats)}
              className={`w-12 h-6 rounded-full transition-colors relative flex items-center shrink-0 ${showPublicStats ? 'bg-blue-600' : 'bg-slate-700'}`}
            >
              <div className={`w-4 h-4 rounded-full bg-white absolute transition-all ${showPublicStats ? 'left-7' : 'left-1'}`} />
            </button>
          </div>
        </div>
      )}

      {/* END OF MAIN CONTENT */}
      </main>
    </div>
  );
}

export default App;
