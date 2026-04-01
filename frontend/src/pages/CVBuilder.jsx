import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { renderCV } from '../components/CVRenderer';
import '../components/CVRenderer.css';
import html2pdf from 'html2pdf.js';
import axios from 'axios';

const CVBuilder = () => {
  const navigate = useNavigate();
  const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

  const getToken = () => sessionStorage.getItem('token');
  const getAuthHeaders = () => ({ headers: { Authorization: `Bearer ${getToken()}` } });

  const { id } = useParams();
  const [cvId, setCvId] = useState(null);

  // Initialize data - will be overwritten by useEffect if needed
  const [data, setData] = useState({
      name: '', title: '', email: '', phone: '', location: '', linkedin: '',
      nacionalidade: '', dataNascimento: '', estadoCivil: '', bi: '', nuit: '', photo: null,
      summary: '',
      experiences: [], educations: [], courses: [], languages: [], skills: []
    });

  const [template, setTemplate] = useState(1);
  const [activeTab, setActiveTab] = useState('pessoais');
  const [lang, setLang] = useState('pt');
  const [showAiModal, setShowAiModal] = useState(false);
  const [aiText, setAiText] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [useAi, setUseAi] = useState(true);
  const [autoSummary, setAutoSummary] = useState(true);
  const [skillInput, setSkillInput] = useState('');
  const [theme, setTheme] = useState('dark');
  const [showPreview, setShowPreview] = useState(false);
  const [reviewData, setReviewData] = useState(null);
  const [reviewLoading, setReviewLoading] = useState(false);
  const [alertMsg, setAlertMsg] = useState(null);
  const [cvTitle, setCvTitle] = useState('Nome do Documento');
  const [saveStatus, setSaveStatus] = useState('saved'); // 'saved', 'saving', 'error'
  const pdfRef = useRef(null);
  const saveTimerRef = useRef(null);

  // Effect to handle navigation to a specific CV or starting a new one
  useEffect(() => {
    const fetchOrClear = async () => {
      if (id === 'new' || !id) {
        // RESET FOR NEW CV
        setData({
          name: '', title: '', email: '', phone: '', location: '', linkedin: '',
          nacionalidade: '', dataNascimento: '', estadoCivil: '', bi: '', nuit: '', photo: null,
          summary: '',
          experiences: [], educations: [], courses: [], languages: [], skills: []
        });
        setCvId(null);
        setCvTitle('Nome do Documento');
        localStorage.removeItem('cv_data');
        localStorage.removeItem('cv_current_id');
        localStorage.removeItem('cv_current_title');
      } else {
        // FETCH EXISTING CV
        try {
          const res = await axios.get(`${BASE_URL}/api/cvs`, getAuthHeaders());
          const found = res.data.find(c => String(c.id) === String(id));
          if (found) {
            setData(found.data);
            setCvId(found.id);
            setCvTitle(found.title);
            setTemplate(found.template || 1);
            setLang(found.lang || 'pt');
          } else {
            setAlertMsg("Documento não encontrado ou sem permissão.");
            navigate('/');
          }
        } catch (err) {
          console.error("Erro ao carregar CV:", err);
        }
      }
    };
    fetchOrClear();
  }, [id]);

  const handleManualSave = async () => {
    setSaveStatus('saving');
    try {
      const cvToSave = { ...data };
      delete cvToSave.photo;
      const titleToSave = cvTitle || (data.name ? `CV - ${data.name}` : 'CV Sem Título');

      if (cvId) {
        await axios.put(`${BASE_URL}/api/cvs/${cvId}`, { title: titleToSave, data: cvToSave }, getAuthHeaders());
      } else {
        const res = await axios.post(`${BASE_URL}/api/cvs`, { title: titleToSave, data: cvToSave }, getAuthHeaders());
        setCvId(res.data.id);
        navigate(`/cv/${res.data.id}`, { replace: true });
      }
      setSaveStatus('saved');
    } catch (err) {
      console.error('Save failed:', err);
      setSaveStatus('error');
    }
  };

  // Save to localStorage (Local Persistence)
  useEffect(() => {
    if (data.name || data.email || data.summary || data.experiences.length > 0) {
      localStorage.setItem('cv_data', JSON.stringify(data));
      localStorage.setItem('cv_template', template);
      localStorage.setItem('cv_lang', lang);
      localStorage.setItem('cv_theme', theme);
      localStorage.setItem('cv_current_title', cvTitle);
      if (cvId) localStorage.setItem('cv_current_id', cvId);
    }
  }, [data, template, lang, theme, cvTitle, cvId]);

  // Auto-save to database (debounced)
  useEffect(() => {
    const token = getToken();
    if (!token || token === 'local-jwt-token') return;
    if (!data.name && !data.summary && data.experiences.length === 0) return; // Don't autosave empty

    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(async () => {
      try {
        const cvToSave = { ...data };
        delete cvToSave.photo;
        const titleToSave = cvTitle === 'Nome do Documento' && data.name ? `CV - ${data.name}` : cvTitle;

        setSaveStatus('saving');
        if (cvId) {
          await axios.put(`${BASE_URL}/api/cvs/${cvId}`, { title: titleToSave, data: cvToSave }, getAuthHeaders());
        } else {
          const res = await axios.post(`${BASE_URL}/api/cvs`, { title: titleToSave, data: cvToSave }, getAuthHeaders());
          setCvId(res.data.id);
          navigate(`/cv/${res.data.id}`, { replace: true });
        }
        setSaveStatus('saved');
      } catch (err) {
        setSaveStatus('error');
        console.warn('Auto-save falhou:', err.message);
      }
    }, 3000);

    return () => { if (saveTimerRef.current) clearTimeout(saveTimerRef.current); };
  }, [data]);

  // Using new universal variables
  const inputStyle = { width: '100%', padding: '12px 16px', marginBottom: '14px', background: 'var(--bg-base)', border: '1px solid var(--border-strong)', borderRadius: '10px', color: 'var(--text-primary)', fontSize: '14px', outline: 'none', transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)' };
  const labelStyle = { display: 'block', fontSize: '11px', color: 'var(--text-tertiary)', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.8px', fontWeight: '700' };
  const cardStyle = { background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', padding: '24px', borderRadius: '16px', marginBottom: '16px', position: 'relative', boxShadow: 'var(--shadow-sm)' };
  const removeBtnStyle = { position: 'absolute', top: '12px', right: '12px', background: 'rgba(239, 68, 68, 0.1)', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '16px', width: '28px', height: '28px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s' };
  const addBtnStyle = { width: '100%', padding: '14px', border: '2px dashed var(--border-strong)', background: 'transparent', color: 'var(--text-secondary)', borderRadius: '12px', cursor: 'pointer', fontWeight: 'bold', transition: 'all 0.2s' };

  const handlePdfDownload = () => {
    setAlertMsg('Dica: Na janela de impressão, escolha "Guardar como PDF" ou "Save as PDF" como destino.\nIsso garante um documento com texto selecionável e máxima qualidade.');
    window.print();
  };

  const handlePhotoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = ev => setData({ ...data, photo: ev.target.result });
      reader.readAsDataURL(file);
    }
  };

  const handleAiReview = async () => {
    setShowPreview(true);
    if (!reviewData) {
      setReviewLoading(true);
      try {
        const token = getToken();
        if (!token || token === 'local-jwt-token') {
          setAlertMsg('Sessão inválida. Faça logout e login novamente para usar a auditoria de IA.');
          setReviewLoading(false);
          return;
        }
        const cvToReview = { ...data };
        delete cvToReview.photo;
        const res = await axios.post(`${BASE_URL}/api/ai/review`, { cvGerado: cvToReview }, getAuthHeaders());
        setReviewData(res.data);
      } catch (err) {
        console.error(err);
        if (err.response && err.response.status === 401) {
          setAlertMsg('Sessão expirada ou inválida (401). Faça logout (Sair) e entre novamente com email e senha para corrigir.');
        } else {
          setAlertMsg('Falha ao obter conselhos de IA. Verifique se o backend está ligado.');
        }
      } finally {
        setReviewLoading(false);
      }
    }
  };

  const handleLocalImport = () => {
    setAiLoading(true);
    try {
      const text = aiText;
      const extracted = {
        name: '', title: '', email: '', phone: '', summary: '',
        experiences: [], educations: [], courses: [], languages: [], skills: []
      };

      // 1. Email e Telefone (Regex)
      const emailMatch = text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
      if (emailMatch) extracted.email = emailMatch[0];

      const phoneMatch = text.match(/(?:\+?\d{1,3}[-.\s]?)?\(?\d{2,4}\)?[-.\s]?\d{3,4}[-.\s]?\d{3,4}/);
      if (phoneMatch) extracted.phone = phoneMatch[0];

      // 2. Nome e Cargo: Presumir as primeiras linhas
      const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
      if (lines.length > 0) extracted.name = lines[0].substring(0, 50);
      if (lines.length > 1 && !lines[1].includes('@') && lines[1].length < 60) {
        extracted.title = lines[1];
      }

      // 3. Captura Grosseira de Blocos
      const lower = text.toLowerCase();
      const getBlock = (startWords, endWords) => {
        let startIdx = -1;
        for (const w of startWords) {
          startIdx = lower.indexOf(w);
          if (startIdx !== -1) break;
        }
        if (startIdx === -1) return '';
        let endIdx = text.length;
        for (const w of endWords) {
          const idx = lower.indexOf(w, startIdx + 15);
          if (idx !== -1 && idx < endIdx) endIdx = idx;
        }
        return text.substring(startIdx, endIdx).split('\n').slice(1).join('\n').trim();
      };

      const expText = getBlock(['experiência', 'experiencia', 'histórico profissional', 'experience'], ['formação', 'educação', 'cursos', 'competências', 'idiomas']);
      if (expText) {
        extracted.experiences.push({ id: Date.now(), role: 'Rever Cargo', company: '', period: '', desc: expText.substring(0, 600) });
      }

      const eduText = getBlock(['formação', 'formacao', 'educação', 'habilitações'], ['experiência', 'cursos', 'competências', 'idiomas']);
      if (eduText) {
        extracted.educations.push({ id: Date.now(), degree: 'Rever Formação', institution: eduText.substring(0, 80), period: '' });
      }

      const skillsText = getBlock(['competências', 'competencias', 'skills', 'qualificações'], ['idiomas', 'cursos', 'experiência']);
      if (skillsText) {
        extracted.skills = skillsText.split(/,|\n/).map(s => s.trim()).filter(s => s.length > 2 && s.length < 35).slice(0, 8);
      }

      extracted.summary = "Dados extraídos localmente com sucesso. Por favor, reveja e edite cada campo para garantir a máxima precisão.";

      // Mesclar e manter o que já exista
      setData(prev => ({ ...prev, ...extracted }));
      setShowAiModal(false);
      setAlertMsg('Importação Offline concluída! \nComo este modo não usa Inteligência Artificial, a organização final depende de revisão manual.');
    } catch (err) {
      setAlertMsg("Erro ao processar o texto localmente.");
    } finally {
      setAiLoading(false);
    }
  };

  const transformAiData = (rawJson, currentState) => {
    const addIds = (arr) => (Array.isArray(arr) ? arr.map((item, i) => ({ ...item, id: Date.now() + i })) : []);
    
    // ARCHITECT PATTERN: Null-safe merging with priority on extracted data
    // Fallback to currentState to ensure NO DATA LOSS on fields the AI missed
    return {
      name: rawJson.name || currentState.name,
      title: rawJson.title || currentState.title,
      email: rawJson.email || currentState.email,
      phone: rawJson.phone || currentState.phone,
      location: rawJson.location || currentState.location,
      linkedin: rawJson.linkedin || currentState.linkedin,
      summary: rawJson.summary || currentState.summary,
      experiences: Array.isArray(rawJson.experiences) && rawJson.experiences.length ? addIds(rawJson.experiences) : currentState.experiences,
      educations: Array.isArray(rawJson.educations) && rawJson.educations.length ? addIds(rawJson.educations) : currentState.educations,
      courses: Array.isArray(rawJson.courses) && rawJson.courses.length ? addIds(rawJson.courses) : currentState.courses,
      languages: Array.isArray(rawJson.languages) && rawJson.languages.length ? addIds(rawJson.languages) : currentState.languages,
      skills: Array.isArray(rawJson.skills) && rawJson.skills.length ? rawJson.skills : currentState.skills,
    };
  };

  const handleAiImport = async () => {
    if (!aiText || aiText.length < 20) {
      setAlertMsg("Por favor, cole o texto do currículo para uma extração precisa.");
      return;
    }

    setAiLoading(true);
    try {
      const response = await axios.post(`${BASE_URL}/api/ai/import`, { 
        text: aiText, 
        autoSummary 
      }, getAuthHeaders());

      const parsed = response.data;
      if (!parsed) throw new Error("A IA comunicou com sucesso, mas não encontrou dados válidos.");

      setData(prev => {
        const merged = transformAiData(parsed, prev);
        // Persist immediately to prevent loss during re-render
        localStorage.setItem('cv_data', JSON.stringify(merged));
        return merged;
      });

      setShowAiModal(false);
      setAiText('');
      setAlertMsg('✨ Importação IA concluída! Os seus dados foram organizados nas respetivas secções.');
    } catch (err) {
      console.error('AI Import Error:', err);
      const msg = err.response?.data?.error || err.message;
      setAlertMsg(`Erro no processamento IA: ${msg}`);
    } finally {
      setAiLoading(false);
    }
  };


  const handleFileImport = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setAiLoading(true);
    setAiLoading(true);
    setAiText('⏳ A ler o ficheiro... por favor aguarde.');

    try {
      if (file.name.toLowerCase().endsWith('.pdf')) {
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await window.pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        let text = '';
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const content = await page.getTextContent();
          text += content.items.map(s => s.str).join(' ') + '\n';
        }
        if (!text.trim()) throw new Error("Não foi possível extrair texto deste PDF (pode ser uma imagem).");
        setAiText(text);
      } else if (file.name.toLowerCase().endsWith('.docx') || file.name.toLowerCase().endsWith('.doc')) {
        const arrayBuffer = await file.arrayBuffer();
        const result = await window.mammoth.extractRawText({ arrayBuffer });
        if (!result.value.trim()) throw new Error("Não foi possível extrair texto deste documento Word.");
        setAiText(result.value);
      } else {
        setAlertMsg("Formato não suportado. Utilize um ficheiro PDF ou Word (.docx).");
        setAiText('');
      }
    } catch (err) {
      console.error('File Read Error:', err);
      setAlertMsg(`Erro ao ler o ficheiro: ${err.message}`);
      setAiText('');
    } finally {
      setAiLoading(false);
      e.target.value = ''; // Reset input to allow re-upload of same file
    }
  };

  // ARR MGT
  const addExp = () => setData(p => ({ ...p, experiences: [...p.experiences, { id: Date.now(), role: '', company: '', period: '', desc: '' }] }));
  const updateExp = (id, key, val) => setData(p => ({ ...p, experiences: p.experiences.map(x => x.id === id ? { ...x, [key]: val } : x) }));
  const removeExp = id => setData(p => ({ ...p, experiences: p.experiences.filter(x => x.id !== id) }));

  const addEdu = () => setData(p => ({ ...p, educations: [...p.educations, { id: Date.now(), degree: '', institution: '', period: '' }] }));
  const updateEdu = (id, key, val) => setData(p => ({ ...p, educations: p.educations.map(x => x.id === id ? { ...x, [key]: val } : x) }));
  const removeEdu = id => setData(p => ({ ...p, educations: p.educations.filter(x => x.id !== id) }));

  const addCourse = () => setData(p => ({ ...p, courses: [...p.courses, { id: Date.now(), name: '', institution: '', year: '' }] }));
  const updateCourse = (id, key, val) => setData(p => ({ ...p, courses: p.courses.map(x => x.id === id ? { ...x, [key]: val } : x) }));
  const removeCourse = id => setData(p => ({ ...p, courses: p.courses.filter(x => x.id !== id) }));

  const addLang = () => setData(p => ({ ...p, languages: [...p.languages, { id: Date.now(), name: '', level: 'Nativo' }] }));
  const updateLang = (id, key, val) => setData(p => ({ ...p, languages: p.languages.map(x => x.id === id ? { ...x, [key]: val } : x) }));
  const removeLang = id => setData(p => ({ ...p, languages: p.languages.filter(x => x.id !== id) }));

  const addSkill = () => {
    if (!skillInput.trim()) return;
    const items = skillInput.split(',').map(s => s.trim()).filter(Boolean);
    setData(p => ({ ...p, skills: [...p.skills, ...items] }));
    setSkillInput('');
  };
  const removeSkill = i => setData(p => { const newSkills = [...p.skills]; newSkills.splice(i, 1); return { ...p, skills: newSkills } });

  return (
    <div className="cv-builder-root" style={{ display: 'flex', height: '100vh', background: 'var(--bg-base)', fontFamily: "'Inter', sans-serif", overflow: 'hidden' }}>

      {/* FRONTEND ISOLATED EDITOR FULL WIDTH */}
      <div className="mobile-main-wrapper" style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

        {/* MODERN CENTRALIZED FLOATING COMMAND CENTER */}
        <div style={{ 
          padding: '12px 20px', 
          background: 'var(--bg-surface-glass)', 
          backdropFilter: 'blur(30px)', 
          borderBottom: '1px solid var(--border-subtle)', 
          display: 'flex',
          justifyContent: 'center', // This is what the user meant by "centralize"
          alignItems: 'center', 
          zIndex: 10,
          position: 'sticky',
          top: 0
        }}>
          
          {/* THE MASTER PILL */}
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '12px', 
            background: 'var(--bg-base)', 
            padding: '6px 12px', 
            borderRadius: '20px', 
            border: '1px solid var(--border-subtle)',
            boxShadow: 'var(--shadow-lg)',
            maxWidth: '1200px',
            width: 'fit-content'
          }}>
            
            {/* Nav & Title Group */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <button 
                onClick={() => navigate('/')} 
                style={{ background: 'transparent', border: 'none', color: 'var(--text-tertiary)', cursor: 'pointer', padding: '6px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }} 
                className="hover-scale"
                title="Sair do Editor"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
              </button>
              <input 
                type="text" 
                value={cvTitle} 
                onChange={e => setCvTitle(e.target.value)}
                placeholder="Título..."
                style={{ background: 'transparent', border: 'none', color: 'var(--text-primary)', fontSize: '13px', fontWeight: '850', outline: 'none', width: '130px', textOverflow: 'ellipsis' }}
              />
              <div style={{ minWidth: '80px' }}>
                {saveStatus === 'saving' ? <span style={{ fontSize: '10px', color: 'var(--accent-primary)' }}>A gravar...</span> : <span style={{ fontSize: '10px', color: '#10b981' }}>✓ OK</span>}
              </div>
            </div>

            <div style={{ width: '1px', height: '16px', background: 'var(--border-subtle)' }}></div>

            {/* Template & Lang Group */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <select 
                value={template} 
                onChange={e => setTemplate(Number(e.target.value))} 
                style={{ background: 'transparent', border: 'none', color: 'var(--text-primary)', padding: '4px 8px', fontSize: '12px', fontWeight: '700', borderRadius: '8px', cursor: 'pointer', maxWidth: '120px' }}
              >
                <option value={1}>Clássico</option>
                <option value={2}>Moderno</option>
                <option value={3}>Elegante</option>
                <option value={4}>Minimalista</option>
                <option value={5}>Tech Teal</option>
                <option value={6}>Editorial</option>
                <option value={7}>Corporativo</option>
                <option value={8}>Oficial</option>
                {/* ... other options ignored for brevity in change, but kept in code ... */}
              </select>
              <select 
                value={lang} 
                onChange={e => setLang(e.target.value)} 
                style={{ background: 'transparent', border: 'none', color: 'var(--text-primary)', padding: '4px 8px', fontSize: '12px', fontWeight: '700', borderRadius: '8px', cursor: 'pointer' }}
              >
                <option value="pt">PT</option>
                <option value="en">EN</option>
              </select>
            </div>

            <div style={{ width: '1px', height: '16px', background: 'var(--border-subtle)' }}></div>

            {/* Actions Group (Compact) */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
              <button 
                onClick={handleManualSave} 
                style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: '6px 8px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', fontWeight: 'bold' }}
                className="hover-scale"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path><polyline points="17 21 17 13 7 13 7 21"></polyline><polyline points="7 3 7 8 15 8"></polyline></svg>
                Guardar
              </button>
              <button onClick={() => setShowAiModal(true)} style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', padding: '6px 8px', fontSize: '11px', fontWeight: '800', cursor: 'pointer' }}>✦ Importar</button>
              <button onClick={handleAiReview} style={{ background: 'transparent', border: 'none', color: 'var(--accent-primary)', padding: '6px 8px', fontSize: '11px', fontWeight: '800', cursor: 'pointer' }}>👁 Analise</button>
              
              <button 
                onClick={handlePdfDownload} 
                style={{ 
                  background: 'var(--accent-gradient)', 
                  border: 'none', 
                  color: 'white', 
                  padding: '6px 12px', 
                  fontSize: '11px', 
                  borderRadius: '10px', 
                  fontWeight: '900', 
                  boxShadow: '0 4px 8px rgba(99, 102, 241, 0.2)', 
                  cursor: 'pointer',
                  marginLeft: '4px'
                }}
              >
                ⬇ Baixar PDF
              </button>
            </div>
          </div>
        </div>

        {/* TABS MENU */}
        <div className="mobile-tabs" style={{ display: 'flex', background: 'var(--bg-surface)', borderBottom: '1px solid var(--border-subtle)', padding: '0 24px', overflowX: 'auto', gap: '8px' }}>
          {['pessoais', 'perfil', 'experiencia', 'formacao', 'cursos', 'competencias', 'idiomas'].map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)} style={{ padding: '16px 20px', background: 'none', border: 'none', color: activeTab === tab ? 'var(--accent-primary)' : 'var(--text-secondary)', fontSize: '13px', fontWeight: activeTab === tab ? 700 : 500, cursor: 'pointer', borderBottom: activeTab === tab ? `3px solid var(--accent-primary)` : '3px solid transparent', textTransform: 'capitalize', whiteSpace: 'nowrap', transition: 'all 0.2s' }}>
              {tab === 'perfil' ? 'Perfil Pessoal' : tab}
            </button>
          ))}
        </div>

        {/* EDITOR AREA CENTRADO */}
        <div className="mobile-editor-container" style={{ flex: 1, overflowY: 'auto', padding: '40px 24px', display: 'flex', justifyContent: 'center', alignItems: 'flex-start' }}>
          <div className="glass-panel mobile-editor-card" style={{ width: '100%', maxWidth: '1000px', padding: '40px 64px' }}>

            {activeTab === 'pessoais' && (
              <div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
                  <label style={labelStyle}>Foto de Perfil</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <input type="file" accept="image/*" onChange={handlePhotoUpload} style={{ ...inputStyle, padding: '8px 12px', flex: 1, marginBottom: 0 }} />
                    {data.photo && (
                      <button 
                        onClick={() => setData({ ...data, photo: null })}
                        style={{ background: '#fee2e2', color: '#ef4444', border: '1px solid #fca5a5', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '6px' }}
                      >
                        ❌ Remover
                      </button>
                    )}
                  </div>
                </div>

                <label style={labelStyle}>Nome Completo</label>
                <input type="text" value={data.name} onChange={e => setData({ ...data, name: e.target.value })} style={inputStyle} />

                <label style={labelStyle}>Cargo / Título</label>
                <input type="text" value={data.title} onChange={e => setData({ ...data, title: e.target.value })} style={inputStyle} />

                <div className="mobile-flex-col" style={{ display: 'flex', gap: '8px' }}>
                  <div style={{ flex: 1 }}><label style={labelStyle}>E-mail</label><input type="email" value={data.email} onChange={e => setData({ ...data, email: e.target.value })} style={inputStyle} /></div>
                  <div style={{ flex: 1 }}><label style={labelStyle}>Telefone</label><input type="text" value={data.phone} onChange={e => setData({ ...data, phone: e.target.value })} style={inputStyle} /></div>
                </div>

                <div className="mobile-flex-col" style={{ display: 'flex', gap: '8px' }}>
                  <div style={{ flex: 1 }}><label style={labelStyle}>Morada / Cidade</label><input type="text" value={data.location} onChange={e => setData({ ...data, location: e.target.value })} style={inputStyle} /></div>
                  <div style={{ flex: 1 }}><label style={labelStyle}>LinkedIn</label><input type="text" value={data.linkedin} onChange={e => setData({ ...data, linkedin: e.target.value })} style={inputStyle} /></div>
                </div>

                <div className="mobile-p-20" style={{ border: '2px dashed var(--border-strong)', padding: '20px', borderRadius: '12px', marginTop: '16px', background: 'var(--bg-surface)' }}>
                  <h4 style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '12px', fontWeight: '800' }}>Informações Adicionais (Documentos e Detalhes)</h4>
                  <div className="mobile-grid-1" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div><label style={labelStyle}>Nacionalidade</label><input type="text" value={data.nacionalidade} onChange={e => setData({ ...data, nacionalidade: e.target.value })} style={inputStyle} /></div>
                    <div><label style={labelStyle}>Data Nascimento</label><input type="text" value={data.dataNascimento} onChange={e => setData({ ...data, dataNascimento: e.target.value })} style={inputStyle} /></div>
                    <div><label style={labelStyle}>Estado Civil</label><input type="text" value={data.estadoCivil} onChange={e => setData({ ...data, estadoCivil: e.target.value })} style={inputStyle} /></div>
                    <div><label style={labelStyle}>Nº de B.I.</label><input type="text" value={data.bi} onChange={e => setData({ ...data, bi: e.target.value })} style={inputStyle} /></div>
                    <div><label style={labelStyle}>NUIT</label><input type="text" value={data.nuit} onChange={e => setData({ ...data, nuit: e.target.value })} style={inputStyle} /></div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'perfil' && (
              <div>
                <label style={labelStyle}>Perfil Pessoal / Resumo Profissional</label>
                <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '12px' }}>Escreva um breve resumo sobre quem você é profissionalmente, os seus objetivos e o que o destaca.</p>
                <textarea value={data.summary} onChange={e => setData({ ...data, summary: e.target.value })} style={{ ...inputStyle, height: '180px', resize: 'vertical' }} placeholder="Sou um profissional focado em..." />
              </div>
            )}

            {activeTab === 'experiencia' && (
              <div>
                {data.experiences.map(e => (
                  <div key={e.id} style={cardStyle}>
                    <button onClick={() => removeExp(e.id)} style={removeBtnStyle}>×</button>
                    <label style={labelStyle}>Cargo</label><input type="text" value={e.role} onChange={ev => updateExp(e.id, 'role', ev.target.value)} style={inputStyle} />
                    <label style={labelStyle}>Empresa</label><input type="text" value={e.company} onChange={ev => updateExp(e.id, 'company', ev.target.value)} style={inputStyle} />
                    <label style={labelStyle}>Período</label><input type="text" value={e.period} onChange={ev => updateExp(e.id, 'period', ev.target.value)} style={inputStyle} />
                    <label style={labelStyle}>Descrição</label><textarea value={e.desc} onChange={ev => updateExp(e.id, 'desc', ev.target.value)} style={{ ...inputStyle, height: '80px' }} />
                  </div>
                ))}
                <button onClick={addExp} style={addBtnStyle}>+ Adicionar Experiência</button>
              </div>
            )}

            {activeTab === 'formacao' && (
              <div>
                {data.educations.map(e => (
                  <div key={e.id} style={cardStyle}>
                    <button onClick={() => removeEdu(e.id)} style={removeBtnStyle}>×</button>
                    <label style={labelStyle}>Grau / Título</label><input type="text" value={e.degree} onChange={ev => updateEdu(e.id, 'degree', ev.target.value)} style={inputStyle} />
                    <label style={labelStyle}>Instituição</label><input type="text" value={e.institution} onChange={ev => updateEdu(e.id, 'institution', ev.target.value)} style={inputStyle} />
                    <label style={labelStyle}>Período</label><input type="text" value={e.period} onChange={ev => updateEdu(e.id, 'period', ev.target.value)} style={inputStyle} />
                  </div>
                ))}
                <button onClick={addEdu} style={addBtnStyle}>+ Adicionar Formação</button>
              </div>
            )}

            {activeTab === 'cursos' && (
              <div>
                {data.courses.map(c => (
                  <div key={c.id} style={cardStyle}>
                    <button onClick={() => removeCourse(c.id)} style={removeBtnStyle}>×</button>
                    <label style={labelStyle}>Nome do Curso / Certificação</label><input type="text" value={c.name} onChange={ev => updateCourse(c.id, 'name', ev.target.value)} style={inputStyle} />
                    <label style={labelStyle}>Instituição</label><input type="text" value={c.institution} onChange={ev => updateCourse(c.id, 'institution', ev.target.value)} style={inputStyle} />
                    <label style={labelStyle}>Ano</label><input type="text" value={c.year} onChange={ev => updateCourse(c.id, 'year', ev.target.value)} style={inputStyle} />
                  </div>
                ))}
                <button onClick={addCourse} style={addBtnStyle}>+ Adicionar Curso</button>
              </div>
            )}

            {activeTab === 'competencias' && (
              <div>
                <label style={labelStyle}>Adicionar Competências (Pressione Enter ou use ,)</label>
                <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
                  <input type="text" value={skillInput} onChange={e => setSkillInput(e.target.value)} onKeyDown={e => { if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); addSkill() } }} style={{ ...inputStyle, marginBottom: 0 }} placeholder="Redes, Gestão..." />
                  <button onClick={addSkill} style={{ background: 'var(--border-strong)', color: 'var(--text-primary)', border: 'none', borderRadius: '10px', padding: '0 20px', cursor: 'pointer', fontWeight: 'bold', fontSize: '18px' }}>+</button>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                  {data.skills.map((s, i) => (
                    <div key={i} style={{ background: 'var(--bg-base)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)', padding: '8px 16px', borderRadius: '20px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '10px', fontWeight: '500' }}>
                      {s} <button onClick={() => removeSkill(i)} style={{ background: 'rgba(239, 68, 68, 0.1)', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '14px', width: '20px', height: '20px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>&times;</button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'idiomas' && (
              <div>
                {data.languages.map(l => (
                  <div key={l.id} className="mobile-flex-col" style={{ display: 'flex', gap: '8px', marginBottom: '12px', alignItems: 'flex-start' }}>
                    <div className="mobile-full-width" style={{ flex: 1 }}><label style={labelStyle}>Idioma</label><input type="text" value={l.name} onChange={ev => updateLang(l.id, 'name', ev.target.value)} style={inputStyle} /></div>
                    <div className="mobile-full-width" style={{ width: '130px' }}><label style={labelStyle}>Nível</label><select value={l.level} onChange={ev => updateLang(l.id, 'level', ev.target.value)} style={inputStyle}>
                      {['Nativo', 'Fluente', 'Avançado', 'Intermediário', 'Básico'].map(lv => <option key={lv}>{lv}</option>)}
                    </select></div>
                    <div style={{ paddingTop: '22px' }}><button onClick={() => removeLang(l.id)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '24px' }}>&times;</button></div>
                  </div>
                ))}
                <button onClick={addLang} style={addBtnStyle}>+ Adicionar Idioma</button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* FULL SCREEN PREVIEW & AI REVIEW MODAL */}
      {showPreview && (
        <div className="mobile-preview-overlay" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', flexDirection: 'column', zIndex: 9999 }}>
          <div className="mobile-header-toolbar mobile-p-10" style={{ padding: '16px 24px', background: 'var(--bg-surface)', borderBottom: `1px solid var(--border-subtle)`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
            <h3 style={{ color: 'var(--text-primary)', margin: 0, fontSize: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ color: 'var(--accent-primary)' }}>✦</span> Auditoria de IA & Visualização
            </h3>
            <div className="mobile-wrap" style={{ display: 'flex', gap: '12px' }}>
              <button className="btn-primary" onClick={handlePdfDownload} style={{ padding: '8px 16px', borderRadius: '6px', fontSize: '13px' }}>⬇ Baixar PDF Final</button>
              <button className="btn-secondary" onClick={() => setShowPreview(false)} style={{ padding: '8px 16px', borderRadius: '6px', fontSize: '13px' }}>✕ Fechar Tudo</button>
            </div>
          </div>

          <div className="mobile-flex-col" style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
            
            {/* AI REVIEW PANEL (LEFT COL) */}
            <div className="custom-scrollbar mobile-full-width" style={{ width: '400px', maxWidth: '100%', background: 'var(--bg-base)', borderRight: '1px solid var(--border-subtle)', overflowY: 'auto', padding: '32px' }}>
              <div className="premium-card" style={{ padding: '24px', marginBottom: '24px' }}>
                <h4 className="outfit" style={{ fontSize: '18px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--accent-primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                  Auditoria de Especialista
                </h4>
                
                {reviewLoading ? (
                  <div style={{ padding: '20px 0', textAlign: 'center', color: 'var(--text-tertiary)' }}>
                    <div style={{ marginBottom: '12px', animation: 'pulse 1.5s infinite' }}>A analisar minuciosamente o teu CV...</div>
                  </div>
                ) : reviewData ? (
                  <div style={{ animation: 'fadeIn 0.3s ease' }}>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginBottom: '24px' }}>
                      <span className="outfit gradient-text" style={{ fontSize: '48px', fontWeight: '900', lineHeight: 1 }}>{reviewData.score || '85'}</span>
                      <span style={{ fontSize: '14px', color: 'var(--text-tertiary)', fontWeight: 'bold' }}>/ 100 PTS</span>
                    </div>

                    <div style={{ marginBottom: '24px' }}>
                      <p style={{ fontSize: '13px', fontWeight: 'bold', textTransform: 'uppercase', color: '#10b981', marginBottom: '12px', letterSpacing: '0.5px' }}>✓ PONTOS FORTES</p>
                      <ul style={{ paddingLeft: '20px', margin: 0, color: 'var(--text-secondary)', fontSize: '14px', lineHeight: '1.6' }}>
                        {(reviewData.pontos_fortes || ['Design Limpo','O teu nome está bem destacado.']).map((pt, i) => (
                          <li key={i} style={{ marginBottom: '8px' }}>{pt}</li>
                        ))}
                      </ul>
                    </div>

                    <div>
                      <p style={{ fontSize: '13px', fontWeight: 'bold', textTransform: 'uppercase', color: '#f59e0b', marginBottom: '12px', letterSpacing: '0.5px' }}>⚠ SUGESTÕES DE MELHORIA</p>
                      <ul style={{ paddingLeft: '20px', margin: 0, color: 'var(--text-secondary)', fontSize: '14px', lineHeight: '1.6' }}>
                        {(reviewData.melhorias || ['Adiciona mais competências técnicas.']).map((pt, i) => (
                          <li key={i} style={{ marginBottom: '8px' }}>{pt}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                ) : (
                  <div style={{ padding: '20px 0', textAlign: 'center', color: 'var(--text-tertiary)', fontSize: '14px' }}>
                    Modo offline. Análise rápida indisponível sem login/API no Backend.
                  </div>
                )}
              </div>
              <p style={{ fontSize: '12px', color: 'var(--text-tertiary)', textAlign: 'center' }}>Faz edições no modo normal, e depois volta aqui para veres o resultado!</p>
            </div>

            {/* PREVIEW PANEL (RIGHT COL) */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '40px', display: 'flex', justifyContent: 'center', background: 'var(--bg-surface)' }} onClick={(e) => { if (e.target === e.currentTarget) setShowPreview(false); }}>
              <div style={{ width: 'max-content' }}>
                <div
                  ref={pdfRef}
                  style={{ width: '794px', minHeight: '1123px', background: '#fff', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)', transition: 'transform 0.3s ease' }}
                  dangerouslySetInnerHTML={{ __html: renderCV(template, data, lang) }}
                />
              </div>
            </div>

          </div>
        </div>
      )}

      {/* OFFLINE / AI IMPORT MODAL */}
      {showAiModal && (
        <div className="mobile-import-overlay" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000 }}>
          <div className="mobile-p-20" style={{ background: 'var(--bg-surface)', padding: '24px', borderRadius: '12px', width: '90%', maxWidth: '600px', border: `1px solid var(--border-subtle)`, maxHeight: '90vh', overflowY: 'auto', position: 'relative' }}>
            {aiLoading && (
              <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', zIndex: 10, borderRadius: '12px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
                <div style={{ width: '40px', height: '40px', border: '3px solid white', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite', marginBottom: '16px' }}></div>
                <p style={{ fontWeight: '800', fontSize: '15px' }}>Analisando o teu Currículo...</p>
              </div>
            )}
            <h3 style={{ color: 'var(--text-primary)', margin: '0 0 12px 0' }}>Importação Rápida de Currículo</h3>

            <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', background: 'var(--bg-base)', border: '1px solid var(--border-strong)', padding: '4px', borderRadius: '8px' }}>
              <button onClick={() => setUseAi(true)} style={{ flex: 1, padding: '8px', border: 'none', borderRadius: '6px', background: useAi ? 'var(--bg-surface)' : 'transparent', color: useAi ? 'var(--text-primary)' : 'var(--text-secondary)', fontWeight: useAi ? 'bold' : 'normal', cursor: 'pointer', boxShadow: useAi ? 'var(--shadow-sm)' : 'none', transition: 'all 0.2s' }}>✨ Agente IA (Recomendado)</button>
              <button onClick={() => setUseAi(false)} style={{ flex: 1, padding: '8px', border: 'none', borderRadius: '6px', background: !useAi ? 'var(--bg-surface)' : 'transparent', color: !useAi ? 'var(--text-primary)' : 'var(--text-secondary)', fontWeight: !useAi ? 'bold' : 'normal', cursor: 'pointer', boxShadow: !useAi ? 'var(--shadow-sm)' : 'none', transition: 'all 0.2s' }}>⚡ Offline (Básico)</button>
            </div>

            {useAi ? (
              <div style={{ marginBottom: '16px', animation: 'fadeIn 0.3s ease' }}>
                <p style={{ color: 'var(--text-secondary)', fontSize: '13px', marginBottom: '12px', lineHeight: '1.5' }}>O Agente IA lê o texto desestruturado usando a sua inteligência, converte, e preenche impecavelmente <b>todos</b> os campos do formulário por si.<br />
                  Este modo utiliza o processamento central do CurrículoStudio para máxima precisão.</p>

                <label style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', fontSize: '13px', color: 'var(--text-primary)', cursor: 'pointer', fontWeight: '500', background: 'var(--bg-base)', padding: '12px', borderRadius: '8px', border: `1px solid var(--border-strong)` }}>
                  <input type="checkbox" checked={autoSummary} onChange={e => setAutoSummary(e.target.checked)} style={{ width: '18px', height: '18px', accentColor: '#3b82f6', marginTop: '2px' }} />
                  Gerar Perfil Pessoal/Resumo Profissional focado em vender o meu perfil caso o CV não tenha um forte estruturado.
                </label>
              </div>
            ) : (
              <p style={{ color: 'var(--text-secondary)', fontSize: '13px', marginBottom: '16px', lineHeight: '1.5', animation: 'fadeIn 0.3s ease' }}>O sistema offline tenta agrupar secções pelo texto bruto e procurar por Emails/Telefones via Regex. Vai exigir mais revisão manual após a extração.</p>
            )}

            <div className="mobile-flex-col" style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
              <input type="file" id="cv-file-upload" accept=".pdf,.doc,.docx" style={{ display: 'none' }} onChange={handleFileImport} />
              <button className="btn-secondary" disabled={aiLoading} onClick={() => document.getElementById('cv-file-upload').click()} style={{ padding: '10px 12px', fontSize: '13px', flex: 1 }}>
                📄 Selecionar Ficheiro (PDF / Word)
              </button>
            </div>

            <textarea
              value={aiText} onChange={e => setAiText(e.target.value)}
              placeholder="O texto extraído aparecerá aqui automaticamente após selecionar o ficheiro. Também pode colar texto diretamente aqui..."
              style={{ 
                width: '100%', 
                height: '140px', 
                background: 'rgba(255,255,255,0.05)', 
                border: `1px solid var(--border-strong)`, 
                color: '#fff', // Explicit white text for dark mode
                padding: '16px', 
                borderRadius: '12px', 
                outline: 'none', 
                marginBottom: '16px', 
                fontSize: '13px', 
                lineHeight: '1.6',
                resize: 'none'
              }}
            />

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button onClick={() => setShowAiModal(false)} style={{ background: 'transparent', color: 'var(--text-secondary)', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}>Cancelar</button>
              <button className="btn-primary" onClick={useAi ? handleAiImport : handleLocalImport} disabled={aiLoading || !aiText} style={{ padding: '10px 20px', fontSize: '13px', opacity: (aiLoading || !aiText) ? 0.5 : 1 }}>
                {aiLoading ? 'Processando...' : (useAi ? '✨ Extrair com IA' : 'Extrair Offline')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CUSTOM ALERT MODAL */}
      {alertMsg && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 99999, animation: 'fadeIn 0.2s ease' }}>
          <div className="premium-card" style={{ padding: '32px 40px', maxWidth: '420px', width: '90%', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', animation: 'slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)', zIndex: 100000 }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'var(--accent-glow)', color: 'var(--accent-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px' }}>
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>
            </div>
            <p style={{ color: 'var(--text-primary)', fontSize: '15px', lineHeight: '1.6', marginBottom: '28px', fontWeight: '500' }}>{alertMsg}</p>
            <button className="btn-primary" onClick={() => setAlertMsg(null)} style={{ padding: '12px 32px', fontSize: '14px', width: '100%' }}>
              Entendido
            </button>
          </div>
        </div>
      )}

      {/* HIDDEN PRINT CONTAINER - ALWAYS RENDERED FOR WINDOW.PRINT TO WORK */}
      <div
        id="print-area"
        style={{ display: 'none' }}
        dangerouslySetInnerHTML={{ __html: renderCV(template, data, lang) }}
      />
    </div>
  );
};

export default CVBuilder;
