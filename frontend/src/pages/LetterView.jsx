import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { ChevronLeft, Download, FileText, Wand2 } from 'lucide-react';

const LetterView = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [letter, setLetter] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
  const getAuthHeaders = () => ({ headers: { Authorization: `Bearer ${sessionStorage.getItem('token')}` } });

  useEffect(() => {
    const fetchLetter = async () => {
      try {
        const res = await axios.get(`${BASE_URL}/api/letters/${id}`, getAuthHeaders());
        setLetter(res.data);
      } catch (err) {
        console.error('Falha ao carregar carta:', err);
        setError('Não foi possível carregar a carta selecionada.');
      } finally {
        setLoading(false);
      }
    };
    fetchLetter();
  }, [id]);

  const handlePrint = () => window.print();

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
              <FileText size={16} /> Visualizador de Cartas
            </div>
          </div>

          <div style={{ position: 'absolute', left: '50%', transform: 'translateX(-50%)', fontWeight: '900', fontSize: '28px', color: '#000' }}>
            IA
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
             {letter && (
               <button onClick={handlePrint} style={{ background: '#6366f1', color: '#fff', border: 'none', padding: '8px 20px', borderRadius: '8px', fontSize: '13px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
                 <Download size={16} /> Baixar PDF
               </button>
             )}
          </div>
        </div>
      </div>

      <div style={{ flex: 1, display: 'flex', justifyContent: 'center', padding: '60px 20px' }}>
        
        {loading ? (
          <div style={{ color: '#64748b', display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: '100px' }}>
            <Wand2 size={48} style={{ opacity: 0.5, marginBottom: '20px' }} />
            A carregar o documento...
          </div>
        ) : error ? (
          <div style={{ color: '#ef4444', background: '#fee2e2', padding: '20px', borderRadius: '12px', height: 'fit-content' }}>
            {error}
          </div>
        ) : letter ? (
          <div className="printable-document" style={{ background: '#fff', width: '100%', maxWidth: '850px', minHeight: '1000px', padding: '80px 100px', borderRadius: '8px', boxShadow: '0 10px 30px rgba(0,0,0,0.05)' }}>
              
              <div style={{ lineHeight: '1.7', fontSize: '16px', fontFamily: '"Playfair Display", serif', color: '#1e293b' }}>
                 <div style={{ marginBottom: '60px', borderBottom: '3px solid #000', paddingBottom: '30px' }}>
                    <h1 style={{ margin: 0, fontSize: '38px', fontWeight: '900' }}>{letter.content.nome}</h1>
                 </div>
                 
                 <p style={{ textAlign: 'right', marginBottom: '32px' }}>{new Date(letter.created_at).toLocaleDateString('pt-PT')}</p>
                 
                 <div style={{ marginBottom: '40px' }}>
                    <p style={{ fontWeight: 'bold', margin:0 }}>Departamento de Seleção</p>
                    <p style={{ color: '#64748b', margin:0 }}>Empresa Destinatária</p>
                 </div>
                 
                 <p style={{ fontWeight: '900', padding: '12px 16px', background: '#f8fafc', borderLeft: '4px solid #000', marginBottom: '32px' }}>
                    ASSUNTO: {letter.content.assunto}
                 </p>
                 
                 <p style={{ fontWeight: 'bold', marginBottom: '24px' }}>{letter.content.saudacao}</p>
                 
                 <div style={{ textAlign: 'justify', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <p>{letter.content.paragrafo1}</p>
                    <p>{letter.content.paragrafo2}</p>
                    <p>{letter.content.paragrafo3}</p>
                 </div>
                 
                 <div style={{ marginTop: '60px' }}>
                    <p style={{ marginBottom: '40px' }}>{letter.content.encerramento}</p>
                    <p style={{ fontWeight: '900', fontSize: '20px' }}>{letter.content.nome}</p>
                 </div>
              </div>

          </div>
        ) : null}

      </div>

      <style>{`
        @media print {
          @page { size: auto; margin: 0; }
          body { margin: 0; background: #fff !important; }
          .no-print, .no-print * { display: none !important; opacity: 0 !important; visibility: hidden !important; }
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
          }
        }
      `}</style>
    </div>
  );
};

export default LetterView;
