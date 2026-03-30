import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useWebSocketHook from 'react-use-websocket';
const useWebSocket = (typeof useWebSocketHook === 'function' ? useWebSocketHook : (useWebSocketHook as any).useWebSocket || (useWebSocketHook as any).default) as any;
import { ShieldCheck, ShieldAlert, Activity, BarChart2, Hash, AlertTriangle, ChevronDown, ChevronUp, Lock, FlaskConical, Send, RotateCcw } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

/* ── Palette ──────────────────────────────────────────────────
   #001D39  darkest navy     – page background
   #0A4174  dark blue        – card backgrounds
   #49769F  slate blue       – borders, muted text
   #4E8EA2  teal blue        – safe / clean indicators
   #6EA2B3  medium teal      – secondary safe, chart
   #7BBDE8  light blue       – headings, accents, suspicious
   #BDD8E9  ice blue         – lightest text, malicious glow
   ───────────────────────────────────────────────────────────── */

const C = {
  navy:    '#001D39',
  dark:    '#7BBDE8',
  slate:   '#49769F',
  teal:    '#4E8EA2',
  mid:     '#6EA2B3',
  light:   '#7BBDE8',
  ice:     '#001D39',
};

// Semantic colors for threat states (pie chart, badges)
const STATUS = {
  safe:       '#10B981',
  suspicious: '#F59E0B',
  malicious:  '#EF4444',
};

const CustomPieTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="backdrop-blur-md p-4 rounded-2xl shadow-xl border z-50"
        style={{ backgroundColor: C.dark, borderColor: C.slate }}>
        <p className="font-extrabold text-sm tracking-wider uppercase mb-1" style={{ color: payload[0].payload.color }}>
          {payload[0].name}
        </p>
        <p className="text-3xl font-black" style={{ color: C.ice }}>{payload[0].value} <span className="text-sm font-medium" style={{ color: C.slate }}>Events</span></p>
      </div>
    );
  }
  return null;
};

