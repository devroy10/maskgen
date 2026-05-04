/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useCallback, useMemo } from 'react';
import { 
  Download, 
  Settings2, 
  Square, 
  Circle, 
  Pentagon, 
  Maximize2, 
  RotateCw, 
  FlipVertical,
  Minus,
  Plus,
  Monitor
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { MaskSettings, ShapeType, PRESETS } from './types';

export default function App() {
  const [settings, setSettings] = useState<MaskSettings>({
    width: 1920,
    height: 1080,
    type: 'squircle',
    cornerRadius: 120,
    squircleSmoothness: 3,
    polygonSides: 6,
    rotation: 0,
    padding: 40,
    borderThickness: 0,
    inverted: false,
    exportScale: 1,
  });

  const generatePathData = useCallback((s: MaskSettings) => {
    const { width, height, padding } = s;
    const a = Math.max(0, (width - padding * 2) / 2);
    const b = Math.max(0, (height - padding * 2) / 2);
    let path = '';

    if (s.type === 'rectangle') {
      const r = Math.min(s.cornerRadius, a, b);
      const x = -a;
      const y = -b;
      path = `M ${x+r} ${y} h ${a*2 - 2*r} a ${r} ${r} 0 0 1 ${r} ${r} v ${b*2 - 2*r} a ${r} ${r} 0 0 1 -${r} ${r} h -${a*2 - 2*r} a ${r} ${r} 0 0 1 -${r} -${r} v -${b*2 - 2*r} a ${r} ${r} 0 0 1 ${r} -${r} Z`;
    } else if (s.type === 'circle') {
      path = `M -${a} 0 a ${a} ${b} 0 1 0 ${2*a} 0 a ${a} ${b} 0 1 0 -${2*a} 0 Z`;
    } else if (s.type === 'squircle') {
      const n = s.squircleSmoothness;
      const perimeterApprox = 2 * Math.PI * Math.max(a, b);
      const steps = Math.min(8192, Math.max(360, Math.ceil(perimeterApprox * 1.5)));
      
      for (let i = 0; i <= steps; i++) {
        const t = (i * 2 * Math.PI) / steps;
        const cosT = Math.cos(t);
        const sinT = Math.sin(t);
        const ptX = a * Math.pow(Math.abs(cosT), 2 / n) * Math.sign(cosT);
        const ptY = b * Math.pow(Math.abs(sinT), 2 / n) * Math.sign(sinT);
        if (i === 0) path += `M ${ptX.toFixed(4)} ${ptY.toFixed(4)} `;
        else path += `L ${ptX.toFixed(4)} ${ptY.toFixed(4)} `;
      }
      path += 'Z';
    } else if (s.type === 'polygon') {
      const sides = s.polygonSides;
      for (let i = 0; i <= sides; i++) {
        const t = (i * 2 * Math.PI) / sides - Math.PI / 2;
        const ptX = a * Math.cos(t);
        const ptY = b * Math.sin(t);
        if (i === 0) path += `M ${ptX.toFixed(4)} ${ptY.toFixed(4)} `;
        else path += `L ${ptX.toFixed(4)} ${ptY.toFixed(4)} `;
      }
      path += 'Z';
    }
    return path;
  }, []);

  const pathData = useMemo(() => generatePathData(settings), [generatePathData, settings]);
  const [isExporting, setIsExporting] = useState(false);

  const handleDownload = () => {
    setIsExporting(true);
    const finalWidth = settings.width * settings.exportScale;
    const finalHeight = settings.height * settings.exportScale;
    
    // Create an exact string of SVG for perfect browser-native rasterization
    const svgString = `
      <svg width="${finalWidth}" height="${finalHeight}" viewBox="0 0 ${settings.width} ${settings.height}" xmlns="http://www.w3.org/2000/svg">
        ${settings.inverted ? `
          <defs>
            <mask id="shape-mask-export">
              <rect width="100%" height="100%" fill="white" />
              <g transform="translate(${settings.width/2}, ${settings.height/2}) rotate(${settings.rotation})">
                 <path d="${pathData}" fill="black" />
              </g>
            </mask>
          </defs>
          <rect width="100%" height="100%" fill="white" mask="url(#shape-mask-export)" />
        ` : `
          <g transform="translate(${settings.width/2}, ${settings.height/2}) rotate(${settings.rotation})">
            <path d="${pathData}" fill="white" />
          </g>
        `}
      </svg>
    `.trim();

    const url = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgString)}`;
    const img = new Image();
    
    img.onload = () => {
      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = finalWidth;
      tempCanvas.height = finalHeight;
      const ctx = tempCanvas.getContext('2d');
      if (ctx) {
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, finalWidth, finalHeight);
        
        const link = document.createElement('a');
        link.download = `obs-mask-${settings.type}-${finalWidth}x${finalHeight}.png`;
        link.href = tempCanvas.toDataURL('image/png');
        link.click();
      }
      setIsExporting(false);
    };
    img.onerror = () => {
      console.error('Failed to load SVG for export');
      setIsExporting(false);
    };
    img.src = url;
  };

  const updateSetting = (key: keyof MaskSettings, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans selection:bg-blue-500/30">
      <header className="border-b border-zinc-800 bg-zinc-900/50 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <Monitor className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-xl font-semibold tracking-tight">MaskGen <span className="text-zinc-500 font-normal">for OBS</span></h1>
          </div>
          <button 
            onClick={handleDownload}
            className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-full text-sm font-medium transition-all flex items-center gap-2 shadow-lg shadow-blue-900/20 active:scale-95"
          >
            <Download className="w-4 h-4" />
            Download PNG
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-6 grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Sidebar Controls */}
        <div className="lg:col-span-4 space-y-6">
          <section className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-xl">
            <div className="flex items-center gap-2 mb-6">
              <Settings2 className="w-5 h-5 text-blue-400" />
              <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-400">Geometry Settings</h2>
            </div>

            <div className="space-y-6">
              {/* Shape Type Toggle */}
              <div>
                <label className="text-xs font-semibold text-zinc-500 block mb-3 uppercase">Shape Type</label>
                <div className="grid grid-cols-4 gap-2">
                  {(['rectangle', 'circle', 'squircle', 'polygon'] as ShapeType[]).map((type) => (
                    <button
                      key={type}
                      onClick={() => updateSetting('type', type)}
                      className={`h-12 rounded-xl flex items-center justify-center transition-all ${
                        settings.type === type 
                          ? 'bg-blue-600 text-white' 
                          : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-zinc-200'
                      }`}
                      title={type.charAt(0).toUpperCase() + type.slice(1)}
                    >
                      {type === 'rectangle' && <Square className="w-5 h-5" />}
                      {type === 'circle' && <Circle className="w-5 h-5" />}
                      {type === 'squircle' && <Maximize2 className="w-5 h-5" />}
                      {type === 'polygon' && <Pentagon className="w-5 h-5" />}
                    </button>
                  ))}
                </div>
              </div>

              {/* Resolution & Presets */}
              <div className="space-y-4 pt-4 border-t border-zinc-800">
                <label className="text-xs font-semibold text-zinc-500 block uppercase">Dimensions & Presets</label>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <span className="text-[10px] text-zinc-500 block">Width</span>
                    <input 
                      type="number" 
                      value={settings.width}
                      onChange={(e) => updateSetting('width', parseInt(e.target.value) || 0)}
                      className="w-full bg-zinc-800 border-none rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <span className="text-[10px] text-zinc-500 block">Height</span>
                    <input 
                      type="number" 
                      value={settings.height}
                      onChange={(e) => updateSetting('height', parseInt(e.target.value) || 0)}
                      className="w-full bg-zinc-800 border-none rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {PRESETS.map((preset) => (
                    <button
                      key={preset.name}
                      onClick={() => {
                        updateSetting('width', preset.width);
                        updateSetting('height', preset.height);
                      }}
                      className="text-[10px] px-2 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-400 border border-zinc-700 transition-colors"
                    >
                      {preset.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Core Parameters */}
              <div className="space-y-6 pt-4 border-t border-zinc-800">
                {settings.type === 'rectangle' && (
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <label className="text-xs font-semibold text-zinc-300">Corner Radius</label>
                      <span className="text-xs font-mono text-zinc-500">{settings.cornerRadius}px</span>
                    </div>
                    <input 
                      type="range" min="0" max="1000" step="1"
                      value={settings.cornerRadius}
                      onChange={(e) => updateSetting('cornerRadius', parseInt(e.target.value))}
                      className="w-full accent-blue-500 h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer"
                    />
                  </div>
                )}

                {settings.type === 'squircle' && (
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <label className="text-xs font-semibold text-zinc-300">Smoothness (n)</label>
                      <span className="text-xs font-mono text-zinc-500">{settings.squircleSmoothness.toFixed(1)}</span>
                    </div>
                    <input 
                      type="range" min="0.5" max="10" step="0.1"
                      value={settings.squircleSmoothness}
                      onChange={(e) => updateSetting('squircleSmoothness', parseFloat(e.target.value))}
                      className="w-full accent-blue-500 h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer"
                    />
                    <p className="text-[10px] text-zinc-500 leading-tight">Higher values create a more boxy look, lower values create a diamond look. 2.0 is an ellipse, 4.0-5.0 is standard squircle.</p>
                  </div>
                )}

                {settings.type === 'polygon' && (
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <label className="text-xs font-semibold text-zinc-300">Sides</label>
                      <span className="text-xs font-mono text-zinc-500">{settings.polygonSides}</span>
                    </div>
                    <input 
                      type="range" min="3" max="24" step="1"
                      value={settings.polygonSides}
                      onChange={(e) => updateSetting('polygonSides', parseInt(e.target.value))}
                      className="w-full accent-blue-500 h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer"
                    />
                  </div>
                )}

                <div className="space-y-2">
                  <div className="flex justify-between">
                    <label className="text-xs font-semibold text-zinc-300">Rotation</label>
                    <span className="text-xs font-mono text-zinc-500">{settings.rotation}°</span>
                  </div>
                  <input 
                    type="range" min="-180" max="180" step="1"
                    value={settings.rotation}
                    onChange={(e) => updateSetting('rotation', parseInt(e.target.value))}
                    className="w-full accent-blue-500 h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer"
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between">
                    <label className="text-xs font-semibold text-zinc-300">Padding</label>
                    <span className="text-xs font-mono text-zinc-500">{settings.padding}px</span>
                  </div>
                  <input 
                    type="range" min="0" max="500" step="1"
                    value={settings.padding}
                    onChange={(e) => updateSetting('padding', parseInt(e.target.value))}
                    className="w-full accent-blue-500 h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer"
                  />
                </div>
              </div>

              {/* Advanced Controls */}
              <div className="space-y-4 pt-4 border-t border-zinc-800">
                <label className="text-xs font-semibold text-zinc-500 block uppercase">Advanced</label>
                <div className="flex items-center justify-between p-3 bg-zinc-800/50 border border-zinc-800 rounded-xl">
                  <span className="text-sm">Invert Mask</span>
                  <button 
                    onClick={() => updateSetting('inverted', !settings.inverted)}
                    className={`w-10 h-5 rounded-full transition-all relative ${settings.inverted ? 'bg-blue-600' : 'bg-zinc-700'}`}
                  >
                    <div className={`absolute top-1 w-3 h-3 rounded-full bg-white transition-all ${settings.inverted ? 'left-6' : 'left-1'}`} />
                  </button>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <label className="text-xs font-semibold text-zinc-300">Export Upscale</label>
                    <span className="text-xs font-mono text-zinc-500">{settings.exportScale}x</span>
                  </div>
                  <div className="grid grid-cols-4 gap-2">
                    {[1, 2, 4, 8].map(s => (
                      <button
                        key={s}
                        onClick={() => updateSetting('exportScale', s)}
                        className={`text-xs py-1 rounded-md border font-mono ${
                          settings.exportScale === s 
                          ? 'border-blue-500 bg-blue-500/10 text-blue-400' 
                          : 'border-zinc-800 bg-zinc-800 text-zinc-500'
                        }`}
                      >
                        {s}x
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>

        {/* Live Preview Area */}
        <div className="lg:col-span-8 space-y-6">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl h-[600px] overflow-hidden flex flex-col relative shadow-2xl backdrop-blur-sm">
            <div className="absolute top-6 left-6 z-10 flex items-center gap-2">
              <div className="px-3 py-1 bg-zinc-950/80 backdrop-blur rounded-full border border-zinc-700/50 flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Live Preview</span>
              </div>
              <div className="px-3 py-1 bg-zinc-950/80 backdrop-blur rounded-full border border-zinc-700/50">
                <span className="text-[10px] font-mono text-zinc-400">{settings.width} × {settings.height}</span>
              </div>
            </div>
            
            <div className="flex-1 flex items-center justify-center p-12 bg-[#020202] relative group">
              {/* Checkerboard Pattern */}
              <div 
                className="absolute inset-0 opacity-[0.03] pointer-events-none"
                style={{
                  backgroundImage: `conic-gradient(#fff 90deg, #000 90deg 180deg, #fff 180deg 270deg, #000 270deg)`,
                  backgroundSize: '32px 32px'
                }}
              />
              
              <div 
                className="relative overflow-hidden rounded-sm border border-white/5 flex items-center justify-center p-4 w-full h-[500px]"
              >
                <div 
                  className="relative shadow-2xl transition-transform active:scale-95 flex items-center justify-center"
                  style={{
                    maxHeight: '100%',
                    maxWidth: '100%',
                    aspectRatio: `${settings.width} / ${settings.height}`
                  }}
                >
                  <svg 
                    viewBox={`0 0 ${settings.width} ${settings.height}`} 
                    className="w-full h-full block cursor-crosshair drop-shadow-2xl"
                  >
                    {settings.inverted ? (
                      <>
                        <defs>
                          <mask id="shape-mask-preview">
                            <rect width="100%" height="100%" fill="white" />
                            <g transform={`translate(${settings.width/2}, ${settings.height/2}) rotate(${settings.rotation})`}>
                              <path d={pathData} fill="black" />
                            </g>
                          </mask>
                        </defs>
                        <rect width="100%" height="100%" fill="white" mask="url(#shape-mask-preview)" />
                      </>
                    ) : (
                      <g transform={`translate(${settings.width/2}, ${settings.height/2}) rotate(${settings.rotation})`}>
                        <path d={pathData} fill="white" />
                      </g>
                    )}
                  </svg>
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-zinc-800 bg-zinc-900 flex items-center justify-between">
              <div className="flex items-center gap-6">
                <div className="flex flex-col">
                  <span className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold">In-Editor Hint</span>
                  <p className="text-xs text-zinc-400">Use this image as an <span className="text-zinc-200">Image Mask/Blend</span> filter in OBS.</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button 
                   onClick={() => setSettings(prev => ({...prev, rotation: 0}))}
                   className="p-2 text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800 rounded-lg transition-all"
                   title="Reset Rotation"
                >
                  <RotateCw className="w-4 h-4" />
                </button>
                 <button 
                   onClick={() => setSettings(prev => ({...prev, inverted: !prev.inverted}))}
                   className="p-2 text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800 rounded-lg transition-all"
                   title="Flip Color"
                >
                  <FlipVertical className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Quick Help / Info Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-5 bg-blue-500/5 border border-blue-500/10 rounded-2xl">
              <h3 className="text-sm font-semibold text-blue-400 mb-2">How to use in OBS</h3>
              <ol className="text-xs text-zinc-400 space-y-2 list-decimal list-inside leading-relaxed">
                <li>Download your mask as a PNG.</li>
                <li>In OBS, right-click your Media Source or Camera.</li>
                <li>Go to <span className="text-zinc-200 font-medium">Filters</span>, then click <span className="text-zinc-200 font-medium">+</span>.</li>
                <li>Choose <span className="text-zinc-200 font-medium">Image Mask/Blend</span>.</li>
                <li>Select the downloaded PNG as the <span className="text-zinc-200 font-medium">Path</span>.</li>
              </ol>
            </div>
            <div className="p-5 bg-zinc-900 border border-zinc-800 rounded-2xl">
              <h3 className="text-sm font-semibold text-zinc-300 mb-2">Pro Tips</h3>
              <ul className="text-xs text-zinc-400 space-y-2 list-disc list-inside leading-relaxed">
                <li>Use <span className="text-zinc-200 font-medium">Export Scale</span> for ultra-crisp edges on 4K streams.</li>
                <li>Squircles (smoothness 4-5) look better than rounded rectangles.</li>
                <li>Ensure the resolution matches your OBS source (e.g. 1920x1080).</li>
              </ul>
            </div>
          </div>
        </div>
      </main>

      <footer className="mt-12 border-t border-zinc-900 p-8 text-center">
        <p className="text-xs text-zinc-600 font-medium tracking-wide">
          © 2026 MASKGEN STUDIO • PRECISION GEOMETRY TOOL
        </p>
      </footer>
    </div>
  );
}
