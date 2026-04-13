import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, Briefcase, Wand2, Printer, ChevronLeft, Building2, UserCircle2, Sparkles, Download, Save, CheckCircle2 } from 'lucide-react';
import { api, BASE_URL, getAuthHeaders } from '../utils/api';

const CoverLetter = () => {
  const navigate = useNavigate();
  const [cvs, setCvs] = useState([]);
  const [selectedCvId, setSelectedCvId] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [letterContent, setLetterContent] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [saveStatus, setSaveStatus] = useState(null);



  useEffect(() => {
    const fetchCvs = async () => {
      try {
        const res = await api.get('/api/cvs');
        setCvs(res.data);
      } catch (err) {
        console.error('Failed to load CVs:', err);
      }
    };
    fetchCvs();
  }, []);

  const handleGenerate = async () => {
    if (!jobDescription) {
      setError('Descreva a vaga para gerar a carta.');
      return;
    }
    setLoading(true);
    setError(null);
    setSaveStatus(null);
    try {
      const selectedCv = cvs.find(c => String(c.id) === String(selectedCvId));
      const cvContext = selectedCv ? JSON.stringify(selectedCv.data) : "Profissional";

      const res = await api.post('/api/ai/generate-cover-letter', { 
        dados: cvContext, 
        vaga: jobDescription,
        empresa: companyName
      });
      
      setLetterContent(res.data);
    } catch (err) {
      console.error(err);
      setError('IA falhou ao redigir. Verifique a conexão com o servidor.');
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => window.print();

  const handleSave = async () => {
    if (!letterContent) return;
    try {
      await api.post('/api/letters', {
        title: `Carta para ${companyName || 'Candidatura'}`,
        content: letterContent
      });
      setSaveStatus('success');
      setTimeout(() => setSaveStatus(null), 3000);
    } catch (err) {
      console.error(err);
      setSaveStatus('error');
    }
  };

  const cardStyle = { background: 'var(--bg-surface)', padding: '20px', borderRadius: '12px', border: '1px solid var(--border-subtle)', marginBottom: '20px' };
  const inputStyle = { width: '100%', background: 'var(--bg-base)', border: '1px solid var(--border-strong)', color: 'var(--text-primary)', padding: '12px', borderRadius: '10px', outline: 'none', fontSize: '14px' };
  const labelStyle = { display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px', color: 'var(--text-tertiary)', marginBottom: '8px', fontWeight: 'bold', textTransform: 'uppercase' };

  return (
    <div style={{ background: 'var(--bg-base)', minHeight: '100vh', display: 'flex', flexDirection: 'column', color: 'var(--text-primary)' }}>
      
      {/* HEADER */}
      <div className="no-print" style={{ background: 'var(--bg-surface)', minHeight: '60px', display: 'flex', alignItems: 'center', borderBottom: '1px solid var(--border-subtle)', position: 'sticky', top: 0, zIndex: 100, padding: '8px 0' }}>
        <div className="flex flex-wrap items-center justify-between w-full max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-10 gap-2">
          
          <div className="flex flex-wrap gap-2">
            <button onClick={() => navigate('/')} style={{ background: 'var(--bg-base)', border: '1px solid var(--border-subtle)', color: 'var(--text-secondary)', padding: '8px 16px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', cursor: 'pointer' }}>
              <ChevronLeft size={16} /> Voltar
            </button>
            <div className="hidden sm:flex" style={{ background: 'var(--bg-base)', color: 'var(--text-secondary)', padding: '8px 16px', borderRadius: '8px', border: '1px solid var(--border-subtle)', alignItems: 'center', gap: '8px', fontSize: '13px' }}>
              <FileText size={16} /> Gerador de Cartas
            </div>
          </div>

          <div className="flex gap-2">
             {letterContent && (
               <>
                 <button onClick={handleSave} className="btn-secondary" style={{ padding: '8px 16px', fontSize: '13px', background: saveStatus === 'success' ? '#10b981' : undefined, color: saveStatus === 'success' ? '#fff' : undefined }}>
                   {saveStatus === 'success' ? '✓ Guardado' : 'Salvar'}
                 </button>
                 <button onClick={handlePrint} className="btn-primary" style={{ padding: '8px 16px', fontSize: '13px' }}>
                   ⬇ PDF
                 </button>
               </>
             )}
          </div>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row flex-1 justify-center gap-6 lg:gap-10 p-4 sm:p-6 lg:p-10 max-w-[1400px] mx-auto w-full">
        
        {/* PARAMS */}
        <div className="w-full lg:w-[400px] flex-shrink-0">
          <h1 className="text-2xl md:text-[28px] font-extrabold mb-6">Parâmetros de Geração</h1>

          <div style={cardStyle}>
            <label style={labelStyle}><UserCircle2 size={16} /> Perfil Profissional</label>
            <select value={selectedCvId} onChange={e => setSelectedCvId(e.target.value)} style={inputStyle}>
              <option value="">-- Selecione o CV Base --</option>
              {cvs.map(cv => <option key={cv.id} value={cv.id}>{cv.title || 'Curriculum'}</option>)}
            </select>
          </div>

          <div style={cardStyle}>
            <label style={labelStyle}><Building2 size={16} /> Empresa de Destino</label>
            <input type="text" value={companyName} onChange={e => setCompanyName(e.target.value)} style={inputStyle} placeholder="ex: Movitel" />
          </div>

          <div style={cardStyle}>
            <label style={labelStyle}><Briefcase size={16} /> Requisitos da Vaga</label>
            <textarea value={jobDescription} onChange={e => setJobDescription(e.target.value)} style={{ ...inputStyle, height: '140px', resize: 'none' }} placeholder="Descreva a vaga..." />
          </div>

          {error && <div className="text-red-500 text-sm mb-4">{error}</div>}

          <button onClick={handleGenerate} disabled={loading} className="w-full p-4 bg-[var(--accent-primary)] hover:bg-indigo-600 text-white border-none rounded-xl font-bold text-[15px] cursor-pointer transition-colors disabled:opacity-70 disabled:cursor-not-allowed">
            {loading ? 'Redigindo...' : 'Gerar Carta com IA'}
          </button>
        </div>

        {/* PAPER */}
        <div className="flex-1 flex justify-center w-full overflow-hidden pb-8 mt-4 lg:mt-0">
          <div className="preview-scale-wrapper" style={{ width: '800px', height: '1123px', flexShrink: 0 }}>
            <div className="printable-document w-full h-full p-[80px_100px] rounded-lg shadow-[0_10px_30px_rgba(0,0,0,0.05)] relative" style={{ background: 'var(--bg-surface)' }}>
            {!letterContent ? (
              <div className="h-[500px] lg:h-[800px] flex flex-col items-center justify-center" style={{ color: 'var(--text-tertiary)' }}>
                <Wand2 size={48} className="mb-6 opacity-20" />
                <h2 className="text-xl md:text-2xl font-extrabold text-center px-4" style={{ color: 'var(--text-secondary)' }}>Documento em Rascunho</h2>
              </div>
            ) : (
              <div style={{ lineHeight: '1.7', fontSize: '16px', fontFamily: '"Playfair Display", serif', color: 'var(--text-primary)' }}>
                 <div style={{ marginBottom: '60px', borderBottom: '3px solid var(--text-primary)', paddingBottom: '30px' }}>
                    <h1 style={{ margin: 0, fontSize: '38px', fontWeight: '900' }}>{letterContent.nome}</h1>
                 </div>
                 <p style={{ textAlign: 'right', marginBottom: '32px' }}>{new Date().toLocaleDateString('pt-PT')}</p>
                 <div style={{ marginBottom: '40px' }}>
                    <p style={{ fontWeight: 'bold', margin:0 }}>Departamento de Seleção</p>
                    <p style={{ color: 'var(--text-secondary)', margin:0 }}>{companyName}</p>
                 </div>
                 <p style={{ fontWeight: '900', padding: '12px 16px', background: 'var(--bg-base)', borderLeft: '4px solid var(--text-primary)', marginBottom: '32px' }}>
                    ASSUNTO: {letterContent.assunto}
                 </p>
                 <p style={{ fontWeight: 'bold', marginBottom: '24px' }}>{letterContent.saudacao}</p>
                 <div style={{ textAlign: 'justify', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <p>{letterContent.paragrafo1}</p>
                    <p>{letterContent.paragrafo2}</p>
                    <p>{letterContent.paragrafo3}</p>
                 </div>
                 <div style={{ marginTop: '60px' }}>
                    <p style={{ marginBottom: '40px' }}>{letterContent.encerramento}</p>
                    <p style={{ fontWeight: '900', fontSize: '20px' }}>{letterContent.nome}</p>
                 </div>
              </div>
            )}
            {!letterContent && <div className="absolute top-0 left-0 w-full h-full backdrop-blur-[3px] z-0 rounded-lg" style={{ background: 'color-mix(in srgb, var(--bg-surface) 70%, transparent)' }}></div>}
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @media print {
          @page { size: auto; margin: 0; }
          body { margin: 0; background: #fff !important; }
          .no-print, .no-print * { display: none !important; opacity: 0 !important; visibility: hidden !important; }
          .cover-letter-studio { background: #fff !important; }
          .printable-document, .printable-document * { 
            visibility: visible !important; 
            color: #000 !important; 
            opacity: 1 !important; 
            display: block;
          }
          .printable-document { 
            position: fixed !important; 
            left: 0 !important; 
            top: 0 !important; 
            width: 210mm !important; 
            height: auto !important;
            padding: 2.5cm !important; 
            box-shadow: none !important; 
            border: none !important; 
            background: #fff !important;
            transform: none !important;
          }
        }
      `}</style>
    </div>
  );
};

export default CoverLetter;
