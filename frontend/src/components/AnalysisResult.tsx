import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ShieldCheck, ShieldAlert, AlertTriangle, ArrowLeft, BarChart2, Hash, Activity, Lock, Zap, Eye, Cpu, Info } from 'lucide-react';

const C = {
  navy:  '#001D39',
  dark:  '#7BBDE8',
  slate: '#49769F',
  teal:  '#4E8EA2',
  mid:   '#6EA2B3',
  light: '#7BBDE8',
  ice:   '#001D39',
};

const STATUS = {
  safe:       '#10B981',
  suspicious: '#F59E0B',
  malicious:  '#EF4444',
};

/* ── Verdict-specific content for the 3 insight cards ── */
const VERDICT_INSIGHTS = {
  Safe: {
    color: STATUS.safe,
    cards: [
      {
        icon: <ShieldCheck size={28} />,
        title: 'Why It\'s Safe',
        body: 'All three traffic parameters — packet size, packet count, and entropy — fall comfortably below their respective malicious thresholds. The voting mechanism cast 0 out of 3 votes, confirming no anomalous behaviour was detected in this packet sample.',
      },
      {
        icon: <Eye size={28} />,
        title: 'How We Determined Safety',
        body: 'Our 2/3 voting classifier evaluated each metric against established baselines. Packet size remained under 1 000 KB, the packet rate stayed below 15 000 PPS, and entropy was under 5.5 bits — none triggered a flag, so the traffic is classified as benign.',
      },
      {
        icon: <Cpu size={28} />,
        title: 'What "Safe" Means',
        body: 'This traffic exhibits normal network patterns consistent with everyday web browsing, standard API calls, or routine data transfer. No defensive action is required — the system continues passive monitoring while whitelisting this traffic profile.',
      },
    ],
  },
  Suspicious: {
    color: STATUS.suspicious,
    cards: [
      {
        icon: <AlertTriangle size={28} />,
        title: 'Why It\'s Suspicious',
        body: 'Exactly one of the three traffic parameters exceeded its established threshold. While a single anomaly doesn\'t confirm a threat, it deviates from the normal baseline enough to warrant heightened scrutiny and active monitoring.',
      },
      {
        icon: <Eye size={28} />,
        title: 'How We Detected the Anomaly',
        body: 'The voting mechanism registered 1 out of 3 votes — below the 2-vote malicious threshold. The system flags this as a potential precursor to an attack: early-stage reconnaissance, payload testing, or network probing often produce single-parameter anomalies.',
      },
      {
        icon: <Cpu size={28} />,
        title: 'What "Suspicious" Means',
        body: 'The traffic is placed under active watch. Rate limiters tighten, logging verbosity increases, and the system begins correlating this pattern with historical threat signatures. If the anomaly persists or compounds, escalation to "Malicious" is automated.',
      },
    ],
  },
  Malicious: {
    color: STATUS.malicious,
    cards: [
      {
        icon: <ShieldAlert size={28} />,
        title: 'Why It\'s Malicious',
        body: 'Two or more traffic parameters exceed their malicious thresholds simultaneously — a strong indicator of coordinated attack behaviour. The voting mechanism cast 2+ out of 3 votes, crossing the decisional boundary for threat confirmation.',
      },
      {
        icon: <Eye size={28} />,
        title: 'How the Threat Was Identified',
        body: 'Multi-vector anomalies are rarely coincidental. The system detected correlated spikes across metrics — oversized packets paired with volumetric flooding, or high entropy combined with abnormal packet rates — patterns consistent with DDoS, data exfiltration, or payload injection.',
      },
      {
        icon: <Cpu size={28} />,
        title: 'What "Malicious" Means',
        body: 'Immediate automated response is triggered: source IPs are auto-blocked, excess traffic is scrubbed, and the incident is logged for forensic analysis. The system escalates the alert to network administrators and begins correlating with known attack signatures.',
      },
    ],
  },
};

