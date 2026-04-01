import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { FileText, Mail, Bot, Search, Clock, Plus, Trash2 } from 'lucide-react';

const Dashboard = () => {
  const navigate = useNavigate();
  const [docs, setDocs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const user = JSON.parse(sessionStorage.getItem('user') || '{}');
  const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
  const getAuthHeaders = () => ({ headers: { Authorization: `Bearer ${sessionStorage.getItem('token')}` } });

  const fetchData = async () => {
    try {
      const [cvsRes, lettersRes] = await Promise.all([
        axios.get(`${BASE_URL}/api/cvs`, getAuthHeaders()).catch(() => ({ data: [] })),
        axios.get(`${BASE_URL}/api/letters`, getAuthHeaders()).catch(() => ({ data: [] }))
      ]);
      
      const combined = [
        ...cvsRes.data.map(cv => ({ ...cv, type: 'cv' })),
        ...lettersRes.data.map(l => ({ ...l, type: 'letter' }))
      ].sort((a,b) => new Date(b.created_at) - new Date(a.created_at));
      
      setDocs(combined);
    } catch (err) {
      console.warn('Erro ao carregar documentos:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleDelete = async (e, id, type) => {
    if (e) e.stopPropagation();
    if (!confirm('Eliminar este documento?')) return;
    
    try {
      const endpoint = type === 'cv' ? `/api/cvs/${id}` : `/api/letters/${id}`; 
      await axios.delete(`${BASE_URL}${endpoint}`, getAuthHeaders());
      setDocs(prev => prev.filter(d => !(d.id === id && d.type === type)));
    } catch (err) {
      console.error('Erro ao apagar:', err);
    }
  };

  const filteredDocs = docs.filter(doc => 
    doc.title?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '40px' }}>
      
      {/* 1. WELCOME BANNER */}
      <div className="banner-content" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-surface)', padding: '32px', borderRadius: '24px', border: '1px solid var(--border-subtle)', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', right: '-20px', top: '-20px', width: '150px', height: '150px', background: 'var(--accent-glow)', filter: 'blur(50px)', opacity: 0.5 }}></div>
        <div style={{ zIndex: 1 }}>
          <h1 className="outfit gradient-text" style={{ fontSize: '32px', margin: 0 }}>Olá, {user.name || 'Candidato'} 👋</h1>
          <p style={{ margin: '8px 0 0', fontWeight: '500' }}>O teu estúdio profissional está pronto para novas conquistas.</p>
        </div>
        <button className="btn-primary" onClick={() => navigate('/cv/new')} style={{ padding: '14px 24px', zIndex: 1 }}>
          <Plus size={20} /> Criar Novo Documento
        </button>
      </div>

      <div className="bento-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
        
        {/* 2. RECENT DOCUMENTS */}
        <div className="premium-card bento-span-2" style={{ padding: '32px', height: 'fit-content' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <h3 className="outfit" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Clock size={20} className="gradient-text" /> Documentos Recentes
            </h3>
            <div style={{ position: 'relative' }}>
              <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)' }} />
              <input type="text" placeholder="Procurar..." value={search} onChange={e => setSearch(e.target.value)} style={{ background: 'var(--bg-base)', border: '1px solid var(--border-subtle)', borderRadius: '10px', padding: '8px 12px 8px 36px', fontSize: '13px', outline: 'none', color: 'var(--text-primary)' }} />
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {loading ? (
              <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-tertiary)' }}>
                A carregar os teus documentos...
              </div>
            ) : filteredDocs.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px' }}>
                <div style={{ fontSize: '48px', marginBottom: '12px' }}>📄</div>
                <p style={{ color: 'var(--text-tertiary)', fontSize: '14px' }}>
                   {search ? 'Nada encontrado para essa busca.' : 'Ainda não tens documentos salvos.'}
                </p>
              </div>
            ) : (
              filteredDocs.map(doc => (
                <div key={`${doc.type}-${doc.id}`} 
                  className="nav-link" 
                  onClick={() => navigate(doc.type === 'cv' ? `/cv/${doc.id}` : `/letter/${doc.id}`)} 
                  style={{ 
                    background: 'var(--bg-base)', 
                    padding: '16px 20px', 
                    borderRadius: '16px', 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    cursor: 'pointer', 
                    border: '1px solid var(--border-subtle)', 
                    transition: 'all 0.2s',
                    marginBottom: '8px'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div style={{ width: '40px', height: '40px', background: 'var(--bg-surface)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: doc.type === 'cv' ? 'var(--accent-primary)' : '#0ea5e9', border: '1px solid var(--border-subtle)' }}>
                      {doc.type === 'cv' ? <FileText size={20} /> : <Mail size={20} />}
                    </div>
                    <div>
                      <h4 className="outfit" style={{ fontSize: '15px', margin: 0, color: 'var(--text-primary)' }}>{doc.title || 'Sem Título'}</h4>
                      <p style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>{doc.type === 'cv' ? 'Currículo' : 'Carta de Apresentação'} • {new Date(doc.created_at).toLocaleDateString('pt-PT')}</p>
                    </div>
                  </div>
                  <button 
                    onClick={(e) => handleDelete(e, doc.id, doc.type)} 
                    style={{ background: 'rgba(239, 68, 68, 0.1)', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '10px', borderRadius: '10px' }}
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* 3. QUICK TOOLS */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div className="premium-card" onClick={() => navigate('/cover-letter')} style={{ padding: '24px', cursor: 'pointer' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(56, 189, 248, 0.1)', color: '#38bdf8', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
              <Mail size={24} />
            </div>
            <h3 className="outfit" style={{ fontSize: '18px', marginBottom: '8px' }}>Carta de Apresentação</h3>
            <p style={{ fontSize: '13px', lineHeight: '1.5' }}>Gera cartas personalizadas com IA para cada candidatura.</p>
          </div>

          <div className="premium-card" style={{ padding: '24px', opacity: 0.8 }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(244, 114, 182, 0.1)', color: '#f472b6', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
              <Bot size={24} />
            </div>
            <h3 className="outfit" style={{ fontSize: '18px', marginBottom: '8px' }}>Entrevista Guiada</h3>
            <p style={{ fontSize: '13px', lineHeight: '1.5' }}>Deixa que a IA recolha os teus dados via chat. <span style={{ color: 'var(--accent-primary)', fontWeight: 'bold' }}>(Brevemente)</span></p>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Dashboard;