export default function Dashboard() {
  const [dataHistory, setDataHistory] = useState<any[]>([]);
  const [threatLog, setThreatLog] = useState<any[]>([]);
  const [isLogOpen, setIsLogOpen] = useState(false);
  
  const [testPacketSize, setTestPacketSize] = useState('');
  const [testPacketCount, setTestPacketCount] = useState('');
  const [testEntropy, setTestEntropy] = useState('');
  const [testResult, setTestResult] = useState<any>(null);
  const [testLoading, setTestLoading] = useState(false);
  const [testError, setTestError] = useState('');

  const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:8000/ws';
  const { lastJsonMessage } = useWebSocket(WS_URL, {
    shouldReconnect: () => true,
    reconnectInterval: 3000,
  });

  useEffect(() => {
    if (lastJsonMessage && typeof lastJsonMessage === 'object' && 'packet_size_kb' in lastJsonMessage) {
      const msg: any = lastJsonMessage;
      const newData = { ...msg, time: new Date().toLocaleTimeString(), id: Date.now() + Math.random() };
      setDataHistory(prev => {
        const h = [...prev, newData];
        return h.length > 30 ? h.slice(h.length - 30) : h;
      });
      setThreatLog(prev => {
        const l = [newData, ...prev];
        return l.length > 200 ? l.slice(0, 200) : l;
      });
    }
  }, [lastJsonMessage]);

  const msg: any = lastJsonMessage || {};
  const packetSize = typeof msg.packet_size_kb === 'number' ? msg.packet_size_kb : 0;
  const packetCount = typeof msg.packet_count_pps === 'number' ? msg.packet_count_pps : 0;
  const entropy = typeof msg.entropy === 'number' ? msg.entropy : 0;
  const threatLevel = typeof msg.threat_level === 'string' ? msg.threat_level : 'Connecting to Server...';
  const totalVotes = typeof msg.total_votes === 'number' ? msg.total_votes : 0;
  const votes = msg.votes || { packet_size: false, packet_count: false, entropy: false };
  const isMalicious = totalVotes >= 2;
  const isSuspicious = totalVotes === 1;

  const totalEvents = threatLog.length || 1;
  const safeEvents = threatLog.filter(l => l.total_votes === 0).length;
  const maliciousEvents = threatLog.filter(l => l.total_votes >= 2).length;
  const suspiciousEvents = threatLog.length - safeEvents - maliciousEvents;
  const safePercentage = Math.round((safeEvents / totalEvents) * 100);

  const pieData = [
    { name: 'Safe', value: safeEvents, color: STATUS.safe },
    { name: 'Suspicious', value: suspiciousEvents, color: STATUS.suspicious },
    { name: 'Malicious', value: maliciousEvents, color: STATUS.malicious }
  ];

  const packetsScrubbed = typeof msg.scrubbed_packets === 'number' ? msg.scrubbed_packets : 0;
  const ipsBlocked = typeof msg.blocked_nodes_count === 'number' ? msg.blocked_nodes_count : 0;

  return (
    <div style={{ backgroundColor: C.navy }} className="min-h-screen font-sans p-4 md:p-8 transition-colors duration-500">
      <div className="max-w-7xl mx-auto">

        {/* ── HEADER ── */}
        <header className="flex flex-col md:flex-row items-center justify-between mb-8 p-6 rounded-2xl shadow-lg backdrop-blur-md gap-4"
          style={{ backgroundColor: C.dark, borderColor: C.slate, border: `1px solid ${C.slate}40` }}>
          <div>
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight flex items-center gap-3" style={{ color: '#FFFFFF' }}>
              <ShieldCheck style={{ color: '#FFFFFF' }} size={36} />
              Real-Time NDSS
            </h1>
            <p className="mt-2 font-medium" style={{ color: C.slate }}>Network Decision Support System</p>
          </div>
          <div className={`px-6 py-4 rounded-xl border-2 flex items-center gap-3 shadow-sm transition-all duration-300 ${isMalicious ? 'animate-pulse' : ''}`}
            style={{
              backgroundColor: isMalicious ? `${STATUS.malicious}15` : isSuspicious ? `${STATUS.suspicious}15` : `${STATUS.safe}15`,
              borderColor: isMalicious ? STATUS.malicious : isSuspicious ? STATUS.suspicious : STATUS.safe,
              color: isMalicious ? STATUS.malicious : isSuspicious ? STATUS.suspicious : STATUS.safe
            }}>
            {isMalicious ? <ShieldAlert size={28} /> : isSuspicious ? <AlertTriangle size={28} /> : <ShieldCheck size={28} />}
            <span className="font-bold text-xl uppercase tracking-wider">{threatLevel}</span>
          </div>
        </header>

        {/* ── METRIC CARDS ── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <MetricCard title="Avg Packet Size" value={packetSize.toFixed(1)} unit="KB" icon={<BarChart2 style={{ color: C.light }} />} isVoted={!!votes.packet_size} />
          <MetricCard title="Packet Count" value={packetCount.toFixed(0)} unit="PPS" icon={<Hash style={{ color: C.light }} />} isVoted={!!votes.packet_count} />
          <MetricCard title="Entropy" value={entropy.toFixed(2)} unit="Bits" icon={<Activity style={{ color: C.light }} />} isVoted={!!votes.entropy} />
        </div>

        {/* ── MAIN GRID ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch mb-12">
          <div className="lg:col-span-2 flex flex-col gap-6">

            {/* Chart */}
            <div className="backdrop-blur-md rounded-3xl shadow-lg p-8 flex flex-col"
              style={{ backgroundColor: C.dark, border: `1px solid ${C.slate}30` }}>
              <h2 className="text-2xl font-bold mb-6 pb-4" style={{ color: C.navy, borderBottom: `1px solid ${C.navy}15` }}>Real-Time Traffic Analysis</h2>
              <div className="h-72 w-full mb-6 relative z-0">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={dataHistory} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={`${C.slate}30`} vertical={false} />
                    <XAxis dataKey="time" hide />
                    <YAxis stroke={C.slate} yAxisId="left" />
                    <YAxis stroke={C.slate} yAxisId="right" orientation="right" />
                    <RechartsTooltip contentStyle={{ backgroundColor: C.navy, borderRadius: '12px', border: `1px solid ${C.slate}`, color: '#FFFFFF' }} />
                    <Line yAxisId="left" type="monotone" name="Packets/Sec" dataKey="packet_count_pps" stroke={C.navy} strokeWidth={3} dot={false} isAnimationActive={false} />
                    <Line yAxisId="right" type="stepAfter" name="Entropy" dataKey="entropy" stroke="#0A4174" strokeWidth={3} dot={false} isAnimationActive={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <div className="pt-4 flex justify-center" style={{ borderTop: `1px solid ${C.slate}30` }}>
                <button onClick={() => setIsLogOpen(!isLogOpen)}
                  className="flex items-center gap-2 font-bold py-2.5 px-6 rounded-full shadow-sm border-2 transition-all duration-300"
                  style={{ backgroundColor: C.navy, color: '#FFFFFF', borderColor: `${C.slate}50` }}>
                  <AlertTriangle style={{ color: isLogOpen ? '#FFFFFF' : C.light }} size={18} />
                  {isLogOpen ? "Hide Threat Detection Event Log" : "View Threat Detection Event Log"}
                </button>
              </div>
              {isLogOpen && (
                <div className="mt-6 pt-6" style={{ borderTop: `1px solid ${C.slate}30` }}>
                  {threatLog.length === 0 ? (
                    <div className="font-medium italic p-6 text-center border-2 border-dashed rounded-2xl" style={{ color: C.slate, borderColor: `${C.slate}40` }}>
                      <ShieldCheck className="mx-auto mb-3" style={{ color: `${C.teal}60` }} size={36} />
                      Waiting to record first events...
                    </div>
                  ) : (
                    <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                      {threatLog.map((log) => <EventLogCard key={log.id} log={log} />)}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* DPI Stream */}
            <div className="backdrop-blur-md rounded-3xl shadow-lg p-6 flex flex-col relative overflow-hidden h-[500px]"
              style={{ backgroundColor: C.dark, border: `1px solid ${C.slate}30` }}>
              <div className="flex items-center justify-between mb-4 pb-3 shrink-0" style={{ borderBottom: `1px solid ${C.slate}20` }}>
                <h2 className="text-lg font-bold flex items-center gap-2" style={{ color: C.navy }}>
                  <Activity size={20} style={{ color: C.navy }} /> Deep Packet Inspection Stream
                </h2>
                <div className="px-3 py-1 rounded-full text-[10px] font-black tracking-widest uppercase animate-pulse flex items-center gap-1"
                  style={{ backgroundColor: `${C.teal}20`, color: C.teal }}>
                  <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: C.teal }}></div> LIVE
                </div>
              </div>
              <div className="overflow-y-auto h-full custom-scrollbar scroll-smooth space-y-2.5 pr-2 relative z-10">
                {threatLog.slice(0, 50).map((log, i) => {
                  const isMal = log.total_votes >= 2;
                  const isSus = log.total_votes === 1;
                  const id = log.id ? log.id.toString().replace('.','').substring(0,8) : "00000000";
                  const badgeColor = isMal ? STATUS.malicious : isSus ? STATUS.suspicious : STATUS.safe;
                  return (
                    <div key={i} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-2xl border transition-colors"
                      style={{ backgroundColor: isMal ? `${STATUS.malicious}10` : isSus ? `${STATUS.suspicious}10` : `${C.navy}80`, borderColor: `${badgeColor}30` }}>
                      <div className="flex items-center gap-3 md:gap-6">
                        <span className="text-[10px] font-bold w-16" style={{ color: C.navy }}>{log.time}</span>
                        <span className="text-xs font-extrabold w-20" style={{ color: C.navy }}>PKT_{id}</span>
                        <span className="text-[11px] font-semibold hidden md:inline-block w-16" style={{ color: C.navy }}>SZ: {log.packet_size_kb.toFixed(0)}</span>
                        <span className="text-[11px] font-semibold hidden md:inline-block w-16" style={{ color: C.navy }}>ENT: {log.entropy.toFixed(1)}</span>
                      </div>
                      <div className="mt-2 sm:mt-0 text-right shrink-0">
                        <span className="text-[10px] font-black px-3 py-1.5 rounded-lg tracking-wider uppercase"
                          style={{ color: '#FFFFFF', backgroundColor: badgeColor }}>
                          {isMal ? 'Auto-Blocked' : isSus ? 'Flagged' : 'Clean'}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="absolute top-16 left-0 w-full h-10 pointer-events-none z-20"
                style={{ background: `linear-gradient(to bottom, ${C.dark}, transparent)` }}></div>
            </div>
          </div>

          {/* ── RIGHT SIDEBAR ── */}
          <div className="flex flex-col gap-6">

            {/* Voting Mechanism */}
            <div className="backdrop-blur-md rounded-3xl shadow-lg p-6 flex-1"
              style={{ backgroundColor: C.dark, border: `1px solid ${C.slate}30` }}>
              <h2 className="text-xl font-bold mb-4" style={{ color: C.navy }}>Voting Mechanism</h2>
              <p className="text-sm mb-6" style={{ color: '#0A4174' }}>If 2 or more parameters hit the malicious threshold, a threat is declared.</p>
              <VoteRow label="Packet Size Anomaly" voted={!!votes.packet_size} />
              <VoteRow label="Packet Count Spike" voted={!!votes.packet_count} />
              <VoteRow label="High Entropy Payload" voted={!!votes.entropy} />
              <div className="mt-6 pt-4 flex items-center justify-between" style={{ borderTop: `1px solid ${C.navy}15` }}>
                <span className="font-semibold" style={{ color: C.navy }}>Total Malicious Votes:</span>
                <span className="text-2xl font-black" style={{ color: isMalicious ? STATUS.malicious : C.navy }}>
                  {totalVotes} <span className="text-lg" style={{ color: C.navy }}>/ 3</span>
                </span>
              </div>
            </div>

            {/* Threat Distribution */}
            <div className="backdrop-blur-md rounded-3xl shadow-lg p-6 flex flex-col justify-between flex-1"
              style={{ backgroundColor: C.dark, border: `1px solid ${C.slate}30` }}>
              <div className="flex justify-between items-end pb-3 mb-2" style={{ borderBottom: `1px solid ${C.slate}20` }}>
                <h2 className="text-lg font-bold" style={{ color: C.navy }}>Threat Distribution</h2>
                <div className="flex flex-col items-end">
                  <span className="text-xl font-black leading-none" style={{ color: STATUS.safe }}>{safePercentage}%</span>
                  <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: STATUS.safe }}>Safe Traffic</span>
                </div>
              </div>
              <div className="h-44 w-full flex justify-center items-center relative my-2">
                {threatLog.length === 0 ? (
                  <span className="font-medium italic" style={{ color: C.slate }}>Pending data...</span>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={pieData} cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={4} dataKey="value" stroke="none" isAnimationActive={false}>
                        {pieData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                      </Pie>
                      <RechartsTooltip content={<CustomPieTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </div>
              <div className="flex justify-between items-center mt-2 px-1 text-[11px] font-bold uppercase tracking-wider">
                <div className="flex items-center gap-1.5" style={{ color: STATUS.safe }}>
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: STATUS.safe }}></div> Safe
                </div>
                <div className="flex items-center gap-1.5" style={{ color: STATUS.suspicious }}>
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: STATUS.suspicious }}></div> Suspect
                </div>
                <div className="flex items-center gap-1.5" style={{ color: STATUS.malicious }}>
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: STATUS.malicious }}></div> Threats
                </div>
              </div>
            </div>

            {/* Active Mitigation */}
            <div className="backdrop-blur-md rounded-3xl shadow-lg p-6 relative overflow-hidden flex-1 flex flex-col justify-center"
              style={{ backgroundColor: `${C.teal}15`, border: `1px solid ${C.teal}30` }}>
              <div className="absolute -right-4 -top-4 pointer-events-none" style={{ color: `${C.teal}10` }}>
                <ShieldCheck size={120} />
              </div>
              <h2 className="text-lg font-bold mb-4 flex items-center gap-2 pb-2 relative z-10 w-full"
                style={{ color: '#FFFFFF', borderBottom: `1px solid ${C.teal}25` }}>
                <ShieldCheck size={20} style={{ color: C.light }} /> Active Mitigation
              </h2>
              <div className="space-y-4 pt-2 relative z-10 w-full">
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-widest mb-1 flex items-center gap-1" style={{ color: C.light }}><Lock size={12}/> Scrubbed Packets</div>
                  <div className="text-4xl font-black tracking-tight" style={{ color: '#FFFFFF' }}>
                    {packetsScrubbed > 0 ? packetsScrubbed.toLocaleString() : "0"}
                  </div>
                </div>
                <div className="h-px w-full" style={{ backgroundColor: `${C.teal}40` }}></div>
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-widest mb-1 flex items-center gap-1" style={{ color: C.light }}><ShieldAlert size={12}/> Auto-Blocked IPs</div>
                  <div className="text-2xl font-black mt-1" style={{ color: '#FFFFFF' }}>
                    {ipsBlocked} <span className="text-sm font-medium" style={{ color: C.light }}>Nodes</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── MANUAL TESTING ── */}
        <ManualTestPanel
          testPacketSize={testPacketSize} setTestPacketSize={setTestPacketSize}
          testPacketCount={testPacketCount} setTestPacketCount={setTestPacketCount}
          testEntropy={testEntropy} setTestEntropy={setTestEntropy}
          testResult={testResult} setTestResult={setTestResult}
          testLoading={testLoading} setTestLoading={setTestLoading}
          testError={testError} setTestError={setTestError}
        />
      </div>
    </div>
  );
}

/* ── Sub-Components ── */

function MetricCard({ title, value, unit, icon, isVoted }: { title: string; value: string; unit: string; icon: React.ReactNode; isVoted: boolean }) {
  return (
    <div className="backdrop-blur-md rounded-3xl p-6 shadow-lg border-2 transition-all"
      style={{ backgroundColor: C.dark, borderColor: isVoted ? STATUS.malicious : `${C.navy}15` }}>
      <div className="flex items-center justify-between mb-4">
        <div className="font-medium" style={{ color: C.navy }}>{title}</div>
        <div className="p-2 rounded-xl" style={{ backgroundColor: C.navy }}>{icon}</div>
      </div>
      <div className="flex items-baseline gap-2">
        <span className="text-4xl font-extrabold tracking-tight" style={{ color: C.navy }}>{value}</span>
        <span className="text-lg font-medium" style={{ color: C.navy }}>{unit}</span>
      </div>
      {isVoted && <div className="mt-3 text-sm font-bold flex items-center gap-1" style={{ color: STATUS.malicious }}><AlertTriangle size={14}/> Threshold Exceeded</div>}
    </div>
  );
}

function VoteRow({ label, voted }: { label: string; voted: boolean }) {
  return (
    <div className="flex justify-between items-center py-3 last:border-0" style={{ borderBottom: `1px solid ${C.navy}20` }}>
      <span className="font-medium" style={{ color: C.navy }}>{label}</span>
      <span className="px-4 py-1 rounded-full text-xs tracking-wider uppercase font-bold transition-colors"
        style={{ backgroundColor: voted ? STATUS.malicious : C.navy, color: '#FFFFFF' }}>
        {voted ? 'Voted' : 'Clean'}
      </span>
    </div>
  );
}

function EventLogCard({ log }: { log: any }) {
  const [expanded, setExpanded] = useState(false);
  const isMalicious = log.total_votes >= 2;
  const isSuspicious = log.total_votes === 1;
  const isSafe = !isMalicious && !isSuspicious;
  const statusColor = isMalicious ? STATUS.malicious : isSuspicious ? STATUS.suspicious : STATUS.safe;
  const statusLabel = isMalicious ? 'Malicious' : isSuspicious ? 'Threat' : 'Safe';

  return (
    <div className={`border-2 rounded-xl overflow-hidden transition-all duration-300 cursor-pointer ${expanded ? 'shadow-lg' : ''}`}
      style={{ borderColor: expanded ? `${statusColor}50` : `${C.navy}15`, backgroundColor: C.dark }}
      onClick={() => setExpanded(!expanded)}>
      <div className="p-4 flex items-center justify-between transition-colors"
        style={{ backgroundColor: expanded ? `${statusColor}08` : 'transparent' }}>
        <div className="flex items-center gap-4 md:gap-5">
          <div className="p-2 rounded-xl" style={{ backgroundColor: `${statusColor}20`, color: statusColor }}>
            {isMalicious ? <ShieldAlert size={20} /> : isSuspicious ? <AlertTriangle size={20} /> : <ShieldCheck size={20} />}
          </div>
          <div>
            <div className="font-bold text-md" style={{ color: C.navy }}>
              {isMalicious ? 'DDoS Detected' : isSuspicious ? 'Suspicious Traffic' : 'Traffic Normal'}
            </div>
            <div className="text-xs font-medium" style={{ color: C.navy }}>{log.time}</div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="px-3 py-1 text-[10px] font-black rounded-full uppercase tracking-widest shadow-sm hidden sm:inline-block"
            style={{ backgroundColor: statusColor, color: '#FFFFFF' }}>
            {statusLabel}
          </span>
          <div className="p-1.5 rounded-full" style={{ color: '#FFFFFF', backgroundColor: C.navy }}>
            {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </div>
        </div>
      </div>
      <div className={`transition-all duration-500 ease-in-out ${expanded ? 'max-h-[1000px] opacity-100' : 'max-h-0 opacity-0 overflow-hidden'}`}>
        <div className="px-5 pb-5 pt-2 mt-1" style={{ borderTop: `1px solid ${C.navy}15` }}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {[
              { label: 'Avg Packet Size', val: log.packet_size_kb.toFixed(1), unit: 'KB', voted: log.votes.packet_size },
              { label: 'Packet Rate', val: log.packet_count_pps.toFixed(0), unit: 'PPS', voted: log.votes.packet_count },
              { label: 'Entropy', val: log.entropy.toFixed(2), unit: 'Bits', voted: log.votes.entropy },
            ].map((m, idx) => (
              <div key={idx} className="p-3 rounded-lg border flex flex-col justify-center items-center"
                style={{ backgroundColor: m.voted ? `${STATUS.malicious}10` : `${C.navy}08`, borderColor: m.voted ? `${STATUS.malicious}25` : `${C.navy}15` }}>
                <div className="text-[10px] font-bold uppercase mb-1" style={{ color: C.navy }}>{m.label}</div>
                <div className="text-lg font-black" style={{ color: m.voted ? STATUS.malicious : C.navy }}>{m.val} <span className="text-xs">{m.unit}</span></div>
                {m.voted && <div className="text-[10px] mt-1 font-bold" style={{ color: STATUS.malicious }}>Failed</div>}
              </div>
            ))}
          </div>
          {isMalicious && (
            <div className="mt-4 p-4 rounded-xl border flex gap-3" style={{ backgroundColor: `${STATUS.malicious}10`, borderColor: `${STATUS.malicious}25` }}>
              <AlertTriangle className="shrink-0" style={{ color: STATUS.malicious }} size={20} />
              <p className="text-xs font-medium leading-relaxed" style={{ color: C.navy }}>
                {log.votes.packet_count && "• The extreme surge in packet rate indicates a botnet DDoS attack. "}
                {log.votes.packet_size && "• The high average packet size suggests bloated payloads for data extraction. "}
                {log.votes.entropy && "• The severe entropy score signifies encrypted exploit code. "}
              </p>
            </div>
          )}
          {isSafe && (
            <div className="mt-4 p-3 rounded-xl border flex items-center gap-2" style={{ backgroundColor: `${STATUS.safe}10`, borderColor: `${STATUS.safe}25` }}>
              <ShieldCheck className="shrink-0" style={{ color: STATUS.safe }} size={18} />
              <p className="text-xs font-semibold" style={{ color: STATUS.safe }}>Metrics within safe thresholds.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ManualTestPanel({ testPacketSize, setTestPacketSize, testPacketCount, setTestPacketCount, testEntropy, setTestEntropy, testResult: _testResult, setTestResult, testLoading, setTestLoading, testError, setTestError }: any) {
  const navigate = useNavigate();
  const handleAnalyze = async () => {
    const ps = parseFloat(testPacketSize), pc = parseFloat(testPacketCount), ent = parseFloat(testEntropy);
    if (isNaN(ps) || isNaN(pc) || isNaN(ent)) { setTestError('Please enter valid numbers for all fields.'); setTestResult(null); return; }
    if (ps < 0 || pc < 0 || ent < 0) { setTestError('Values must be positive.'); setTestResult(null); return; }
    setTestError(''); setTestLoading(true); setTestResult(null);
    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
      const resp = await fetch(`${API_URL}/api/test`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ packet_size: ps, packet_count: pc, entropy: ent }) });
      if (!resp.ok) throw new Error('Server error');
      const data = await resp.json();
      setTestLoading(false);
      navigate('/analysis', { state: { result: data } });
      return;
    } catch { setTestError('Failed to connect to the analysis server.'); }
    finally { setTestLoading(false); }
  };
  const handleReset = () => { setTestPacketSize(''); setTestPacketCount(''); setTestEntropy(''); setTestResult(null); setTestError(''); };

  return (
    <div className="backdrop-blur-md rounded-3xl shadow-lg p-8 mb-8"
      style={{ backgroundColor: C.dark, border: `1px solid ${C.navy}15` }}>
      <div className="flex items-center gap-3 mb-2">
        <div className="p-2.5 rounded-xl" style={{ backgroundColor: `${C.navy}15` }}>
          <FlaskConical style={{ color: C.navy }} size={24} />
        </div>
        <div>
          <h2 className="text-2xl font-bold" style={{ color: C.navy }}>Manual Packet Analysis</h2>
          <p className="text-sm mt-0.5" style={{ color: '#0A4174' }}>Enter custom values to test the Voting Mechanism classification</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mt-6">
        {[
          { label: 'Packet Size (KB)', val: testPacketSize, setter: setTestPacketSize, ph: 'e.g. 250', thresh: '> 1000 KB' },
          { label: 'Packet Count (PPS)', val: testPacketCount, setter: setTestPacketCount, ph: 'e.g. 5000', thresh: '> 15000 PPS' },
          { label: 'Entropy (Bits)', val: testEntropy, setter: setTestEntropy, ph: 'e.g. 4.5', thresh: '> 5.5 Bits', step: '0.1' },
        ].map((f, i) => (
          <div key={i}>
            <label className="block text-[11px] font-bold uppercase tracking-wider mb-2" style={{ color: C.navy }}>{f.label}</label>
            <input type="number" step={f.step} value={f.val} onChange={e => f.setter(e.target.value)} placeholder={f.ph}
              className="w-full px-4 py-3 rounded-xl border-2 font-semibold text-lg focus:outline-none transition-all placeholder:font-normal"
              style={{ backgroundColor: C.navy, color: '#FFFFFF', borderColor: `${C.slate}50` }}
              onFocus={e => e.target.style.borderColor = '#FFFFFF'}
              onBlur={e => e.target.style.borderColor = `${C.slate}50`} />
            <p className="text-[10px] mt-1.5 font-medium" style={{ color: C.navy }}>Threshold: {f.thresh}</p>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-3 mt-6">
        <button onClick={handleAnalyze} disabled={testLoading}
          className="flex items-center gap-2 font-bold py-3 px-8 rounded-xl shadow-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
          style={{ backgroundColor: C.navy, color: '#FFFFFF' }}>
          <Send size={16} /> {testLoading ? 'Analyzing...' : 'Analyze Packet'}
        </button>
        <button onClick={handleReset}
          className="flex items-center gap-2 font-bold py-3 px-6 rounded-xl transition-all duration-300"
          style={{ backgroundColor: C.navy, color: '#FFFFFF' }}>
          <RotateCcw size={16} /> Reset
        </button>
      </div>

      {testError && (
        <div className="mt-5 p-4 border-2 rounded-xl flex items-center gap-3"
          style={{ backgroundColor: `${STATUS.malicious}10`, borderColor: `${STATUS.malicious}30` }}>
          <AlertTriangle style={{ color: STATUS.malicious }} size={18} />
          <p className="text-sm font-semibold" style={{ color: STATUS.malicious }}>{testError}</p>
        </div>
      )}
    </div>
  );
}
