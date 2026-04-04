import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, Briefcase, Wand2, Printer, ChevronLeft, Building2, UserCircle2, Sparkles, Download, Save, CheckCircle2 } from 'lucide-react';
import axios from 'axios';

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

  const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
  const getAuthHeaders = () => ({ headers: { Authorization: `Bearer ${sessionStorage.getItem('token')}` } });

  useEffect(() => {
    const fetchCvs = async () => {
      try {
        const res = await axios.get(`${BASE_URL}/api/cvs`, getAuthHeaders());
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

      const res = await axios.post(`${BASE_URL}/api/ai/generate-cover-letter`, { 
        dados: cvContext, 
        vaga: jobDescription,
        empresa: companyName
      }, getAuthHeaders());
      
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
      await axios.post(`${BASE_URL}/api/letters`, {
        title: `Carta para ${companyName || 'Candidatura'}`,
        content: letterContent
      }, getAuthHeaders());
      setSaveStatus('success');
      setTimeout(() => setSaveStatus(null), 3000);
    } catch (err) {
      console.error(err);
      setSaveStatus('error');
    }
  };

  const cardStyle = { background: '#ffffff', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0', marginBottom: '20px' };
  const inputStyle = { width: '100%', background: '#fff', border: '1px solid #e2e8f0', color: '#1e293b', padding: '12px', borderRadius: '10px', outline: 'none', fontSize: '14px' };
  const labelStyle = { display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px', color: '#64748b', marginBottom: '8px', fontWeight: 'bold', textTransform: 'uppercase' };

  return (
    <div style={{ background: '#f1f5f9', minHeight: '100vh', display: 'flex', flexDirection: 'column', color: '#1e293b' }}>
      
      {/* HEADER */}
      <div className="no-print" style={{ background: '#fff', height: '70px', display: 'flex', alignItems: 'center', borderBottom: '1px solid #e2e8f0', position: 'sticky', top: 0, zIndex: 100 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', maxWidth: '1400px', margin: '0 auto', padding: '0 40px' }}>
          
          <div style={{ display: 'flex', gap: '10px' }}>
            <button onClick={() => navigate('/')} style={{ background: '#f8fafc', border: '1px solid #e2e8f0', color: '#64748b', padding: '8px 16px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', cursor: 'pointer' }}>
              <ChevronLeft size={16} /> Voltar ao Painel
            </button>
            <div style={{ background: '#f8fafc', color: '#64748b', padding: '8px 16px', borderRadius: '8px', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px' }}>
              <FileText size={16} /> Gerador de Cartas
            </div>
          </div>

          {/* LOGO */}
          <div style={{ position: 'absolute', left: '50%', transform: 'translateX(-50%)', fontWeight: '900', fontSize: '28px', color: '#000' }}>
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
             {letterContent && (
               <>
                 <button onClick={handleSave} style={{ background: saveStatus === 'success' ? '#10b981' : '#fff', color: saveStatus === 'success' ? '#fff' : '#1e293b', border: '1px solid #e2e8f0', padding: '8px 20px', borderRadius: '8px', fontSize: '13px', cursor: 'pointer', fontWeight: 'bold' }}>
                   {saveStatus === 'success' ? 'Guardado' : 'Salvar'}
                 </button>
                 <button onClick={handlePrint} style={{ background: '#6366f1', color: '#fff', border: 'none', padding: '8px 20px', borderRadius: '8px', fontSize: '13px', fontWeight: 'bold', cursor: 'pointer' }}>
                   Baixar PDF
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
        <div className="flex-1 flex justify-center w-full overflow-x-auto pb-8">
          <div className="printable-document bg-white w-[800px] max-w-full min-h-[1000px] p-6 sm:p-10 lg:p-[80px_100px] rounded-lg shadow-[0_10px_30px_rgba(0,0,0,0.05)] relative flex-shrink-0">
            {!letterContent ? (
              <div className="h-[500px] lg:h-[800px] flex flex-col items-center justify-center text-slate-400">
                <Wand2 size={48} className="mb-6 opacity-20" />
                <h2 className="text-xl md:text-2xl text-slate-800 font-extrabold text-center px-4">Documento em Rascunho</h2>
              </div>
            ) : (
              <div style={{ lineHeight: '1.7', fontSize: '16px', fontFamily: '"Playfair Display", serif', color: '#1e293b' }}>
                 <div style={{ marginBottom: '60px', borderBottom: '3px solid #000', paddingBottom: '30px' }}>
                    <h1 style={{ margin: 0, fontSize: '38px', fontWeight: '900' }}>{letterContent.nome}</h1>
                 </div>
                 <p style={{ textAlign: 'right', marginBottom: '32px' }}>{new Date().toLocaleDateString('pt-PT')}</p>
                 <div style={{ marginBottom: '40px' }}>
                    <p style={{ fontWeight: 'bold', margin:0 }}>Departamento de Seleção</p>
                    <p style={{ color: '#64748b', margin:0 }}>{companyName}</p>
                 </div>
                 <p style={{ fontWeight: '900', padding: '12px 16px', background: '#f8fafc', borderLeft: '4px solid #000', marginBottom: '32px' }}>
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
            {!letterContent && <div className="absolute top-0 left-0 w-full h-full bg-white/70 backdrop-blur-[3px] z-0 rounded-lg"></div>}
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
