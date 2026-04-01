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
      <div style={{ background: '#fff', height: '70px', display: 'flex', alignItems: 'center', borderBottom: '1px solid #e2e8f0', position: 'sticky', top: 0, zIndex: 100 }}>
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
            IA
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

      <div style={{ display: 'flex', flex: 1, justifyContent: 'center', gap: '40px', padding: '40px', maxWidth: '1400px', margin: '0 auto', width: '100%' }}>
        
        {/* PARAMS */}
        <div style={{ width: '400px', flexShrink: 0 }}>
          <h1 style={{ fontSize: '28px', fontWeight: '800', marginBottom: '24px' }}>Parâmetros de Geração</h1>

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

          {error && <div style={{ color: '#ef4444', fontSize: '12px', marginBottom: '16px' }}>{error}</div>}

          <button onClick={handleGenerate} disabled={loading} style={{ width: '100%', padding: '16px', background: '#6366f1', color: '#fff', border: 'none', borderRadius: '12px', fontWeight: 'bold', fontSize: '15px', cursor: 'pointer' }}>
            {loading ? 'Redigindo...' : 'Gerar Carta com IA'}
          </button>
        </div>

        {/* PAPER */}
        <div style={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
          <div className="printable-document" style={{ background: '#fff', width: '100%', minHeight: '1000px', padding: '80px 100px', borderRadius: '8px', boxShadow: '0 10px 30px rgba(0,0,0,0.05)', position: 'relative' }}>
            {!letterContent ? (
              <div style={{ height: '800px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#94a3b8' }}>
                <Wand2 size={48} style={{ marginBottom: '24px', opacity: 0.2 }} />
                <h2 style={{ fontSize: '24px', color: '#1e293b', fontWeight: '800' }}>Documento em Rascunho</h2>
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
            {!letterContent && <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(255,255,255,0.7)', backdropFilter: 'blur(3px)', zIndex: 0 }}></div>}
          </div>
        </div>
      </div>

      <style>{`
        @media print {
          body * { visibility: hidden; }
          .printable-document, .printable-document * { visibility: visible; }
          .printable-document { position: absolute; left: 0; top: 0; width: 100%; box-shadow: none !important; border:none !important; padding: 0 !important; }
        }
      `}</style>
    </div>
  );
};

export default CoverLetter;
