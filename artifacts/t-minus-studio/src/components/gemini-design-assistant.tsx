import { useRef, useState } from 'react';
import { Sparkles, Upload, X } from 'lucide-react';
import { useGenerateArtwork, useGenerateDesignSuggestions, type ArtworkResult, type DesignBrief, type DesignSuggestion, type DesignSuggestions } from '@workspace/api-client-react';
import { wallpaperImageUrl } from '@/lib/wallpaper-image';
import './gemini-design-assistant.css';

type StylePatch = Omit<DesignSuggestion, 'name' | 'rationale'>;
type ArtworkPatch = { image: string; overlayOpacity: number; imageBrightness: number; imageBlur: number; imagePosition: string; textColor: string };
type Reference = { name: string; preview: string; data: string };

async function prepareReference(file: File): Promise<Reference> {
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) throw new Error('Choose a PNG, JPEG, or WebP image.');
  if (file.size > 10 * 1024 * 1024) throw new Error('Choose a reference image under 10 MB.');
  const url = URL.createObjectURL(file);
  try {
    const image = new Image();
    image.src = url;
    await image.decode();
    if (!image.naturalWidth || !image.naturalHeight) throw new Error('This image could not be read.');
    const scale = Math.min(1, 1024 / Math.max(image.naturalWidth, image.naturalHeight));
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
    canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Your browser could not prepare this image.');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
    const preview = canvas.toDataURL('image/jpeg', 0.82);
    const data = preview.split(',')[1]!;
    if (data.length > 2_000_000) throw new Error('This image is too detailed. Try a smaller reference.');
    return { name: file.name, preview, data };
  } finally {
    URL.revokeObjectURL(url);
  }
}