export default function AnalysisResult() {
  const location = useLocation();
  const navigate = useNavigate();
  const result = location.state?.result;

  /* ── Scroll to top on mount ── */
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, []);

  if (!result) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: C.navy }}>
        <div className="text-center">
          <ShieldAlert size={64} style={{ color: C.slate }} className="mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2" style={{ color: '#FFFFFF' }}>No Analysis Data</h1>
          <p className="mb-6" style={{ color: C.light }}>Please run an analysis from the dashboard first.</p>
          <button onClick={() => navigate('/')}
            className="flex items-center gap-2 mx-auto font-bold py-3 px-6 rounded-xl transition-all"
            style={{ backgroundColor: C.navy, color: '#FFFFFF', border: `1px solid ${C.slate}40` }}>
            <ArrowLeft size={18} /> Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const { verdict, total_votes, votes, thresholds, action, input } = result;
  const isMalicious = verdict === 'Malicious';
  const isSuspicious = verdict === 'Suspicious';
  const verdictColor = isMalicious ? STATUS.malicious : isSuspicious ? STATUS.suspicious : STATUS.safe;
  const insights = VERDICT_INSIGHTS[verdict as keyof typeof VERDICT_INSIGHTS] || VERDICT_INSIGHTS.Safe;

  const metrics = [
    { key: 'packet_size', label: 'Packet Size', value: input.packet_size, unit: 'KB', threshold: thresholds.packet_size_kb, icon: <BarChart2 size={22} />, desc: 'Average size of network packets. Oversized packets may indicate bloated payloads used for data exfiltration or buffer overflow attacks.' },
    { key: 'packet_count', label: 'Packet Count', value: input.packet_count, unit: 'PPS', threshold: thresholds.packet_count_pps, icon: <Hash size={22} />, desc: 'Rate of incoming packets per second. Extremely high rates indicate volumetric DDoS attacks from botnets flooding the network.' },
    { key: 'entropy', label: 'Entropy', value: input.entropy, unit: 'Bits', threshold: thresholds.entropy, icon: <Activity size={22} />, desc: 'Measures randomness in packet payloads. High entropy suggests encrypted or obfuscated exploit code designed to evade signature-based detection.' },
  ];

  return (
    <div className="min-h-screen font-sans" style={{ backgroundColor: C.navy }}>
      
      {/* Top Bar */}
      <div className="p-4 md:p-6" style={{ backgroundColor: C.dark, borderBottom: `1px solid ${C.navy}15` }}>
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <button onClick={() => navigate('/')}
            className="flex items-center gap-2 font-bold py-2 px-4 rounded-xl transition-all hover:opacity-80"
            style={{ backgroundColor: C.navy, color: '#FFFFFF', border: `1px solid ${C.slate}30` }}>
            <ArrowLeft size={18} /> Back to Dashboard
          </button>
          <div className="flex items-center gap-2">
            <ShieldCheck style={{ color: '#FFFFFF' }} size={24} />
            <span className="font-bold text-lg hidden sm:inline" style={{ color: '#FFFFFF' }}>NDSS Analysis Report</span>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto p-4 md:p-8">

        {/* ── VERDICT HERO ── */}
        <div className={`rounded-3xl p-8 md:p-12 mb-8 relative overflow-hidden ${isMalicious ? 'animate-pulse' : ''}`}
          style={{ backgroundColor: `${verdictColor}10`, border: `2px solid ${verdictColor}30` }}>
          <div className="absolute -right-8 -top-8 pointer-events-none opacity-5">
            {isMalicious ? <ShieldAlert size={200} style={{ color: verdictColor }} /> :
             isSuspicious ? <AlertTriangle size={200} style={{ color: verdictColor }} /> :
             <ShieldCheck size={200} style={{ color: verdictColor }} />}
          </div>
          <div className="relative z-10">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
              <div className="flex items-center gap-5">
                <div className="p-4 rounded-2xl" style={{ backgroundColor: `${verdictColor}20` }}>
                  {isMalicious ? <ShieldAlert style={{ color: verdictColor }} size={48} /> :
                   isSuspicious ? <AlertTriangle style={{ color: verdictColor }} size={48} /> :
                   <ShieldCheck style={{ color: verdictColor }} size={48} />}
                </div>
                <div>
                  <div className="text-sm font-bold uppercase tracking-widest mb-1" style={{ color: C.slate }}>Classification Result</div>
                  <div className="text-4xl md:text-5xl font-black tracking-tight" style={{ color: verdictColor }}>{verdict}</div>
                </div>
              </div>
              <div className="text-center md:text-right">
                <div className="text-6xl md:text-7xl font-black" style={{ color: verdictColor }}>
                  {total_votes}<span className="text-3xl" style={{ color: C.slate }}>/3</span>
                </div>
                <div className="text-sm font-bold uppercase tracking-wider mt-1" style={{ color: C.slate }}>Malicious Votes</div>
              </div>
            </div>

            <div className="mt-8 p-4 rounded-xl flex items-center gap-3"
              style={{ backgroundColor: `${C.dark}80`, border: `1px solid ${C.slate}20` }}>
              <Zap size={20} style={{ color: verdictColor }} />
              <div>
                <div className="text-sm font-bold" style={{ color: C.navy }}>Action Taken</div>
                <div className="text-lg font-black" style={{ color: C.navy }}>{action}</div>
              </div>
            </div>
          </div>
        </div>

        {/* ── VERDICT INSIGHT CARDS (Why / How / What) ── */}
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2" style={{ color: '#FFFFFF' }}>
          <Info size={20} style={{ color: verdictColor }} /> Verdict Breakdown
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {insights.cards.map((card, idx) => (
            <div key={idx} className="rounded-2xl p-6 flex flex-col relative overflow-hidden group transition-all duration-300 hover:shadow-xl hover:-translate-y-1"
              style={{ backgroundColor: C.dark, border: `1px solid ${verdictColor}25` }}>
              {/* Accent gradient top bar */}
              <div className="absolute top-0 left-0 w-full h-1 rounded-t-2xl" style={{ background: `linear-gradient(to right, ${verdictColor}, ${verdictColor}40)` }}></div>
              
              <div className="flex items-center gap-3 mb-4 mt-1">
                <div className="p-3 rounded-xl" style={{ backgroundColor: `${verdictColor}15`, color: verdictColor }}>
                  {card.icon}
                </div>
                <h3 className="text-lg font-bold" style={{ color: C.navy }}>{card.title}</h3>
              </div>
              <p className="text-sm leading-relaxed font-medium flex-1" style={{ color: '#0A4174' }}>
                {card.body}
              </p>
              {/* Bottom accent dot */}
              <div className="flex items-center gap-2 mt-5 pt-4" style={{ borderTop: `1px solid ${C.navy}10` }}>
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: verdictColor }}></div>
                <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: verdictColor }}>
                  {verdict} Traffic
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* ── DETAILED METRIC CARDS ── */}
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2" style={{ color: '#FFFFFF' }}>
          <Lock size={20} style={{ color: C.light }} /> Parameter Breakdown
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {metrics.map((m, idx) => {
            const voted = votes[m.key];
            const barPercent = Math.min((m.value / m.threshold) * 100, 150);
            const barColor = voted ? STATUS.malicious : STATUS.safe;
            return (
              <div key={idx} className="rounded-2xl p-6 flex flex-col"
                style={{ backgroundColor: C.dark, border: `1px solid ${voted ? `${STATUS.malicious}40` : `${C.navy}20`}` }}>
                
                {/* Header */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-lg" style={{ backgroundColor: `${C.navy}20`, color: C.navy }}>{m.icon}</div>
                    <span className="text-sm font-bold uppercase tracking-wider" style={{ color: C.navy }}>{m.label}</span>
                  </div>
                  <span className="text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest"
                    style={{ backgroundColor: barColor, color: '#FFFFFF' }}>
                    {voted ? 'VOTED' : 'CLEAN'}
                  </span>
                </div>

                {/* Value */}
                <div className="mb-4">
                  <div className="text-3xl font-black" style={{ color: C.navy }}>
                    {m.value} <span className="text-sm font-medium" style={{ color: C.navy }}>{m.unit}</span>
                  </div>
                  <div className="text-xs mt-1 font-semibold" style={{ color: C.navy }}>
                    Threshold: {m.threshold} {m.unit}
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="w-full h-2 rounded-full mb-4" style={{ backgroundColor: `${C.navy}20` }}>
                  <div className="h-full rounded-full transition-all duration-700"
                    style={{ width: `${Math.min(barPercent, 100)}%`, backgroundColor: barColor, boxShadow: voted ? `0 0 12px ${barColor}60` : 'none' }}></div>
                </div>

                {/* Description */}
                <p className="text-xs leading-relaxed flex-1 font-medium" style={{ color: '#0A4174' }}>{m.desc}</p>

                {/* Verdict */}
                {voted && (
                  <div className="mt-4 p-3 rounded-lg flex items-center gap-2"
                    style={{ backgroundColor: `${STATUS.malicious}15`, border: `1px solid ${STATUS.malicious}30` }}>
                    <AlertTriangle size={14} style={{ color: STATUS.malicious }} />
                    <span className="text-xs font-bold" style={{ color: STATUS.malicious }}>Exceeds safe threshold — flagged as anomalous</span>
                  </div>
                )}
                {!voted && (
                  <div className="mt-4 p-3 rounded-lg flex items-center gap-2"
                    style={{ backgroundColor: `${STATUS.safe}15`, border: `1px solid ${STATUS.safe}30` }}>
                    <ShieldCheck size={14} style={{ color: STATUS.safe }} />
                    <span className="text-xs font-bold" style={{ color: STATUS.safe }}>Within safe operating range</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* ── VOTING MECHANISM EXPLANATION ── */}
        <div className="rounded-2xl p-6 md:p-8 mb-8"
          style={{ backgroundColor: C.dark, border: `1px solid ${C.navy}20` }}>
          <h2 className="text-xl font-bold mb-4" style={{ color: C.navy }}>How the Voting Mechanism Works</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            {[
              { votes: 0, label: 'Safe', desc: 'No parameters exceed thresholds. Traffic is normal.', color: STATUS.safe },
              { votes: 1, label: 'Suspicious', desc: 'One parameter exceeds its threshold. System monitors closely.', color: STATUS.suspicious },
              { votes: '2-3', label: 'Malicious', desc: 'Two or more parameters vote malicious. Threat is blocked.', color: STATUS.malicious },
            ].map((item, i) => (
              <div key={i} className="p-4 rounded-xl" style={{ backgroundColor: `${item.color}15`, border: `1px solid ${item.color}30` }}>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-2xl font-black" style={{ color: item.color }}>{item.votes}</span>
                  <span className="text-sm font-bold uppercase tracking-wider" style={{ color: item.color }}>{item.label}</span>
                </div>
                <p className="text-xs font-medium" style={{ color: C.navy }}>{item.desc}</p>
              </div>
            ))}
          </div>

          <div className="p-4 rounded-xl" style={{ backgroundColor: C.navy, border: `1px solid ${C.slate}30` }}>
            <div className="text-xs font-medium leading-relaxed" style={{ color: '#FFFFFF' }}>
              <strong style={{ color: C.light }}>Your Input:</strong> Packet Size = {input.packet_size} KB, Packet Count = {input.packet_count} PPS, Entropy = {input.entropy} Bits → <strong style={{ color: verdictColor }}>{total_votes} vote(s) cast → {verdict}</strong>
            </div>
          </div>
        </div>

        {/* ── BACK BUTTON ── */}
        <div className="text-center pb-8">
          <button onClick={() => navigate('/')}
            className="inline-flex items-center gap-2 font-bold py-3 px-8 rounded-xl transition-all hover:opacity-90"
            style={{ backgroundColor: C.navy, color: '#FFFFFF' }}>
            <ArrowLeft size={18} /> Run Another Analysis
          </button>
        </div>
      </div>
    </div>
  );
}
