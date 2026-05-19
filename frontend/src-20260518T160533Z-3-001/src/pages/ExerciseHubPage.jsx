import React, { useState, useEffect } from 'react';

// ─── PUT YOUR YOUTUBE DATA API v3 KEY HERE ───────────────────────────────────
const YT_API_KEY = 'AIzaSyAnmgl0_rDfQ76dI-YkgjuInTwFTv2MbII';
// ─────────────────────────────────────────────────────────────────────────────

const CONDITIONS = ['All', 'PCOS', 'Fibroid', 'Anemia', 'Ovarian', 'Endometriosis'];

const COND_COLOR = {
  PCOS: '#22d3ee', Fibroid: '#a78bfa',
  Anemia: '#f87171', Ovarian: '#34d399', Endometriosis: '#fbbf24', All: '#22d3ee',
};

const INT_COLOR = { Low: 'var(--emerald)', Moderate: 'var(--amber)', High: 'var(--rose)' };

const EXERCISES = [
  { name:'Surya Namaskar',   emoji:'🌅', duration:'20 min', intensity:'Moderate', tags:['PCOS','Endometriosis'],
    desc:'12-pose flow that improves insulin sensitivity, cortisol regulation and hormonal balance. Best done in the morning on an empty stomach.' },
  { name:'Squats',           emoji:'🏋️', duration:'15 min', intensity:'Moderate', tags:['PCOS'],
    desc:'Compound lower body movement that boosts metabolism, supports testosterone regulation and improves insulin sensitivity.' },
  { name:'Swimming',         emoji:'🏊', duration:'30 min', intensity:'Low',      tags:['Fibroid','Endometriosis','Ovarian'],
    desc:'Low-impact full-body exercise that reduces pelvic inflammation and improves circulation without jarring the abdomen.' },
  { name:'Pilates',          emoji:'🤸', duration:'30 min', intensity:'Low',      tags:['Fibroid','Endometriosis'],
    desc:'Core strengthening with minimal intra-abdominal pressure — ideal for reducing pelvic pain and improving posture.' },
  { name:'Walking',          emoji:'🚶', duration:'30 min', intensity:'Low',      tags:['Anemia','PCOS'],
    desc:'Gentle aerobic activity that improves iron absorption, supports thyroid function, and boosts energy without fatigue.' },
  { name:'Yoga (Yin)',       emoji:'🧘', duration:'45 min', intensity:'Low',      tags:['Endometriosis','Ovarian','Anemia'],
    desc:'Deep tissue release postures held for 3–5 mins, reducing cortisol, pelvic tension and chronic inflammation.' },
  { name:'Cycling',          emoji:'🚴', duration:'30 min', intensity:'Moderate', tags:['PCOS'],
    desc:'Aerobic conditioning that improves insulin sensitivity, supports thyroid metabolism and enhances cardiovascular health.' },
  { name:'Resistance Bands', emoji:'💪', duration:'20 min', intensity:'Moderate', tags:['Anemia'],
    desc:'Builds lean muscle mass which supports metabolic rate, iron utilisation and bone density — key for hypothyroidism.' },
  { name:'Stretching',       emoji:'🤾', duration:'15 min', intensity:'Low',      tags:['Fibroid','Endometriosis'],
    desc:'Targeted hip flexor and lower back stretches reduce pelvic tightness and improve blood flow to the uterus.' },
  { name:'Dance / Zumba',    emoji:'💃', duration:'30 min', intensity:'High',     tags:['PCOS'],
    desc:'High-energy cardio that raises dopamine, burns calories, and significantly improves hormonal regulation and mood.' },
  { name:'Light Jogging',    emoji:'🏃', duration:'20 min', intensity:'Moderate', tags:['PCOS','Anemia'],
    desc:'Moderate cardio improving circulation, energy levels, and insulin sensitivity without excessive cortisol spike.' },
  { name:'Tai Chi',          emoji:'☯️', duration:'30 min', intensity:'Low',      tags:['Ovarian','Fibroid','Anemia'],
    desc:'Meditative movement practice that reduces stress hormones, improves balance and supports parasympathetic recovery.' },
];