export default function GeminiDesignAssistant({ goal, format, dimensions, milestones, hasBackgroundImage, onApply }: {
  goal: string;
  format: DesignBrief['format'];
  dimensions: [number, number];
  milestones: DesignBrief['milestones'];
  hasBackgroundImage: boolean;
  onApply: (patch: StylePatch | ArtworkPatch) => void;
}) {
  const [prompt, setPrompt] = useState('');
  const [reference, setReference] = useState<Reference>();
  const [result, setResult] = useState<DesignSuggestions>();
  const [error, setError] = useState('');
  const [status, setStatus] = useState('');
  const [preparing, setPreparing] = useState(false);
  const [applied, setApplied] = useState<number>();
  const input = useRef<HTMLInputElement>(null);
  const generation = useGenerateDesignSuggestions();
  const artwork = useGenerateArtwork();
  const [artworkResult, setArtworkResult] = useState<ArtworkResult>();
  const [artworkLoaded, setArtworkLoaded] = useState(false);
  const [artworkApplied, setArtworkApplied] = useState(false);
  const [artworkError, setArtworkError] = useState('');
  const busy = preparing || generation.isPending || artwork.isPending;
  const clearResults = () => {
    setResult(undefined); setError(''); setStatus(''); setApplied(undefined);
    setArtworkResult(undefined); setArtworkLoaded(false); setArtworkApplied(false); setArtworkError('');
  };

  async function chooseReference(file?: File) {
    if (!file) return;
    clearResults();
    setReference(undefined);
    setPreparing(true);
    try { setReference(await prepareReference(file)); }
    catch (e) { setError(e instanceof Error ? e.message : 'This image could not be read. Try another file.'); }
    finally { setPreparing(false); }
  }
  async function generate() {
    clearResults();
    if (!prompt.trim() && !reference) { setError('Describe a look or add a reference image first.'); return; }
    try {
      const suggestions = await generation.mutateAsync({ data: {
        goal, prompt: prompt.trim(), format, milestones: milestones.slice(0, 8),
        ...(reference ? { referenceImage: { mimeType: 'image/jpeg' as const, data: reference.data } } : {}),
      } });
      setResult(suggestions);
      setStatus('Three styles are ready. Nothing changes until you apply one.');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Gemini is unavailable right now. Try again; your design is unchanged.');
    }
  }

  async function generateOriginalArtwork() {
    setArtworkError(''); setArtworkResult(undefined); setArtworkLoaded(false); setArtworkApplied(false);
    if (!prompt.trim() && !reference) { setArtworkError('Describe an image or attach a reference above first.'); return; }
    try {
      const value = await artwork.mutateAsync({ data: {
        goal, prompt: prompt.trim(), format, milestones: milestones.slice(0, 8),
        width: dimensions[0], height: dimensions[1],
        ...(reference ? { referenceImage: { mimeType: 'image/jpeg' as const, data: reference.data } } : {}),
      } });
      setArtworkResult(value);
    } catch (e) {
      setArtworkError(e instanceof Error ? e.message : 'Artwork generation is unavailable. Your current photo and design are unchanged.');
    }
  }

  return <section className="ai-style-panel" aria-labelledby="ai-style-title" data-testid="gemini-design-assistant">
    <div className="ai-style-heading"><div><span className="eyebrow">Gemini / Creative direction</span><h2 id="ai-style-title">Describe it. See three directions.</h2></div><Sparkles size={22} aria-hidden="true" /></div>
    <p className="ai-style-explanation">Gemini suggests editable colors, typography, and layout for your goal. Add a reference for its palette and mood—not as your wallpaper background. “Suggest three styles” changes no images. The separate optional artwork action below generates an original background.</p>
    <form onSubmit={e => { e.preventDefault(); void generate(); }}>
      <div className="ai-style-inputs">
        <div className="field"><label htmlFor="gemini-style-prompt">Style, colors, or mood</label><textarea id="gemini-style-prompt" data-testid="input-design-brief" rows={3} maxLength={1200} value={prompt} disabled={busy} placeholder="For example: bold black and white, oversized type, clean space for my clock." onChange={e => { setPrompt(e.target.value); clearResults(); }} /></div>
        <div className="ai-style-reference">
          <input ref={input} type="file" data-testid="input-design-reference" accept="image/png,image/jpeg,image/webp" hidden disabled={busy} onChange={e => { void chooseReference(e.target.files?.[0]); e.currentTarget.value = ''; }} />
          {reference ? <div className="ai-reference-preview"><img src={reference.preview} alt="Your style reference" /><div><strong>{reference.name}</strong><span>For inspiration only</span></div><button type="button" className="icon-btn" aria-label="Remove style reference" data-testid="button-remove-design-reference" disabled={busy} onClick={() => { setReference(undefined); clearResults(); }}><X size={15} /></button></div>
            : <button type="button" className="btn secondary" data-testid="button-add-design-reference" disabled={busy} onClick={() => input.current?.click()}><Upload size={15} /> {preparing ? 'Preparing image…' : 'Add a reference image'}</button>}
          <small>PNG, JPEG, WebP · up to 10 MB. Resized before sending.</small>
        </div>
      </div>
      <div className="ai-style-submit"><button className="btn" type="submit" data-testid="button-generate-designs" disabled={busy || (!prompt.trim() && !reference)}>{generation.isPending ? <><span className="loader" /> Gemini is exploring styles…</> : <><Sparkles size={15} /> Suggest three styles</>}</button><p>Generating sends this brief, your goal, milestone labels, and any reference image to Gemini. The reference is not saved in your project.</p></div>
    </form>
    {error && <p className="ai-style-error" role="alert" data-testid="design-suggestions-error">{error}</p>}
    <p className="ai-style-status" role="status" aria-live="polite" data-testid="design-suggestions-status">{status}</p>
    {result && <div className="ai-style-results">
      <p className="ai-style-inspiration" data-testid="design-inspiration">{result.inspiration}</p>
      {hasBackgroundImage && <p className="section-note">Your existing background photo will stay in place. Remove it in the manual controls if you prefer the suggested colors alone.</p>}
      <div className="ai-style-options">{result.options.map((option, index) => <article className="ai-style-option" key={`${index}-${option.name}`} data-testid={`design-option-${index}`}>
        <div className="ai-style-sample" aria-label={`${option.name} style preview`} style={{ background: option.backgroundStyle === 'gradient' ? `linear-gradient(145deg,${option.background},${option.accentColor})` : option.background, color: option.textColor, fontFamily: `"${option.font}", sans-serif`, textAlign: option.layout }}>
          <small>T—MINUS COUNTDOWN</small><strong>{goal}</strong><span>{option.title}</span><div className="ai-style-sample-roadmap">{milestones.slice(0, 2).map((milestone, i) => <div key={i}>□ {milestone.tMinus} · {milestone.title}</div>)}</div>
        </div>
        <div className="ai-style-option-copy"><h3>{option.name}</h3><p>{option.rationale}</p><div className="ai-style-swatches" aria-label="Suggested palette">{[option.background, option.accentColor, option.textColor].map((color, i) => <span key={i} style={{ background: color }} title={color} />)}<small>{option.font} / {option.layout}</small></div><button type="button" className="btn secondary" data-testid={`button-apply-design-${index}`} aria-pressed={applied === index} onClick={() => {
          const { name, rationale: _rationale, ...patch } = option;
          onApply(patch);
          setApplied(index);
          setStatus(`Applied ${name}. Your preview is updated; your goal, milestones, format, and photos are unchanged.`);
        }}>{applied === index ? 'Applied to your preview' : 'Apply this style'}</button></div>
      </article>)}</div>
      <p className="section-note">You can still edit every setting below. Download exports a static PNG snapshot, not a live lock-screen timer.</p>
    </div>}
    <div className="ai-artwork-section" aria-labelledby="original-artwork-title">
      <div><span className="eyebrow">Optional / Original image generation</span><h3 id="original-artwork-title">Go beyond a palette.</h3><p>Use the brief and optional reference above to generate original background artwork. Gemini leaves out text; your goal, live preview countdown, and milestone labels stay editable and are drawn separately.</p></div>
      <div className="ai-artwork-action"><button type="button" className="btn secondary" data-testid="button-generate-artwork" disabled={busy || (!prompt.trim() && !reference)} onClick={() => void generateOriginalArtwork()}>{artwork.isPending ? <><span className="loader" /> Generating original artwork…</> : <><Sparkles size={15} /> Generate original artwork</>}</button><small>{dimensions[0]} × {dimensions[1]} px · Gemini image generation uses AI credits. May take up to two minutes.</small></div>
      <p className="ai-artwork-privacy">The brief, goal, and optional reference are sent to Gemini. Only the generated background is saved in App Storage—not your reference. This app has no sign-in: generated artwork has an unlisted link that anyone with the link can view. Avoid confidential references.</p>
      <p role="status" aria-live="polite" className="ai-style-status">{artwork.isPending ? 'Creating and saving a new background. Your current photo stays unchanged.' : artworkApplied ? 'Original artwork applied. Goal, deadline, milestones, and format are unchanged.' : artworkResult ? 'Artwork is saved and ready to preview. It is not applied yet.' : ''}</p>
      {artworkError && <p role="alert" className="ai-style-error" data-testid="artwork-error">{artworkError}</p>}
      {artworkResult && <div className="ai-artwork-result" data-testid="generated-artwork-result">
        <img src={wallpaperImageUrl(artworkResult.objectPath)} alt="Original Gemini-generated background, without countdown text" data-testid="generated-artwork-image" onLoad={() => setArtworkLoaded(true)} onError={() => { setArtworkLoaded(false); setArtworkError('The saved artwork could not be loaded. Retry generation later; your current background is unchanged.'); }} />
        <div><h4>Your original background</h4><p>{artworkResult.width} × {artworkResult.height} px · Stored in App Storage</p><p>Applying replaces your current background photo and adds a dark overlay with white text for readability. Your goal, milestones, format, and other settings remain intact.</p><button type="button" className="btn" data-testid="button-apply-artwork" disabled={!artworkLoaded || artworkApplied || busy} onClick={() => {
          onApply({ image: artworkResult.objectPath, overlayOpacity: 65, imageBrightness: 100, imageBlur: 0, imagePosition: 'center', textColor: '#ffffff' });
          setArtworkApplied(true);
        }}>{artworkApplied ? 'Artwork applied' : hasBackgroundImage ? 'Apply artwork · replace current photo' : 'Apply artwork as background'}</button><p className="section-note">Then use “Download lock screen” to export the artwork and countdown together as a static PNG.</p></div>
      </div>}
    </div>
  </section>;
}
