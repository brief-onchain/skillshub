'use client';

import { useState, useEffect, useRef } from 'react';
import { ApiClient } from '@/lib/api';
import { Skill, PlaygroundResponse } from '@/lib/types';
import { useTranslation } from '@/lib/i18n';
import gsap from 'gsap';

export default function Playground() {
  const { t } = useTranslation();
  const [skills, setSkills] = useState<Skill[]>([]);
  const [selectedSkillId, setSelectedSkillId] = useState<string>('');
  const [inputJson, setInputJson] = useState<string>('{\n  "symbol": "BTCUSDT"\n}');
  const [apiBase, setApiBase] = useState<string>('');
  const [apiPath, setApiPath] = useState<string>('/skills/run');
  const [apiKey, setApiKey] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<PlaygroundResponse | null>(null);
  
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    ApiClient.getSkills().then(data => {
      setSkills(data);
      if (data.length > 0) {
        setSelectedSkillId(data[0].id);
        setInputJson(JSON.stringify(data[0].inputExample || { symbol: 'BTCUSDT' }, null, 2));
      }
    });
  }, []);

  useEffect(() => {
    if (!selectedSkillId) {
      return;
    }
    const current = skills.find((item) => item.id === selectedSkillId);
    if (current?.inputExample) {
      setInputJson(JSON.stringify(current.inputExample, null, 2));
    }
  }, [selectedSkillId, skills]);

  useEffect(() => {
    if (containerRef.current) {
      gsap.fromTo(containerRef.current, 
        { opacity: 0, y: 50 },
        { 
          opacity: 1, 
          y: 0, 
          duration: 0.8, 
          scrollTrigger: {
            trigger: containerRef.current,
            start: "top 75%",
          }
        }
      );
    }
  }, []);

  const handleRun = async () => {
    try {
      setLoading(true);
      setResult(null);
      const parsedInput = JSON.parse(inputJson);
      
      const response = await ApiClient.runPlayground({
        skillId: selectedSkillId,
        input: parsedInput,
        apiBase,
        apiPath,
        apiKey
      });
      
      setResult(response);
    } catch (e) {
      setResult({
        success: false,
        error: e instanceof Error ? e.message : 'Invalid JSON or Request Failed'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <section id="playground" className="py-24 bg-panel border-y border-gold/5" ref={containerRef}>
      <div className="container mx-auto px-6">
        <div className="mb-12 text-center">
          <h2 className="text-3xl md:text-4xl font-heading font-bold text-text-main mb-4">
            {t.playground.title}
          </h2>
          <p className="text-text-sub">
            {t.playground.subtitle}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-6xl mx-auto">
          {/* Input Panel */}
          <div className="bg-bg border border-white/10 p-6 rounded-lg">
            <div className="mb-6">
              <label className="block text-gold text-xs font-mono mb-2 uppercase tracking-wider">{t.playground.selectSkill}</label>
              <select 
                value={selectedSkillId}
                onChange={(e) => setSelectedSkillId(e.target.value)}
                className="w-full bg-panel border border-white/10 text-text-main p-3 rounded focus:border-gold focus:outline-none transition-colors"
              >
                {skills.map(s => (
                  <option key={s.id} value={s.id}>{s.name} ({s.category})</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-6">
              <div>
                <label className="block text-text-sub/60 text-xs font-mono mb-2">{t.playground.apiBase}</label>
                <input
                  type="text"
                  value={apiBase}
                  onChange={(e) => setApiBase(e.target.value)}
                  placeholder="https://api.example.com"
                  className="w-full bg-panel border border-white/10 text-text-main p-2 text-sm rounded focus:border-gold focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-text-sub/60 text-xs font-mono mb-2">{t.playground.apiPath}</label>
                <input 
                  type="text" 
                  value={apiPath}
                  onChange={(e) => setApiPath(e.target.value)}
                  placeholder="/skills/run"
                  className="w-full bg-panel border border-white/10 text-text-main p-2 text-sm rounded focus:border-gold focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-6">
              <div>
                <label className="block text-text-sub/60 text-xs font-mono mb-2">{t.playground.apiKey}</label>
                <input 
                  type="password" 
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="sk-..."
                  className="w-full bg-panel border border-white/10 text-text-main p-2 text-sm rounded focus:border-gold focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-text-sub/60 text-xs font-mono mb-2">{t.playground.install}</label>
                <input
                  type="text"
                  readOnly
                  value={skills.find((x) => x.id === selectedSkillId)?.installCommand || ''}
                  className="w-full bg-panel border border-white/10 text-text-main p-2 text-sm rounded opacity-70"
                />
              </div>
            </div>

            <div className="mb-6">
              <label className="block text-gold text-xs font-mono mb-2 uppercase tracking-wider">{t.playground.inputJson}</label>
              <textarea 
                value={inputJson}
                onChange={(e) => setInputJson(e.target.value)}
                className="w-full h-48 bg-panel border border-white/10 text-text-main font-mono text-sm p-4 rounded focus:border-gold focus:outline-none resize-none"
                spellCheck={false}
              />
            </div>

            <button 
              onClick={handleRun}
              disabled={loading}
              className={`w-full py-4 font-heading font-bold tracking-widest uppercase transition-all ${
                loading 
                ? 'bg-white/5 text-text-sub cursor-wait' 
                : 'bg-gold hover:bg-gold-dark text-bg'
              }`}
            >
              {loading ? t.playground.processing : t.playground.runSkill}
            </button>
          </div>

          {/* Output Panel */}
          <div className="bg-bg border border-white/10 p-6 rounded-lg flex flex-col h-full min-h-[400px]">
            <div className="flex justify-between items-center mb-4 pb-4 border-b border-white/5">
              <span className="text-gold text-xs font-mono uppercase tracking-wider">{t.playground.outputConsole}</span>
              {result && (
                <span className={`text-xs font-mono px-2 py-1 rounded ${result.success ? 'bg-green-900/30 text-green-400' : 'bg-red-900/30 text-red-400'}`}>
                  {result.success ? t.playground.success : t.playground.error}
                </span>
              )}
            </div>
            
            <div className="flex-1 font-mono text-sm overflow-auto custom-scrollbar">
              {result ? (
                <pre className={`whitespace-pre-wrap break-all ${result.success ? 'text-text-main' : 'text-red-400'}`}>
                  {JSON.stringify(result, null, 2)}
                </pre>
              ) : (
                <div className="h-full flex items-center justify-center text-text-sub/20">
                  <p>{t.playground.readyToExecute}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
