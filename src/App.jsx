import React, { useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import './styles.css';

const CHANNEL = 'ai-jamie-overlay';

const defaultVisuals = [
  { type: 'image', title: 'AI Jamie Ready', url: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=1200&auto=format&fit=crop' },
  { type: 'image', title: 'News Visual', url: 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?q=80&w=1200&auto=format&fit=crop' },
  { type: 'image', title: 'Football Visual', url: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?q=80&w=1200&auto=format&fit=crop' }
];

function getVisuals() {
  try { return JSON.parse(localStorage.getItem('visuals')) || defaultVisuals; }
  catch { return defaultVisuals; }
}

function useOverlayState() {
  const [visuals, setVisuals] = useState(getVisuals);
  const [index, setIndexState] = useState(Number(localStorage.getItem('index') || 0));
  const [visible, setVisibleState] = useState(localStorage.getItem('visible') === 'true');
  const channel = useMemo(() => new BroadcastChannel(CHANNEL), []);

  useEffect(() => {
    channel.onmessage = (event) => {
      const data = event.data || {};
      if (data.visuals) setVisuals(data.visuals);
      if (typeof data.index === 'number') setIndexState(data.index);
      if (typeof data.visible === 'boolean') setVisibleState(data.visible);
    };
    return () => channel.close();
  }, [channel]);

  const setAllVisuals = (next) => {
    localStorage.setItem('visuals', JSON.stringify(next));
    setVisuals(next);
    channel.postMessage({ visuals: next });
  };

  const setIndex = (nextIndex) => {
    const safe = ((nextIndex % visuals.length) + visuals.length) % visuals.length;
    localStorage.setItem('index', String(safe));
    setIndexState(safe);
    channel.postMessage({ index: safe });
  };

  const setVisible = (next) => {
    localStorage.setItem('visible', String(next));
    setVisibleState(next);
    channel.postMessage({ visible: next });
  };

  return { visuals, setAllVisuals, index, setIndex, visible, setVisible };
}

function Overlay() {
  const { visuals, index, visible } = useOverlayState();
  const visual = visuals[index] || visuals[0];
  return (
    <main className="overlay-canvas">
      <section className={visible ? 'visual-card show' : 'visual-card hide'}>
        {visual?.type === 'video' ? <video src={visual.url} autoPlay muted loop playsInline /> : <img src={visual?.url} alt={visual?.title || 'visual'} />}
        <div className="visual-label">{visual?.title || 'AI Jamie'}</div>
      </section>
    </main>
  );
}

function Control() {
  const { visuals, setAllVisuals, index, setIndex, visible, setVisible } = useOverlayState();
  const [url, setUrl] = useState('');
  const [title, setTitle] = useState('');
  const visual = visuals[index] || visuals[0];

  const addVisual = () => {
    if (!url.trim()) return;
    const lower = url.toLowerCase();
    const type = lower.endsWith('.mp4') || lower.endsWith('.webm') || lower.endsWith('.mov') ? 'video' : 'image';
    setAllVisuals([...visuals, { type, title: title.trim() || 'New visual', url: url.trim() }]);
    setTitle('');
    setUrl('');
  };

  const resetVisuals = () => {
    setAllVisuals(defaultVisuals);
    setIndex(0);
    setVisible(false);
  };

  return (
    <main className="simple-page">
      <section className="top-card">
        <div>
          <p className="small-title">AI Jamie</p>
          <h1>Simple control panel</h1>
          <p className="muted">Use these big buttons while OBS captures the overlay.</p>
        </div>
        <a className="open-overlay" href="/overlay" target="_blank" rel="noreferrer">Open OBS Overlay</a>
      </section>

      <section className="now-card">
        <p className="muted">Now showing</p>
        <h2>{visual?.title}</h2>
        <p className={visible ? 'green' : 'red'}>{visible ? 'VISIBLE' : 'HIDDEN'}</p>
      </section>

      <section className="big-controls">
        <button className="main show-btn" onClick={() => setVisible(true)}>SHOW</button>
        <button className="main hide-btn" onClick={() => setVisible(false)}>HIDE</button>
        <button className="main" onClick={() => setIndex(index - 1)}>BACK</button>
        <button className="main" onClick={() => setIndex(index + 1)}>NEXT</button>
      </section>

      <section className="add-card">
        <h2>Add one visual</h2>
        <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Name it, example: Mbappe yacht" />
        <input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="Paste image/video URL" />
        <button className="add-button" onClick={addVisual}>ADD VISUAL</button>
      </section>

      <section className="list-card">
        <h2>Visuals</h2>
        {visuals.map((item, i) => (
          <button key={`${item.url}-${i}`} className={i === index ? 'visual-row selected' : 'visual-row'} onClick={() => setIndex(i)}>
            {i + 1}. {item.title}
          </button>
        ))}
        <button className="reset-button" onClick={resetVisuals}>Reset demo visuals</button>
      </section>
    </main>
  );
}

function App() { return window.location.pathname === '/overlay' ? <Overlay /> : <Control />; }

createRoot(document.getElementById('root')).render(<App />);
