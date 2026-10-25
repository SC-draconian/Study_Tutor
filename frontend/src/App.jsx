import { useCallback, useEffect, useRef, useState } from 'react';
import { ArrowRight, BookOpen, Brain, Check, CheckCircle2, ChevronDown, CircleHelp, Clock3, FileAudio2, FileText, GraduationCap, Headphones, Layers2, LoaderCircle, LogIn, Menu, MessageCircle, Mic2, Moon, MoreHorizontal, Plus, Send, Settings2, Sparkles, Sun, Trash2, Upload, UsersRound, X } from 'lucide-react';
import AuthPage, { useAuth, UserMenu } from './AuthPage.jsx';

const API = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');

function useTheme() {
  const [theme, setThemeState] = useState(() => {
    try {
      const stored = localStorage.getItem('studywise-theme');
      if (stored === 'dark' || stored === 'light') return stored;
    } catch {}
    return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    try { localStorage.setItem('studywise-theme', theme); } catch {}
  }, [theme]);
  const toggle = useCallback(() => setThemeState(t => t === 'dark' ? 'light' : 'dark'), []);
  return { theme, toggle };
}

function ThemeToggle({ theme, onToggle }) {
  return <button className="theme-toggle" onClick={onToggle} aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`} title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}>
    <Sun size={16} className="sun-icon" />
    <Moon size={16} className="moon-icon" />
  </button>;
}
function readCounter(key) {
  try { return Math.max(0, Number(localStorage.getItem(key)) || 0); } catch { return 0; }
}
function bumpCounter(key) {
  try { const next = readCounter(key) + 1; localStorage.setItem(key, String(next)); return next; } catch { return 0; }
}
async function api(path, options = {}) {
  const response = await fetch(`${API}${path}`, options);
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.detail || `Request failed (${response.status})`);
  return data;
}

function LandingPage({ onEnter, onSignIn, stats, theme, onToggleTheme, user }) {
  useScrollReveal();
  const scrollTo = (id) => document.getElementById(id)?.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' });
  return <div className="landing-page">
    <header className="landing-nav">
      <a className="landing-brand" href="#home" onClick={event => { event.preventDefault(); scrollTo('home'); }}><span><BookOpen size={18}/></span>studywise</a>
      <nav aria-label="Main navigation"><button onClick={() => scrollTo('mission')}>How it works</button><button onClick={() => scrollTo('impact')}>Your impact</button><button onClick={() => scrollTo('features')}>Features</button></nav>
      <div style={{display:'flex',alignItems:'center',gap:'10px'}}><ThemeToggle theme={theme} onToggle={onToggleTheme} />{user ? <button className="nav-cta" onClick={onEnter}>Open my study space <ArrowRight size={15}/></button> : <button className="nav-cta" onClick={onSignIn}><LogIn size={14}/> Sign in</button>}</div>
    </header>
    <main>
      <section className="landing-hero" id="home">
        <div className="hero-glow glow-a"/><div className="hero-glow glow-b"/>
        <div className="hero-copy reveal is-visible">
          <div className="landing-kicker"><span className="pulse-dot"/> A CALMER WAY TO LEARN</div>
          <h1>Study with<br/>a little more <em>wonder.</em></h1>
          <p className="hero-italic">A reliable and trusted site to help students.</p>
          <p className="hero-description">Turn the notes you already have into the understanding you need. Ask, explore, and practice at your own pace.</p>
          <div className="landing-actions"><button className="launch-button" onClick={user ? onEnter : onSignIn}>{user ? 'Explore your study space' : 'Get started — it\'s free'} <ArrowRight size={16}/></button><button className="how-button" onClick={() => scrollTo('mission')}><span className="play-mark">↓</span> See how it works</button></div>
          <div className="trust-note"><span className="trust-badge"><CheckCircle2 size={14}/></span><span>Made for your own study space.<br/><b>Learn from the materials you choose.</b></span></div>
        </div>
        <div className="hero-visual reveal is-visible" aria-label="Studywise study cards illustration">
          <div className="visual-halo halo-one"/><div className="visual-halo halo-two"/>
          <div className="floating-chip chip-top"><Sparkles size={13}/> YOUR IDEAS, IN FOCUS</div>
          <div className="study-card card-back"><span className="mini-label">A QUICK CHECK</span><b>What connects<br/>these ideas?</b><div className="mini-lines"><i/><i/><i/></div></div>
          <div className="study-card card-front"><div className="card-topline"><span className="card-mark"><BookOpen size={15}/></span><span>STUDY NOTE · 01</span><span className="card-spark">✳</span></div><div className="card-question">Build understanding,<br/><em>one idea at a time.</em></div><div className="card-divider"/><div className="card-bottomline"><span><i/> GROUNDED IN YOUR SOURCES</span><ArrowRight size={14}/></div></div>
          <div className="floating-chip chip-bottom"><span className="chip-check"><Check size={12}/></span> A better kind of study session</div>
          <div className="visual-orbit orbit-a"/><div className="visual-orbit orbit-b"/><span className="decor-star star-a">✳</span><span className="decor-star star-b">✴</span>
        </div>
        <div className="hero-bottom"><span>MADE FOR CURIOUS MINDS</span><span>SCROLL TO EXPLORE <i>↓</i></span></div>
      </section>
      <section className="mission-section reveal-on-scroll" id="mission">
        <div className="section-kicker"><span>01</span> YOUR NOTES, WITH A LITTLE MORE MAGIC</div>
        <div className="mission-grid"><h2>Less rereading.<br/><em>More “oh, I get it.”</em></h2><div><p>Studywise turns your class materials into a patient learning companion. Get clear explanations with cited passages, then strengthen what you know with flashcards and quizzes made from your own sources.</p><button className="underlined-link" onClick={onEnter}>Bring your notes to life <ArrowRight size={15}/></button></div></div>
        <div className="mission-ribbon"><span><CheckCircle2 size={16}/> Your sources, always in view</span><i/><span><Brain size={16}/> Practice built around your material</span><i/><span><Sparkles size={16}/> Learn at your own pace</span></div>
      </section>
      <section className="impact-section reveal-on-scroll" id="impact">
        <div className="impact-heading"><div><div className="section-kicker"><span>02</span> A LITTLE PROGRESS ADDS UP</div><h2>Your learning, <em>in motion.</em></h2></div><p>These numbers are measured in this browser and local study space. Your activity stays on your device.</p></div>
        <div className="impact-grid">
          <ImpactCard icon={<UsersRound size={19}/>} tone="lime" value={stats.answeredCount > 0 ? 1 : 0} suffix="" title="Active students helped" note="One learner in this study space" />
          <ImpactCard icon={<FileText size={19}/>} tone="violet" value={stats.materialCount} suffix="" title="PDFs / DOCX processed" note="Sources in this study space" />
          <ImpactCard icon={<BookOpen size={19}/>} tone="coral" value={stats.visitCount} suffix="" title="Platform visits" note="Counted in this browser" />
        </div>
      </section>
      <section className="features-section reveal-on-scroll" id="features">
        <div className="feature-heading"><div className="section-kicker"><span>03</span> A STUDY FLOW THAT FEELS LIKE YOURS</div><h2>From “what is this?”<br/>to <em>“I’ve got this.”</em></h2><p>One connected space for understanding, remembering, and checking your progress.</p></div>
        <div className="feature-grid">
          <FeatureCard num="01" icon={<MessageCircle size={18}/>} tone="feature-sage" title="Ask without the awkward." body="Explore tricky ideas in plain language. Every explanation points back to the source passage that inspired it." tag="UNDERSTAND" />
          <FeatureCard num="02" icon={<Layers2 size={18}/>} tone="feature-lilac" title="Make recall a habit." body="Turn your class notes into bite-sized flashcards so you can practice remembering, not just recognizing." tag="REMEMBER" />
          <FeatureCard num="03" icon={<Brain size={18}/>} tone="feature-peach" title="Practice with purpose." body="Try low-pressure quizzes grounded in your materials, then revisit the ideas that need another look." tag="PRACTICE" />
        </div>
      </section>
      <section className="closing-section reveal-on-scroll"><div className="closing-spark">✳</div><div className="section-kicker">YOUR NEXT STUDY SESSION STARTS HERE</div><h2>Make room for the<br/><em>“aha” moments.</em></h2><p>Bring what you’re learning. We’ll help you work through it.</p><button className="launch-button" onClick={user ? onEnter : onSignIn}>{user ? 'Open my study space' : 'Sign up free'} <ArrowRight size={16}/></button></section>
    </main>
    <footer className="landing-footer"><a className="landing-brand" href="#home" onClick={event=>{event.preventDefault();scrollTo('home')}}><span><BookOpen size={16}/></span>studywise</a><span>Make understanding your superpower.</span><button onClick={user ? onEnter : onSignIn}>{user ? 'Go to your workspace' : 'Get started'} <ArrowRight size={13}/></button></footer>
  </div>;
}

function ImpactCard({ icon, tone, value, suffix, title, note }) {
  return <div className="impact-card reveal-on-scroll"><span className={`impact-icon ${tone}`}>{icon}</span><div className="impact-value"><CountUp value={value}/>{suffix}</div><h3>{title}</h3><p>{note}</p><div className="impact-bar"><i style={{width:`${Math.min(96,Math.max(16,value?Math.log10(value+1)*35:16))}%`}}/></div></div>;
}

function CountUp({ value }) {
  const ref = useRef(null);
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    const node = ref.current;
    if (!node || !('IntersectionObserver' in window)) { setDisplay(value); return; }
    let started = false;
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting || started) return;
      started = true;
      const duration = window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 950;
      const start = performance.now();
      const animate = (now) => {
        const progress = duration ? Math.min(1, (now-start)/duration) : 1;
        setDisplay(Math.round(value * (1 - (1-progress)**3)));
        if (progress < 1) requestAnimationFrame(animate);
      };
      requestAnimationFrame(animate);
      observer.disconnect();
    }, {threshold:.4});
    observer.observe(node);
    return () => observer.disconnect();
  }, [value]);
  return <span ref={ref}>{display.toLocaleString()}</span>;
}

function useScrollReveal() {
  useEffect(() => {
    const nodes = document.querySelectorAll('.reveal-on-scroll:not(.is-visible)');
    if (!('IntersectionObserver' in window)) { nodes.forEach(node => node.classList.add('is-visible')); return; }
    const observer = new IntersectionObserver(entries => entries.forEach(entry => {
      if (entry.isIntersecting) { entry.target.classList.add('is-visible'); observer.unobserve(entry.target); }
    }), { threshold: .12, rootMargin: '0px 0px -25px 0px' });
    nodes.forEach(node => observer.observe(node));
    return () => observer.disconnect();
  }, []);
}

function FeatureCard({ num, icon, tone, title, body, tag }) {
  return <article className="feature-card reveal-on-scroll"><div className="feature-card-top"><span className={`feature-icon ${tone}`}>{icon}</span><span className="feature-num">{num}</span></div><div className="feature-tag">{tag}</div><h3>{title}</h3><p>{body}</p><span className="feature-decoration">✳</span></article>;
}

function App() {
  const { theme, toggle: toggleTheme } = useTheme();
  const { user, profile, needsProfile, saveProfile, logout } = useAuth();
  const [showAuth, setShowAuth] = useState(false);
  const [landing, setLanding] = useState(true);
  const [page, setPage] = useState('Overview');
  const [sources, setSources] = useState([]);
  const [health, setHealth] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [selectedIds, setSelectedIds] = useState([]);
  const [question, setQuestion] = useState('');
  const [messages, setMessages] = useState([]);
  const [mode, setMode] = useState('Detailed');
  const [items, setItems] = useState([]);
  const [kind, setKind] = useState('flashcards');
  const [flipped, setFlipped] = useState({});
  const [revealed, setRevealed] = useState({});
  const [quizAnswers, setQuizAnswers] = useState({});
  const [uploadOpen, setUploadOpen] = useState(false);
  const [mobileNav, setMobileNav] = useState(false);
  const [answeredCount, setAnsweredCount] = useState(() => readCounter('studywise-answered-count'));
  const [visitCount, setVisitCount] = useState(() => readCounter('studywise-visit-count'));
  const inputRef = useRef(null);
  const chatEndRef = useRef(null);
  const sourceSelectionInitialized = useRef(false);

  const refresh = useCallback(async () => {
    try {
      const [s, h] = await Promise.all([api('/api/sources'), api('/api/health')]);
      setSources(s);
      if (!sourceSelectionInitialized.current) {
        sourceSelectionInitialized.current = true;
        setSelectedIds(s.map(source => source.id));
      } else setSelectedIds(ids => ids.filter(id => s.some(source => source.id === id)));
      setHealth(h); setError('');
    }
    catch (e) { setError(`Can't reach the Studywise API${API ? ` at ${API}` : ' on this site'}. Start the backend and refresh.`); }
  }, []);
  useEffect(() => { refresh(); }, [refresh]);
  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);
  useEffect(() => {
    try {
      if (sessionStorage.getItem('studywise-visited-session') !== 'yes') {
        sessionStorage.setItem('studywise-visited-session', 'yes');
        const next = bumpCounter('studywise-visit-count');
        setVisitCount(next);
      }
    } catch { /* Metrics are optional when browser storage is unavailable. */ }
  }, []);

  const showNotice = (text) => { setNotice(text); window.setTimeout(() => setNotice(''), 3200); };
  const uploaded = async (file) => {
    if (!file) return;
    setBusy(true); setError('');
    try {
      const form = new FormData(); form.append('file', file);
      const media = /\.(mp3|mp4|m4a|wav|webm|mpeg|mpga|ogg)$/i.test(file.name);
      const source = await api(media ? '/api/transcribe' : '/api/sources', { method: 'POST', body: form });
      await refresh(); setSelectedIds(ids => ids.includes(source.id) ? ids : [...ids, source.id]); setUploadOpen(false);
      showNotice(media ? `Transcribed and added ${source.name}` : `Added ${source.name} to your library`);
    } catch (e) { setError(e.message); }
    finally { setBusy(false); if (inputRef.current) inputRef.current.value = ''; }
  };
  const deleteSource = async (id) => {
    try { await api(`/api/sources/${id}`, { method: 'DELETE' }); setSelectedIds(ids => ids.filter(x => x !== id)); await refresh(); showNotice('Source removed'); }
    catch (e) { setError(e.message); }
  };
  const ask = async (event) => {
    event?.preventDefault(); if (!question.trim() || !sources.length || !selectedIds.length || busy) return;
    const q = question.trim(); setQuestion(''); setMessages(old => [...old, { role: 'user', text: q }, { role: 'loading' }]); setBusy(true); setError('');
    try {
      const result = await api('/api/chat', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ question: q, source_ids: selectedIds, mode: mode.toLowerCase() }) });
      setMessages(old => [...old.filter(m => m.role !== 'loading'), { role: 'assistant', ...result }]);
      const next = bumpCounter('studywise-answered-count');
      setAnsweredCount(next);
    } catch (e) { setMessages(old => old.filter(m => m.role !== 'loading')); setError(e.message); }
    finally { setBusy(false); }
  };
  const generate = async (requestedKind = kind) => {
    if (!sources.length || !selectedIds.length) { setError('Select at least one source to make study materials.'); return; }
    setKind(requestedKind); setBusy(true); setError(''); setItems([]);
    setRevealed({}); setQuizAnswers({}); setFlipped({});
    try { const result = await api(`/api/generate/${requestedKind}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ source_ids: selectedIds, count: requestedKind === 'quiz' ? 5 : 8 }) }); setItems(result.items || []); setPage(requestedKind === 'quiz' ? 'Practice quiz' : 'Flashcards'); }
    catch (e) { setError(e.message); }
    finally { setBusy(false); }
  };
  const selectPage = (name) => { setPage(name); setMobileNav(false); setError(''); };

  // Wait for Firebase to resolve auth state (prevents "Sign in" flicker for logged-in users)
  if (user === undefined) return <div className="app-shell" style={{display:'grid',placeItems:'center',minHeight:'100vh'}}><LoaderCircle className="spin" size={28} style={{color:'var(--green-strong, #76934a)'}}/></div>;

  if (showAuth && !user) return <AuthPage onAuth={(u, p) => { saveProfile(p); setShowAuth(false); setLanding(false); }} theme={theme} onToggleTheme={toggleTheme} />;
  if (user && needsProfile && showAuth) return <AuthPage onAuth={(u, p) => { saveProfile(p); setShowAuth(false); setLanding(false); }} theme={theme} onToggleTheme={toggleTheme} />;
  if (landing) return <LandingPage onEnter={() => { if (user) setLanding(false); else setShowAuth(true); }} onSignIn={() => setShowAuth(true)} stats={{ answeredCount, visitCount, materialCount: sources.filter(source => ['pdf', 'docx'].includes(source.kind)).length }} theme={theme} onToggleTheme={toggleTheme} user={user} />;

  const nav = [
    { label: 'LEARN', items: [{ name: 'Overview', icon: BookOpen }, { name: 'Ask your notes', icon: MessageCircle }] },
    { label: 'PRACTICE', items: [{ name: 'Flashcards', icon: Layers2 }, { name: 'Practice quiz', icon: Brain }] },
    { label: 'YOUR LIBRARY', items: [{ name: 'My sources', icon: FileText }] },
  ];

  return <div className="app-shell">
    <aside className={`sidebar ${mobileNav ? 'mobile-open' : ''}`}>
      <button className="brand brand-button" onClick={() => setLanding(true)} aria-label="Return to Studywise home"><span className="brand-symbol"><BookOpen size={17}/></span><span>studywise</span></button>
      <button className="course-switch"><span className="course-icon">N</span><span className="course-label"><b>My study space</b><small>Personal library</small></span><ChevronDown size={14}/></button>
      {nav.map(group => <div className="nav-group" key={group.label}><div className="nav-label">{group.label}</div>{group.items.map(item => <button key={item.name} className={`nav-item ${page === item.name ? 'active' : ''}`} onClick={() => selectPage(item.name)}><item.icon size={17}/>{item.name}{item.name === 'My sources' && <span className="nav-count">{sources.length}</span>}</button>)}</div>)}
      <div className="sidebar-spacer"/>
      <div className="study-streak"><div className="streak-top"><span className="streak-icon">✳</span><span>YOUR STUDY RHYTHM</span><MoreHorizontal size={16}/></div><b>One step at a time.</b><p>Small review sessions help ideas stick.</p><div className="week-dots">{['M','T','W','T','F','S','S'].map((d,i)=><span key={i} className={i===2?'today':''}>{d}</span>)}</div></div>
      <button className="nav-item settings-link" onClick={() => setUploadOpen(true)}><Settings2 size={17}/>Settings & sources</button>
      <div className="user-profile">{user ? <><div className="user-avatar">{(profile?.name || user?.displayName || 'S').charAt(0).toUpperCase()}</div><span><b>{(profile?.name || user?.displayName || 'Student').split(' ')[0]}</b><small>{user?.email || user?.phoneNumber || 'Study space'}</small></span><MoreHorizontal size={16}/></> : <><div className="user-avatar">S</div><span><b>My Study Space</b><small>Local workspace</small></span><MoreHorizontal size={16}/></>}</div>
    </aside>
    <main className="main-area">
      <header className="topbar"><button className="mobile-menu" onClick={() => setMobileNav(!mobileNav)}><Menu size={19}/></button><div className="breadcrumb">My study space <span>/</span> <b>{page}</b></div><div className="top-right"><div className={`api-status ${health?.ai_enabled ? 'connected' : ''}`}><i/>{health?.ai_enabled ? 'AI tutor ready' : health ? 'Local mode' : 'Connecting'}</div><ThemeToggle theme={theme} onToggle={toggleTheme} />{user ? <UserMenu user={user} profile={profile} onLogout={() => { logout(); setLanding(true); }} /> : <button className="avatar-button" onClick={() => setShowAuth(true)}>S</button>}</div></header>
      <div className="content">
        {error && <div className="alert"><CircleHelp size={16}/><span>{error}</span><button onClick={() => setError('')}><X size={15}/></button></div>}
        {page === 'Overview' && <Overview sources={sources} busy={busy} onUpload={() => setUploadOpen(true)} onNavigate={selectPage} onGenerate={generate} aiEnabled={health?.ai_enabled}/>}
        {page === 'My sources' && <Sources sources={sources} onUpload={() => setUploadOpen(true)} onDelete={deleteSource}/>}
        {page === 'Ask your notes' && <Chat messages={messages} question={question} setQuestion={setQuestion} ask={ask} busy={busy} sources={sources} selectedIds={selectedIds} setSelectedIds={setSelectedIds} mode={mode} setMode={setMode} endRef={chatEndRef} onUpload={() => setUploadOpen(true)}/>}
        {page === 'Flashcards' && <StudySet kind="flashcards" items={items} busy={busy} flipped={flipped} onFlip={i => setFlipped(v => ({...v,[i]:!v[i]}))} onGenerate={() => generate('flashcards')} onQuiz={() => generate('quiz')}/>}
        {page === 'Practice quiz' && <StudySet kind="quiz" items={items} busy={busy} revealed={revealed} answers={quizAnswers} onReveal={(i, answer) => { setRevealed(v => ({...v,[i]:true})); setQuizAnswers(v => ({...v,[i]:answer})); }} onGenerate={() => generate('quiz')} onQuiz={() => generate('flashcards')}/>}
        <footer className="footer"><span>Make understanding your superpower.</span><span>Studywise <i/> Local-first study workspace</span></footer>
      </div>
    </main>
    {uploadOpen && <div className="modal-backdrop" onMouseDown={e => e.target === e.currentTarget && setUploadOpen(false)}><div className="modal"><div className="modal-head"><div><div className="eyebrow">BUILD YOUR LIBRARY</div><h2>Bring your study materials</h2><p>Upload a source to chat with it and create revision materials.</p></div><button className="close-button" onClick={() => setUploadOpen(false)}><X size={17}/></button></div><label className={`drop-zone ${busy?'busy':''}`} onDragOver={e => e.preventDefault()} onDrop={e => { e.preventDefault(); if (!busy) uploaded(e.dataTransfer.files?.[0]); }}><input ref={inputRef} type="file" accept=".pdf,.docx,.txt,.md,.mp3,.mp4,.m4a,.wav,.webm,.mpeg,.mpga,.ogg" onChange={e => uploaded(e.target.files?.[0])} disabled={busy}/>{busy?<LoaderCircle className="spin" size={24}/>:<span className="upload-icon"><Upload size={20}/></span>}<b>{busy?'Processing your file':'Drop a file here, or browse'}</b><small>PDF, DOCX, TXT, Markdown, or audio/video · up to 20 MB</small></label><div className="upload-types"><div><FileText size={16}/><span><b>Documents</b><small>PDF, Word, notes</small></span><Check size={14}/></div><div><Headphones size={16}/><span><b>Lecture audio</b><small>MP3, WAV, MP4</small></span><span className="optional-label">API KEY</span></div></div>{!health?.ai_enabled&&<div className="inline-note"><Mic2 size={14}/> Audio transcription needs an OpenAI API key. Document uploads work in local mode.</div>}<button className="cancel-upload" onClick={() => setUploadOpen(false)}>Done</button></div></div>}
    {notice && <div className="toast"><CheckCircle2 size={16}/>{notice}</div>}
  </div>;
}

function Overview({sources,busy,onUpload,onNavigate,onGenerate,aiEnabled}) {
  const chunks = sources.reduce((sum,s)=>sum+s.chunk_count,0);
  return <>
    <section className="hero"><div className="hero-copy"><div className="eyebrow"><span/>YOUR PERSONAL STUDY SPACE</div><h1>Learn it for <em>real.</em></h1><p>Make sense of your notes, remember what matters, and feel ready for what’s next.</p><div className="hero-actions"><button className="primary-button" onClick={onUpload}><Plus size={16}/> Add study material</button><button className="secondary-button" onClick={()=>onNavigate('Ask your notes')}><MessageCircle size={15}/> Ask a question</button></div><div className="hero-footnote"><Sparkles size={13}/> Answers grounded in your own study materials</div></div><div className="hero-art"><div className="art-orbit orbit-one"/><div className="art-orbit orbit-two"/><div className="book-stack"><div className="book book-back"><span>STUDY NOTES</span></div><div className="book book-front"><div className="book-spark">✳</div><div>Make knowledge<br/>your own.</div><small>FIELD GUIDE · 01</small></div><div className="art-star star-one">✳</div><div className="art-star star-two">✴</div><div className="art-caption"><span>01</span> YOUR LEARNING JOURNEY</div></div></div></section>
    <div className="metrics"><div className="metric-card"><span className="metric-icon green"><FileText size={17}/></span><span><small>YOUR SOURCES</small><b>{String(sources.length).padStart(2,'0')} <i>uploaded</i></b></span><span className="metric-caption">Study materials</span></div><div className="metric-card"><span className="metric-icon lilac"><Layers2 size={17}/></span><span><small>KNOWLEDGE CHUNKS</small><b>{String(chunks).padStart(2,'0')} <i>indexed</i></b></span><span className="metric-caption">Ready to search</span></div><div className="metric-card"><span className="metric-icon peach"><Brain size={17}/></span><span><small>LEARNING TOOLS</small><b>03 <i>ways to learn</i></b></span><span className="metric-caption">Chat · cards · quiz</span></div><div className="metric-card"><span className="metric-icon blue"><Clock3 size={17}/></span><span><small>YOUR PACE</small><b>Go <i>at your pace</i></b></span><span className="metric-caption">No streak pressure</span></div></div>
    <section className="section-block"><div className="section-title"><div><div className="eyebrow">PICK UP WHERE YOU LEFT OFF</div><h2>A good place to begin.</h2><p>Your materials are the starting point for every session.</p></div><button className="quiet-link" onClick={onUpload}>Manage sources <span>→</span></button></div>
      {!sources.length?<div className="empty-library"><div className="empty-illustration"><div className="paper paper-back"/><div className="paper"><span/><span/><span/><i>✳</i></div><div className="empty-plus">+</div></div><div><h3>Your study space is ready.</h3><p>Add lecture notes, readings, or a transcript. Your tutor will use those sources to answer questions and build practice materials.</p><button className="primary-button" disabled={busy} onClick={onUpload}><Upload size={15}/> Upload your first source</button></div></div>:<div className="source-preview">{sources.slice(0,3).map((s,i)=><div className="source-card" key={s.id}><div className={`source-type type-${i%3}`}>{s.kind==='transcript'?<FileAudio2 size={18}/>:<FileText size={18}/>}</div><div><b>{s.name}</b><small>{s.chunk_count} study chunks · {s.kind.toUpperCase()}</small></div><button className="card-arrow" onClick={()=>onNavigate('My sources')}>→</button></div>)}</div>}
    </section>
    <section className="section-block tools-block"><div className="section-title"><div><div className="eyebrow">CHOOSE HOW YOU WANT TO LEARN</div><h2>Three ways to make it stick.</h2></div></div><div className="tool-grid"><button className="tool-card" onClick={()=>onNavigate('Ask your notes')}><div className="tool-symbol sage"><MessageCircle size={18}/></div><span className="tool-step">01 · UNDERSTAND</span><h3>Ask your notes</h3><p>Get a clear explanation with the source passage right there.</p><span className="tool-go">Start a conversation <span>↗</span></span></button><button className="tool-card" onClick={()=>onGenerate('flashcards')}><div className="tool-symbol lilac"><Layers2 size={18}/></div><span className="tool-step">02 · REMEMBER</span><h3>Make flashcards</h3><p>Turn the key ideas in your material into quick prompts.</p><span className="tool-go">Build your deck <span>↗</span></span></button><button className="tool-card" onClick={()=>onGenerate('quiz')}><div className="tool-symbol sand"><Brain size={18}/></div><span className="tool-step">03 · PRACTICE</span><h3>Try a practice quiz</h3><p>Check what you know and revisit anything that feels fuzzy.</p><span className="tool-go">Take a short quiz <span>↗</span></span></button></div></section>
    {aiEnabled&&<div className="privacy-footnote"><CheckCircle2 size={14}/> Study responses use the sources you select.</div>}
  </>;
}

function Sources({sources,onUpload,onDelete}) {return <div className="page-section"><div className="eyebrow"><span/>YOUR MATERIALS</div><div className="page-heading"><div><h1>Your source <em>library.</em></h1><p>Every answer and study set starts with the material stored here.</p></div><button className="primary-button" onClick={onUpload}><Plus size={16}/> Add source</button></div>{sources.length?<div className="source-table">{sources.map((s,i)=><div className="source-row" key={s.id}><div className={`source-type type-${i%3}`}>{s.kind==='transcript'?<FileAudio2 size={18}/>:<FileText size={18}/>}</div><div className="source-name"><b>{s.name}</b><small>{s.kind.toUpperCase()} · Added {new Date(s.created_at).toLocaleDateString()}</small></div><span className="source-chunks">{s.chunk_count} chunks</span><button className="delete-button" title="Delete source" onClick={()=>onDelete(s.id)}><Trash2 size={15}/></button></div>)}</div>:<div className="empty-page"><div className="empty-icon"><FileText size={23}/></div><h3>No materials yet</h3><p>Upload course notes or readings to start building your study library.</p><button className="primary-button" onClick={onUpload}><Upload size={15}/> Upload material</button></div>}<div className="page-tip"><Sparkles size={15}/><span><b>Helpful tip</b> Text-based PDF and DOCX files work best. Scanned pages may need OCR before the tutor can read them.</span></div></div>}

function Chat({messages,question,setQuestion,ask,busy,sources,selectedIds,setSelectedIds,mode,setMode,endRef,onUpload}) {return <div className="chat-page"><div className="chat-header"><div className="eyebrow"><span/>YOUR STUDY TUTOR</div><h1>Let's make it <em>click.</em></h1><p>Ask about something in your notes. The tutor will show the passages it used.</p><div className="source-selector"><span>USE SOURCES</span>{sources.length?sources.map(s=><button key={s.id} className={`source-chip ${selectedIds.includes(s.id)?'checked':''}`} onClick={()=>setSelectedIds(ids=>ids.includes(s.id)?ids.filter(x=>x!==s.id):[...ids,s.id])}><span>{selectedIds.includes(s.id)?<Check size={11}/>:null}</span>{s.name}</button>):<button className="source-chip add-source" onClick={onUpload}><Plus size={13}/> Add source</button>}</div></div>
  <div className="chat-thread">{!messages.length?<div className="chat-welcome"><div className="tutor-avatar"><Sparkles size={19}/></div><div className="welcome-bubble"><b>Hi! I'm your study tutor.</b><p>Pick something from your notes you’d like to understand better, or try one of these:</p><div className="prompt-chips">{['Explain the main idea simply','What are the key terms?','Help me compare two concepts'].map(p=><button key={p} onClick={()=>setQuestion(p)}>{p}<span>↗</span></button>)}</div></div></div>:messages.map((m,i)=><div className={`chat-message ${m.role}`} key={i}>{m.role==='user'?<><div className="message-bubble">{m.text}</div><div className="message-avatar">S</div></>:m.role==='loading'?<><div className="tutor-avatar"><Sparkles size={17}/></div><div className="typing"><i/><i/><i/></div></>:<><div className="tutor-avatar"><Sparkles size={17}/></div><div className="answer-content"><div className="answer-label">STUDYWISE TUTOR <span><Sparkles size={11}/> GROUNDED IN YOUR NOTES</span></div><div className="answer-text">{m.answer}</div>{m.tips?.length>0&&<div className="answer-extra"><b><Brain size={14}/> Try these memory techniques</b><ul>{m.tips.map((tip,j)=><li key={j}>{tip}</li>)}</ul></div>}{m.practice?.length>0&&<div className="answer-extra"><b><GraduationCap size={14}/> Quick practice</b>{m.practice.map((p,j)=><details key={j}><summary>{p.question}</summary><p>{p.answer}</p></details>)}</div>}{m.citations?.length>0&&<div className="citations"><b><BookOpen size={13}/> SOURCES USED</b>{m.citations.map((c,j)=><details key={c.id}><summary><span>[{j+1}]</span> {c.source} · p. {c.page}{c.section?` · ${c.section}`:''}</summary><p>{c.excerpt}</p></details>)}</div>}</div></>}</div>)}<div ref={endRef}/></div>
  <form className="chat-composer" onSubmit={ask}><div className="mode-select"><Sparkles size={13}/><select value={mode} onChange={e=>setMode(e.target.value)}><option>Detailed</option><option>Simple</option><option>Exam prep</option></select><ChevronDown size={12}/></div><input value={question} onChange={e=>setQuestion(e.target.value)} placeholder={!sources.length?'Add a source to get started':!selectedIds.length?'Select a source above':'Ask a question about your notes...'} disabled={!sources.length||!selectedIds.length||busy}/><button disabled={!question.trim()||!selectedIds.length||busy} aria-label="Send question">{busy?<LoaderCircle className="spin" size={17}/>:<Send size={17}/>}</button><div className="composer-hint">Answers use the sources selected above</div></form></div>}

function StudySet({kind,items,busy,flipped,onFlip,revealed,answers,onReveal,onGenerate,onQuiz}) {const isQuiz=kind==='quiz';return <div className="page-section study-page"><div className="eyebrow"><span/>{isQuiz?'RETRIEVAL PRACTICE':'ACTIVE RECALL'}</div><div className="page-heading"><div><h1>{isQuiz?'Check what you <em>know.</em>':'Remember the <em>important bits.</em>'}</h1><p>{isQuiz?'Low-pressure practice, built from your own materials.':'Tap a card to turn it over. Practice remembering before you peek.'}</p></div><div className="study-actions"><button className="secondary-button" onClick={onQuiz}>{isQuiz?<Layers2 size={15}/>:<Brain size={15}/>} Make {isQuiz?'flashcards':'a quiz'}</button><button className="primary-button" disabled={busy} onClick={onGenerate}>{busy?<LoaderCircle className="spin" size={15}/>:<Sparkles size={15}/>} Generate {isQuiz?'quiz':'cards'}</button></div></div>{items.length?<><div className="deck-info"><span>{items.length} {isQuiz?'questions':'cards'}</span><span><Sparkles size={13}/> Made from your selected study materials</span></div><div className={isQuiz?'quiz-list':'flashcard-grid'}>{items.map((item,i)=>isQuiz?<div className="quiz-card" key={i}><div className="quiz-number">QUESTION {String(i+1).padStart(2,'0')}</div><h3>{item.question}</h3><div className="choices">{(item.choices||[]).map((choice,j)=><button key={j} disabled={Boolean(revealed[i])} className={revealed[i]&&choice===item.answer?'correct':revealed[i]&&choice===answers[i]?'incorrect':''} onClick={()=>onReveal(i,choice)}><span>{String.fromCharCode(65+j)}</span>{choice}</button>)}</div>{revealed[i]&&<div className={`quiz-answer ${answers[i]===item.answer?'right':'wrong'}`}><CheckCircle2 size={15}/><span><b>{answers[i]===item.answer?'Correct — nice recall.':`The answer is: ${item.answer}`}</b><small>{item.explanation}</small></span></div>}<div className="card-source">{item.source}</div></div>:<button className={`flashcard ${flipped[i]?'flipped':''}`} key={i} onClick={()=>onFlip(i)}><span className="flashcard-top">{flipped[i]?'ANSWER':'PROMPT'} <span>{String(i+1).padStart(2,'0')}</span></span><b>{flipped[i]?item.back:item.front}</b><span className="flashcard-source">{item.source}</span><span className="flashcard-bottom">{flipped[i]?'Tap to see prompt':'Think, then tap to reveal'} <span>↻</span></span></button>)}</div></>:<div className="empty-page materials-empty"><div className="empty-icon">{busy?<LoaderCircle className="spin" size={22}/>:isQuiz?<Brain size={23}/>:<Layers2 size={23}/>}</div><h3>{busy?'Making your study set...':`Your ${isQuiz?'practice quiz':'flashcards'} will live here`}</h3><p>{busy?'Finding useful ideas in your selected sources.':'Generate a set from your uploaded materials. Add an OpenAI API key for question-and-answer pairs grounded in your notes.'}</p>{!busy&&<button className="primary-button" onClick={onGenerate}><Sparkles size={15}/> Generate {isQuiz?'a quiz':'flashcards'}</button>}</div>}</div>}

export default App;
