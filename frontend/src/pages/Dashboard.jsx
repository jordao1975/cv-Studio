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
    <div className="flex flex-col gap-6 md:gap-8 lg:gap-10">
      
      {/* 1. WELCOME BANNER */}
      <div className="banner-content flex flex-col md:flex-row justify-between items-start md:items-center bg-[var(--bg-surface)] p-6 md:p-8 rounded-[24px] border border-[var(--border-subtle)] relative overflow-hidden gap-4 md:gap-0">
        <div style={{ position: 'absolute', right: '-20px', top: '-20px', width: '150px', height: '150px', background: 'var(--accent-glow)', filter: 'blur(50px)', opacity: 0.5 }}></div>
        <div style={{ zIndex: 1 }}>
          <h1 className="outfit gradient-text" style={{ fontSize: '32px', margin: 0 }}>Olá, {user.name || 'Candidato'} 👋</h1>
          <p style={{ margin: '8px 0 0', fontWeight: '500' }}>O teu estúdio profissional está pronto para novas conquistas.</p>
        </div>
        <button className="btn-primary w-full md:w-auto" onClick={() => navigate('/cv/new')} style={{ padding: '14px 24px', zIndex: 1 }}>
          <Plus size={20} /> Criar Novo Documento
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        
        {/* 2. RECENT DOCUMENTS */}
        <div className="premium-card md:col-span-2 p-5 md:p-8 h-fit">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4 sm:gap-0">
            <h3 className="outfit flex items-center gap-2 m-0 text-lg sm:text-xl">
              <Clock size={20} className="gradient-text" /> Documentos Recentes
            </h3>
            <div className="relative w-full sm:w-auto">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)]" />
              <input type="text" placeholder="Procurar..." value={search} onChange={e => setSearch(e.target.value)} className="w-full sm:w-auto bg-[var(--bg-base)] border border-[var(--border-subtle)] rounded-lg py-2 pl-9 pr-3 text-sm outline-none text-[var(--text-primary)]" />
            </div>
          </div>

          <div className="flex flex-col gap-3">
            {loading ? (
              <div className="text-center p-10 text-[var(--text-tertiary)]">
                A carregar os teus documentos...
              </div>
            ) : filteredDocs.length === 0 ? (
              <div className="text-center p-10">
                <div className="text-5xl mb-3">📄</div>
                <p className="text-[var(--text-tertiary)] text-sm">
                   {search ? 'Nada encontrado para essa busca.' : 'Ainda não tens documentos salvos.'}
                </p>
              </div>
            ) : (
              filteredDocs.map(doc => (
                <div key={`${doc.type}-${doc.id}`} 
                  className="nav-link flex justify-between items-center bg-[var(--bg-base)] p-4 rounded-2xl cursor-pointer border border-[var(--border-subtle)] transition-all duration-200 mb-2 hover:bg-[rgba(99,102,241,0.05)]"
                  onClick={() => navigate(doc.type === 'cv' ? `/cv/${doc.id}` : `/letter/${doc.id}`)} 
                >
                  <div className="flex items-center gap-4">
                    <div className="flex-shrink-0 w-10 h-10 bg-[var(--bg-surface)] rounded-lg flex items-center justify-center border border-[var(--border-subtle)]" style={{ color: doc.type === 'cv' ? 'var(--accent-primary)' : '#0ea5e9' }}>
                      {doc.type === 'cv' ? <FileText size={20} /> : <Mail size={20} />}
                    </div>
                    <div className="overflow-hidden">
                      <h4 className="outfit text-[15px] m-0 text-[var(--text-primary)] truncate">{doc.title || 'Sem Título'}</h4>
                      <p className="text-xs text-[var(--text-tertiary)] mt-1">{doc.type === 'cv' ? 'Currículo' : 'Carta de Apresentação'} • {new Date(doc.created_at).toLocaleDateString('pt-PT')}</p>
                    </div>
                  </div>
                  <button 
                    onClick={(e) => handleDelete(e, doc.id, doc.type)} 
                    className="flex-shrink-0 bg-red-500/10 border-none text-red-500 cursor-pointer p-2.5 rounded-lg hover:bg-red-500/20 transition-colors"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* 3. QUICK TOOLS */}
        <div className="flex flex-col gap-5">
          <div className="premium-card p-6 cursor-pointer" onClick={() => navigate('/cover-letter')}>
            <div className="w-12 h-12 rounded-xl bg-[rgba(56,189,248,0.1)] text-[#38bdf8] flex items-center justify-center mb-4">
              <Mail size={24} />
            </div>
            <h3 className="outfit text-lg mb-2">Carta de Apresentação</h3>
            <p className="text-sm leading-relaxed text-[var(--text-secondary)]">Gera cartas personalizadas com IA para cada candidatura.</p>
          </div>

          <div className="premium-card p-6 opacity-80">
            <div className="w-12 h-12 rounded-xl bg-[rgba(244,114,182,0.1)] text-[#f472b6] flex items-center justify-center mb-4">
              <Bot size={24} />
            </div>
            <h3 className="outfit text-lg mb-2">Entrevista Guiada</h3>
            <p className="text-sm leading-relaxed text-[var(--text-secondary)]">Deixa que a IA recolha os teus dados via chat. <span className="text-[var(--accent-primary)] font-bold">(Brevemente)</span></p>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Dashboard;