const YT_QUERIES = {
  All:           { shorts: "women's health workout short",         long: "women's health exercise full routine" },
  PCOS:          { shorts: 'PCOS workout short yoga',              long: 'PCOS exercise routine hormonal balance' },
  Fibroid:       { shorts: 'fibroid gentle exercise short',        long: 'uterine fibroid workout low impact' },
  Anemia:        { shorts: 'anemia fatigue workout short',         long: 'iron deficiency anemia gentle exercise' },
  Ovarian:       { shorts: 'ovarian cyst yoga short',             long: 'ovarian cyst exercise pelvic relief' },
  Endometriosis: { shorts: 'endometriosis yoga gentle short',      long: 'endometriosis workout pain relief routine' },
};

export default function ExerciseHubPage() {
  const [filter, setFilter]         = useState('All');
  const [shorts, setShorts]         = useState([]);
  const [longVids, setLongVids]     = useState([]);
  const [loadingS, setLoadingS]     = useState(false);
  const [loadingL, setLoadingL]     = useState(false);
  const [modal, setModal]           = useState(null);
  const [error, setError]           = useState('');

  const visible = filter === 'All' ? EXERCISES : EXERCISES.filter(e => e.tags.includes(filter));

  const fetchVideos = async (f) => {
    const q = YT_QUERIES[f] || YT_QUERIES.All;
    setError('');

    // Shorts
    setLoadingS(true);
    try {
      const r = await fetch(
        `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(q.shorts)}&type=video&videoDuration=short&maxResults=6&key=${YT_API_KEY}`
      );
      const d = await r.json();
      if (d.error) { setError(d.error.message); setShorts([]); }
      else setShorts(d.items || []);
    } catch { setError('Network error — check your internet connection.'); }
    setLoadingS(false);

    // Long videos
    setLoadingL(true);
    try {
      const r = await fetch(
        `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(q.long)}&type=video&videoDuration=long&maxResults=6&key=${YT_API_KEY}`
      );
      const d = await r.json();
      if (!d.error) setLongVids(d.items || []);
    } catch {}
    setLoadingL(false);
  };

  useEffect(() => { fetchVideos('All'); }, []);

  const handleFilter = (f) => { setFilter(f); fetchVideos(f); };

  const clean = (t) => t.replace(/&amp;/g,'&').replace(/&#39;/g,"'").replace(/&quot;/g,'"');

  // ── VIDEO CARD
  const VideoCard = ({ v, isShort }) => (
    <div onClick={() => setModal(v.id.videoId)}
      style={{ borderRadius:12, border:'1.5px solid var(--border)', background:'var(--surface)', overflow:'hidden', cursor:'pointer', transition:'all 0.2s', display:'flex', flexDirection: isShort ? 'column' : 'row' }}
      onMouseEnter={e => { e.currentTarget.style.borderColor='rgba(34,211,238,0.35)'; e.currentTarget.style.transform='translateY(-2px)'; e.currentTarget.style.boxShadow='0 4px 20px rgba(34,211,238,0.08)'; }}
      onMouseLeave={e => { e.currentTarget.style.borderColor='var(--border)'; e.currentTarget.style.transform='translateY(0)'; e.currentTarget.style.boxShadow='none'; }}>

      {/* Thumbnail */}
      <div style={{ position:'relative', flexShrink:0, width: isShort ? '100%' : 200, height: isShort ? 155 : 118, background:'var(--bg-3)', overflow:'hidden' }}>
        <img
          src={v.snippet.thumbnails.medium?.url || v.snippet.thumbnails.default?.url}
          alt={clean(v.snippet.title)}
          style={{ width:'100%', height:'100%', objectFit:'cover', display:'block' }}
        />
        {/* Play button */}
        <div style={{ position:'absolute', inset:0, display:'flex', alignItems:'center', justifyContent:'center' }}>
          <div style={{ width:38, height:38, borderRadius:'50%', background:'rgba(34,211,238,0.88)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'0.9rem', boxShadow:'0 0 20px rgba(34,211,238,0.5)', paddingLeft:2 }}>▶</div>
        </div>
        {/* Type badge */}
        <div style={{ position:'absolute', top:6, left:6, background: isShort ? 'rgba(248,113,113,0.85)' : 'rgba(34,211,238,0.85)', color:'#fff', fontSize:'0.6rem', fontWeight:700, padding:'0.18rem 0.45rem', borderRadius:4, fontFamily:'var(--font-mono)', letterSpacing:'0.5px' }}>
          {isShort ? '⚡ SHORT' : '🎬 VIDEO'}
        </div>
      </div>

      {/* Info */}
      <div style={{ padding:'0.75rem 0.9rem', flex:1, minWidth:0, display:'flex', flexDirection:'column', justifyContent:'center' }}>
        <div style={{ fontSize:'0.8rem', fontWeight:600, color:'var(--text-1)', lineHeight:1.4, marginBottom:'0.3rem', display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical', overflow:'hidden' }}>
          {clean(v.snippet.title)}
        </div>
        <div style={{ fontSize:'0.68rem', color:'var(--text-3)', fontFamily:'var(--font-mono)' }}>
          {v.snippet.channelTitle}
        </div>
      </div>
    </div>
  );

  // ── SKELETON LOADER
  const Skeletons = ({ count, height }) => (
    <div style={{ display:'grid', gridTemplateColumns:`repeat(${count === 6 ? 3 : 2}, 1fr)`, gap:'0.85rem' }}>
      {Array(count).fill(0).map((_, i) => (
        <div key={i} className="skeleton" style={{ borderRadius:12, height }} />
      ))}
    </div>
  );

  return (
    <div className="page-container">

      {/* ── PAGE HEADER */}
      <div className="page-header">
        <div className="page-title-group">
          <div className="page-breadcrumb">NeuralCore · Health Tools</div>
          <h1 className="page-title">🏃 Exercise Hub</h1>
          <p className="page-subtitle">Condition-specific exercises with live YouTube Shorts and full workout videos — auto-filtered by condition.</p>
        </div>
        <div className="page-badges">
          <span className="badge badge-emerald">{EXERCISES.length} Exercises</span>
          <span className="badge badge-rose">📱 Shorts</span>
          <span className="badge badge-cyan">🎬 Full Videos</span>
        </div>
      </div>

      {/* ── CONDITION FILTER */}
      <div style={{ display:'flex', gap:'0.5rem', flexWrap:'wrap', marginBottom:'2.5rem', alignItems:'center' }}>
        {CONDITIONS.map(c => (
          <button key={c} onClick={() => handleFilter(c)}
            style={{ padding:'0.42rem 1.1rem', borderRadius:999, border:'1.5px solid', cursor:'pointer', transition:'all 0.18s', fontSize:'0.82rem', fontFamily:'var(--font-mono)', fontWeight: filter===c ? 700 : 400,
              borderColor: filter===c ? COND_COLOR[c] : 'var(--border)',
              background:  filter===c ? `${COND_COLOR[c]}1a` : 'transparent',
              color:       filter===c ? COND_COLOR[c] : 'var(--text-3)',
            }}>
            {c}
          </button>
        ))}
        {(loadingS || loadingL) && (
          <span style={{ fontFamily:'var(--font-mono)', fontSize:'0.72rem', color:'var(--text-3)', marginLeft:'auto', display:'flex', alignItems:'center', gap:'0.4rem' }}>
            <span className="spinner-sm" /> Fetching {filter === 'All' ? "women's health" : filter} videos...
          </span>
        )}
      </div>

      {/* API error */}
      {error && (
        <div style={{ padding:'0.85rem 1.1rem', borderRadius:10, background:'rgba(248,113,113,0.07)', border:'1px solid rgba(248,113,113,0.25)', color:'#f87171', fontSize:'0.8rem', fontFamily:'var(--font-mono)', marginBottom:'1.75rem' }}>
          ⚠ {error}
          {(error.includes('key') || error.includes('API')) && (
            <span> — Open <code style={{background:'rgba(0,0,0,0.25)',padding:'0.1rem 0.3rem',borderRadius:3}}>ExerciseHubPage.jsx</code> and replace <code style={{background:'rgba(0,0,0,0.25)',padding:'0.1rem 0.3rem',borderRadius:3}}>YOUR_YOUTUBE_API_KEY_HERE</code></span>
          )}
        </div>
      )}

      {/* ════════════════════════════════════════════════════
          SECTION 1 — YOUTUBE SHORTS
      ════════════════════════════════════════════════════ */}
      <div style={{ marginBottom:'3rem' }}>
        <div style={{ display:'flex', alignItems:'center', gap:'0.6rem', marginBottom:'1.25rem' }}>
          <div style={{ width:3, height:22, background:'#f87171', borderRadius:2 }} />
          <div>
            <div style={{ fontWeight:700, fontSize:'1rem', color:'var(--text-1)' }}>📱 YouTube Shorts</div>
            <div style={{ fontSize:'0.7rem', color:'var(--text-3)', fontFamily:'var(--font-mono)', marginTop:'0.1rem' }}>
              Quick workout clips under 60 seconds · {filter === 'All' ? "All conditions" : filter}
            </div>
          </div>
        </div>

        {loadingS && shorts.length === 0
          ? <Skeletons count={6} height={220} />
          : shorts.length > 0
            ? <div style={{ display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap:'0.85rem' }}>
                {shorts.map(v => <VideoCard key={v.id.videoId} v={v} isShort={true} />)}
              </div>
            : !loadingS && (
                <div style={{ padding:'2rem', textAlign:'center', color:'var(--text-3)', fontSize:'0.83rem', border:'1px dashed var(--border)', borderRadius:10, fontFamily:'var(--font-mono)' }}>
                  No shorts found — try a different condition filter
                </div>
              )
        }
      </div>

      {/* ════════════════════════════════════════════════════
          SECTION 2 — LONG VIDEOS
      ════════════════════════════════════════════════════ */}
      <div style={{ marginBottom:'3rem' }}>
        <div style={{ display:'flex', alignItems:'center', gap:'0.6rem', marginBottom:'1.25rem' }}>
          <div style={{ width:3, height:22, background:'var(--cyan)', borderRadius:2 }} />
          <div>
            <div style={{ fontWeight:700, fontSize:'1rem', color:'var(--text-1)' }}>🎬 Full Workout Videos</div>
            <div style={{ fontSize:'0.7rem', color:'var(--text-3)', fontFamily:'var(--font-mono)', marginTop:'0.1rem' }}>
              Complete routines 10 min+ · {filter === 'All' ? "All conditions" : filter}
            </div>
          </div>
        </div>

        {loadingL && longVids.length === 0
          ? <Skeletons count={4} height={118} />
          : longVids.length > 0
            ? <div style={{ display:'grid', gridTemplateColumns:'repeat(2, 1fr)', gap:'0.85rem' }}>
                {longVids.map(v => <VideoCard key={v.id.videoId} v={v} isShort={false} />)}
              </div>
            : !loadingL && (
                <div style={{ padding:'2rem', textAlign:'center', color:'var(--text-3)', fontSize:'0.83rem', border:'1px dashed var(--border)', borderRadius:10, fontFamily:'var(--font-mono)' }}>
                  No videos found — try a different condition filter
                </div>
              )
        }
      </div>

      {/* ════════════════════════════════════════════════════
          SECTION 3 — EXERCISE LIBRARY
      ════════════════════════════════════════════════════ */}
      <div>
        <div style={{ display:'flex', alignItems:'center', gap:'0.6rem', marginBottom:'1.25rem' }}>
          <div style={{ width:3, height:22, background:'var(--emerald)', borderRadius:2 }} />
          <div>
            <div style={{ fontWeight:700, fontSize:'1rem', color:'var(--text-1)' }}>📚 Exercise Library</div>
            <div style={{ fontSize:'0.7rem', color:'var(--text-3)', fontFamily:'var(--font-mono)', marginTop:'0.1rem' }}>
              {visible.length} exercises · evidence-based · {filter}
            </div>
          </div>
        </div>

        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(300px, 1fr))', gap:'1rem' }}>
          {visible.map(e => (
            <div key={e.name}
              style={{ padding:'1.2rem', borderRadius:14, border:'1.5px solid var(--border)', background:'var(--surface)', transition:'all 0.2s' }}
              onMouseEnter={ev => { ev.currentTarget.style.borderColor='rgba(34,211,238,0.28)'; ev.currentTarget.style.background='var(--surface-2)'; }}
              onMouseLeave={ev => { ev.currentTarget.style.borderColor='var(--border)'; ev.currentTarget.style.background='var(--surface)'; }}>
              <div style={{ display:'flex', alignItems:'flex-start', gap:'0.85rem', marginBottom:'0.7rem' }}>
                <span style={{ fontSize:'1.9rem', lineHeight:1, flexShrink:0 }}>{e.emoji}</span>
                <div style={{ flex:1 }}>
                  <div style={{ fontWeight:700, fontSize:'0.92rem', marginBottom:'0.35rem' }}>{e.name}</div>
                  <div style={{ display:'flex', gap:'0.35rem', flexWrap:'wrap' }}>
                    <span style={{ fontSize:'0.67rem', padding:'0.16rem 0.48rem', borderRadius:5, background:'rgba(34,211,238,0.08)', border:'1px solid rgba(34,211,238,0.18)', color:'var(--cyan)', fontFamily:'var(--font-mono)' }}>⏱ {e.duration}</span>
                    <span style={{ fontSize:'0.67rem', padding:'0.16rem 0.48rem', borderRadius:5, background:'rgba(0,0,0,0.18)', border:'1px solid var(--border)', color:INT_COLOR[e.intensity], fontFamily:'var(--font-mono)' }}>{e.intensity}</span>
                  </div>
                </div>
              </div>
              <p style={{ fontSize:'0.81rem', color:'var(--text-2)', lineHeight:1.65, marginBottom:'0.7rem' }}>{e.desc}</p>
              <div style={{ display:'flex', flexWrap:'wrap', gap:'0.28rem' }}>
                {e.tags.map(t => (
                  <span key={t} style={{ fontSize:'0.64rem', padding:'0.14rem 0.42rem', borderRadius:4, border:`1px solid ${COND_COLOR[t]||'var(--border)'}45`, background:`${COND_COLOR[t]||'#22d3ee'}0c`, color:COND_COLOR[t]||'var(--text-3)', fontFamily:'var(--font-mono)' }}>
                    {t}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── VIDEO MODAL */}
      {modal && (
        <div onClick={() => setModal(null)}
          style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.9)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000, backdropFilter:'blur(8px)' }}>
          <div onClick={e => e.stopPropagation()}
            style={{ width:'min(920px, 96vw)', borderRadius:14, overflow:'hidden', background:'#000', position:'relative', boxShadow:'0 0 80px rgba(34,211,238,0.15)' }}>
            <button onClick={() => setModal(null)}
              style={{ position:'absolute', top:10, right:10, zIndex:10, background:'rgba(0,0,0,0.7)', border:'1px solid rgba(255,255,255,0.15)', color:'#fff', width:32, height:32, borderRadius:'50%', cursor:'pointer', fontSize:'1rem', display:'flex', alignItems:'center', justifyContent:'center', lineHeight:1 }}>
              ✕
            </button>
            <div style={{ aspectRatio:'16/9' }}>
              <iframe width="100%" height="100%"
                src={`https://www.youtube.com/embed/${modal}?autoplay=1`}
                allow="autoplay; encrypted-media; fullscreen; picture-in-picture"
                allowFullScreen style={{ border:'none', display:'block' }} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
