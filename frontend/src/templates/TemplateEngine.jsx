import React from 'react';

const dict = {
  pt: {
    profile: "Perfil Profissional", experience: "Experiência", education: "Formação Académica", 
    courses: "Certificações", skills: "Competências", languages: "Idiomas", 
    contact: "Contactos", details: "Dados Pessoais", references: "Referências"
  },
  en: {
    profile: "Professional Profile", experience: "Experience", education: "Education", 
    courses: "Certifications", skills: "Skills", languages: "Languages", 
    contact: "Contact", details: "Personal Details", references: "References"
  }
};

const Icons = {
  phone: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>,
  email: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>,
  location: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>,
  linkedin: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"></path><rect x="2" y="9" width="4" height="12"></rect><circle cx="4" cy="4" r="2"></circle></svg>,
  doc: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
};

const CustomGeometry = ({ type, color }) => {
  if (type === 'curve-header') {
    return (
      <svg viewBox="0 0 1440 220" style={{ position: 'absolute', top: 0, left: 0, width: '100%', zIndex: 0 }}>
         <path fill={color} fillOpacity="1" d="M0,0L1440,0L1440,160C1100,280,340,280,0,160V0Z"></path>
      </svg>
    )
  }
  if (type === 'diagonal-header') {
      return (
        <svg viewBox="0 0 1440 220" style={{ position: 'absolute', top: 0, left: 0, width: '100%', zIndex: 0 }} preserveAspectRatio="none">
           <path fill={color} fillOpacity="1" d="M0,0L1440,0L1440,100L0,220Z"></path>
        </svg>
      )
  }
  return null;
}

const TemplateEngine = ({ templateId, templateConfig, data, lang = 'pt' }) => {
  const { name, title, email, phone, location, linkedin, summary, photo, nacionalidade, bi, nuit } = data;
  const experiences = data.experiences || [];
  const educations = data.educations || [];
  const courses = data.courses || [];
  const languages = data.languages || [];
  const skills = data.skills || [];

  const t = dict[lang] || dict.pt;
  const th = templateConfig.theme || {};
  const colors = th.colors || {};
  const variants = templateConfig.variants || {}; // { experience: 'timeline', skills: 'bar', headings: 'underlined' }
  const geometry = templateConfig.layout?.geometry || null;

  const np = (name || '').trim().split(' ');
  const initials = ((np[0] || '').charAt(0) + (np[np.length - 1] || '').charAt(0)).toUpperCase() || 'CV';

  const contactList = [
    { icon: Icons.email, text: email },
    { icon: Icons.phone, text: phone },
    { icon: Icons.location, text: location },
    { icon: Icons.linkedin, text: linkedin },
    { icon: Icons.doc, text: nacionalidade },
    { icon: Icons.doc, text: bi ? `BI: ${bi}` : '' }
  ].filter(c => c.text);

  // Helper for Title styles
  const SectionTitle = ({ children, color }) => {
     if (variants.headings === 'traditional-numbered') {
        return <h3 style={{ fontSize: '15px', color: color, fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '16px', background: 'rgba(0,0,0,0.05)', padding: '6px 12px', border: `1px solid ${color}` }}>{children}</h3>
     }
     if (variants.headings === 'traditional-clean') {
        return <h3 style={{ fontSize: '16px', color: color, fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '16px', borderBottom: `1px solid ${color}`, letterSpacing: '0.5px' }}>{children}</h3>
     }
     if (variants.headings === 'pill') {
        return <h3 style={{ display: 'inline-block', background: color, color: '#fff', padding: '6px 16px', borderRadius: '20px', fontSize: '13px', textTransform: 'uppercase', marginBottom: '16px', letterSpacing: '1px' }}>{children}</h3>
     }
     if (variants.headings === 'minimal') {
        return <h3 style={{ fontSize: '15px', color: color, fontWeight: '800', textTransform: 'uppercase', marginBottom: '16px', letterSpacing: '1.5px' }}>{children}</h3>
     }
     if (variants.headings === 'bold-line') {
        return (
           <div style={{ marginBottom: '16px' }}>
               <h3 style={{ fontSize: '16px', color: color, fontWeight: '700', textTransform: 'uppercase', margin: 0 }}>{children}</h3>
               <div style={{ height: '3px', width: '30px', background: color, marginTop: '6px' }}></div>
           </div>
        )
     }
     // Underlined (default)
     return <h3 style={{ fontSize: '15px', color: color, borderBottom: `2px solid ${color}`, paddingBottom: '6px', marginBottom: '16px', textTransform: 'uppercase', fontWeight: 'bold' }}>{children}</h3>
  };

  const renderBlock = (blockName, key, context) => {
    const isSidebar = context === 'sidebar';
    const mainColor = isSidebar ? (colors.sidebarTitle || '#fff') : colors.primary;
    const textColor = isSidebar ? (colors.sidebarText || '#e2e8f0') : colors.textMain;

    switch (blockName) {
      case 'photo':
        const size = context === 'topbar' || context === 'header' ? '120px' : '150px';
        const isFloating = variants.photo === 'floating';
        const isTopRight = variants.photo === 'top-right';
        return (
          <div key={key} style={{ display: 'flex', justifyContent: isSidebar ? 'center' : (isTopRight ? 'flex-end' : 'flex-start'), marginBottom: (isFloating || isTopRight) ? '0' : '24px', position: (isFloating || isTopRight) ? 'absolute' : 'relative', top: isFloating ? '30px' : (isTopRight ? '50px' : 'auto'), right: isFloating ? '40px' : (isTopRight ? '50px' : 'auto'), zIndex: 10 }}>
             {photo ? (
               <img src={photo} alt="Perfil" style={{ width: isTopRight ? '110px' : size, height: isTopRight ? '130px' : size, borderRadius: variants.photo === 'square' || isTopRight ? '4px' : '50%', objectFit: 'cover', border: isTopRight ? '1px solid #333' : `4px solid ${colors.photoBorder || '#fff'}`, boxShadow: isTopRight ? 'none' : '0 10px 15px -3px rgba(0,0,0,0.1)' }} />
             ) : (
               <div style={{ width: size, height: size, borderRadius: '50%', background: 'var(--accent-primary)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '36px', fontWeight: 'bold' }}>{initials}</div>
             )}
          </div>
        );

      case 'page-title':
        return (
          <div key={key} style={{ width: '100%', textAlign: 'center', marginBottom: '40px' }}>
             <h1 style={{ fontSize: '24px', fontWeight: 'bold', textDecoration: 'underline', color: colors.primary, margin: 0, textTransform: 'uppercase' }}>Curriculum Vitae</h1>
          </div>
        );

      case 'header':
        const isTop = context === 'topbar';
        const nameColor = isTop ? colors.topbarText : colors.primary;
        return (
          <div key={key} style={{ marginBottom: isTop ? '0' : '32px', flex: isTop ? 1 : 'unset' }}>
            <h1 style={{ margin: 0, fontSize: isTop ? '42px' : '36px', color: nameColor, fontWeight: '900', letterSpacing: '-0.5px' }}>{(name || 'Seu Nome').toUpperCase()}</h1>
            <h2 style={{ margin: '8px 0 0', fontSize: '18px', color: isTop ? 'rgba(255,255,255,0.85)' : colors.textMain, fontWeight: '500', letterSpacing: '1px' }}>{(title || 'Cargo Profissional').toUpperCase()}</h2>
          </div>
        );

      case 'contact':
        if(variants.contact === 'traditional-list' || variants.contact === 'mozambican') {
           const mozDocs = [
             { label: 'Nome Completo', val: name },
             { label: 'Data de Nascimento', val: dataNascimento },
             { label: 'Estado Civil', val: estadoCivil },
             { label: 'Nacionalidade', val: nacionalidade },
             { label: 'B.I.', val: bi },
             { label: 'NUIT', val: nuit },
             { label: 'Endereço', val: location },
             { label: 'Contactos', val: [phone, email].filter(Boolean).join(' / ') }
           ];
           return (
              <div key={key} style={{ marginBottom: '32px' }}>
                 <SectionTitle color={mainColor}>{t.details}</SectionTitle>
                 <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13.5px', color: textColor, lineHeight: 1.6 }}>
                    {mozDocs.filter(d => d.val).map((item, i) => (
                       <div key={i} style={{ display: 'flex' }}>
                          <strong style={{ width: '160px', flexShrink: 0, color: mainColor }}>{item.label}:</strong>
                          <span>{item.val}</span>
                       </div>
                    ))}
                 </div>
              </div>
           );
        }
        if(!contactList.length) return null;
        if(context === 'topbar' || variants.contact === 'inline'){
            return (
                <div key={key} style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', fontSize: '12px', color: context === 'topbar' ? 'rgba(255,255,255,0.9)' : colors.textMain, marginTop: '16px' }}>
                    {contactList.map((item, i) => (
                       <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{ opacity: 0.8 }}>{item.icon}</span>
                          <span>{item.text}</span>
                       </div>
                    ))}
                </div>
            )
        }
        return (
          <div key={key} style={{ marginBottom: '32px' }}>
            <SectionTitle color={mainColor}>{t.contact}</SectionTitle>
            {contactList.map((item, i) => (
              <div key={i} style={{ fontSize: '12.5px', color: textColor, display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                 <span style={{ color: mainColor }}>{item.icon}</span>
                 <span style={{ lineHeight: 1.4 }}>{item.text}</span>
              </div>
            ))}
          </div>
        );

      case 'summary':
        if (!summary) return null;
        return (
          <div key={key} style={{ marginBottom: '32px' }}>
             <SectionTitle color={mainColor}>{t.profile}</SectionTitle>
             <p style={{ fontSize: '13.5px', lineHeight: 1.7, color: textColor, textAlign: 'justify', margin: 0 }}>{summary}</p>
          </div>
        );

      case 'experience':
        if (!experiences.length) return null;
        return (
          <div key={key} style={{ marginBottom: '32px' }}>
            <SectionTitle color={mainColor}>{t.experience}</SectionTitle>
            {experiences.map((e, index) => {
               if (variants.experience === 'traditional') {
                   return (
                     <div key={e.id} style={{ marginBottom: '20px', fontSize: '13.5px', color: textColor }}>
                        <div style={{ display: 'flex', fontWeight: 'bold' }}>
                           <div style={{ width: '160px', flexShrink: 0 }}>{e.period}</div>
                           <div>
                              <div style={{ textTransform: 'uppercase' }}>{e.company}</div>
                              <div style={{ fontWeight: 'normal', fontStyle: 'italic', marginBottom: '4px' }}>Cargo: {e.role}</div>
                           </div>
                        </div>
                        {e.desc && <div style={{ paddingLeft: '160px', lineHeight: 1.5, opacity: 0.9 }}>{e.desc}</div>}
                     </div>
                   )
               }
               if (variants.experience === 'timeline') {
                   return (
                      <div key={e.id} style={{ position: 'relative', paddingLeft: '24px', paddingBottom: index === experiences.length - 1 ? '0' : '20px', borderLeft: `2px solid ${colors.sidebarBg || '#e2e8f0'}` }}>
                         <div style={{ position: 'absolute', left: '-6px', top: '4px', width: '10px', height: '10px', borderRadius: '50%', background: mainColor, border: '2px solid #fff' }}></div>
                         <div style={{ fontWeight: '800', fontSize: '15px', color: textColor }}>{e.role}</div>
                         <div style={{ fontSize: '13px', color: mainColor, fontWeight: '600', marginBottom: '6px' }}>{e.company} <span style={{ opacity: 0.7, fontWeight: 'normal' }}>| {e.period}</span></div>
                         <p style={{ margin: 0, fontSize: '13px', color: textColor, lineHeight: 1.6, opacity: 0.85 }}>{e.desc}</p>
                      </div>
                   )
               }
               // Default classic block
               return (
                 <div key={e.id} style={{ marginBottom: '18px' }}>
                   <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '2px' }}>
                     <div style={{ fontWeight: '700', fontSize: '15px', color: textColor }}>{e.role}</div>
                     <div style={{ fontSize: '12px', color: mainColor, fontWeight: '700', background: 'rgba(0,0,0,0.04)', padding: '2px 8px', borderRadius: '12px' }}>{e.period}</div>
                   </div>
                   <div style={{ fontSize: '13.5px', fontWeight: '500', color: mainColor, marginBottom: '6px' }}>{e.company}</div>
                   {e.desc && <p style={{ fontSize: '13px', color: textColor, lineHeight: 1.6, margin: 0, opacity: 0.85 }}>{e.desc}</p>}
                 </div>
               )
            })}
          </div>
        );

      case 'education':
        if (!educations.length) return null;
        return (
          <div key={key} style={{ marginBottom: '32px' }}>
            <SectionTitle color={mainColor}>{t.education}</SectionTitle>
             {educations.map((e, index) => {
               if (variants.education === 'traditional') {
                   return (
                     <div key={e.id} style={{ marginBottom: '12px', fontSize: '13.5px', color: textColor, display: 'flex' }}>
                        <strong style={{ width: '160px', flexShrink: 0 }}>{e.period}</strong>
                        <div>
                           <div>{e.degree}</div>
                           <div style={{ fontStyle: 'italic', opacity: 0.9 }}>{e.institution}</div>
                        </div>
                     </div>
                   )
               }
               if (variants.education === 'timeline') {
                   return (
                      <div key={e.id} style={{ position: 'relative', paddingLeft: '24px', paddingBottom: index === educations.length - 1 ? '0' : '16px', borderLeft: `2px solid ${colors.sidebarBg || '#e2e8f0'}` }}>
                         <div style={{ position: 'absolute', left: '-6px', top: '4px', width: '10px', height: '10px', borderRadius: '50%', background: mainColor, border: '2px solid #fff' }}></div>
                         <div style={{ fontWeight: '800', fontSize: '14px', color: textColor }}>{e.degree}</div>
                         <div style={{ fontSize: '12.5px', color: mainColor, fontWeight: '600' }}>{e.institution} <span style={{ opacity: 0.7, fontWeight: 'normal' }}>| {e.period}</span></div>
                      </div>
                   )
               }
               return (
                 <div key={e.id} style={{ marginBottom: '14px' }}>
                   <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '2px' }}>
                     <div style={{ fontWeight: '700', fontSize: '14px', color: textColor }}>{e.degree}</div>
                     <div style={{ fontSize: '12px', color: mainColor, fontWeight: 'bold' }}>{e.period}</div>
                   </div>
                   <div style={{ fontSize: '13px', color: textColor, opacity: 0.8 }}>{e.institution}</div>
                 </div>
               )
            })}
          </div>
        );

      case 'skills':
        if (!skills.length) return null;
        return (
          <div key={key} style={{ marginBottom: '32px' }}>
             <SectionTitle color={mainColor}>{t.skills}</SectionTitle>
             
             {variants.skills === 'text' || variants.skills === 'traditional' ? (
                <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '13.5px', color: textColor, lineHeight: 1.6 }}>
                   {skills.map((s, i) => <li key={i}>{s}</li>)}
                </ul>
             ) : variants.skills === 'bar' ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                   {skills.map((s, i) => (
                      <div key={i}>
                         <div style={{ fontSize: '12.5px', color: textColor, fontWeight: '600', marginBottom: '6px' }}>{s}</div>
                         <div style={{ width: '100%', height: '5px', background: isSidebar ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.06)', borderRadius: '4px' }}>
                            <div style={{ width: `${Math.max(60, 100 - (i * 10))}%`, height: '100%', background: mainColor, borderRadius: '4px' }}></div>
                         </div>
                      </div>
                   ))}
                </div>
             ) : variants.skills === 'comma' ? (
                <div style={{ fontSize: '13.5px', lineHeight: 1.6, color: textColor }}>{skills.join(' • ')}</div>
             ) : (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {skills.map((s, i) => (
                    <span key={i} style={{ background: isSidebar ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.04)', border: `1px solid ${isSidebar ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)'}`, color: textColor, padding: '5px 12px', borderRadius: '20px', fontSize: '12.5px', fontWeight: '500' }}>{s}</span>
                  ))}
                </div>
             )}
          </div>
        );

      case 'languages':
        if (!languages.length) return null;
        return (
           <div key={key} style={{ marginBottom: '32px' }}>
             <SectionTitle color={mainColor}>{t.languages}</SectionTitle>
             {variants.languages === 'text' || variants.languages === 'traditional' ? (
                <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '13.5px', color: textColor, lineHeight: 1.6 }}>
                   {languages.map((l, i) => <li key={i}><strong>{l.name}</strong> - {l.level}</li>)}
                </ul>
             ) : (
             <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                 {languages.map(l => (
                   <div key={l.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px' }}>
                     <span style={{ color: textColor, fontWeight: '600' }}>{l.name}</span>
                     {variants.languages === 'dots' ? (
                       <div style={{ display: 'flex', gap: '4px' }}>
                          {[1,2,3,4,5].map(dot => (
                             <div key={dot} style={{ width: '8px', height: '8px', borderRadius: '50%', background: mainColor, opacity: dot <= 4 ? 1 : 0.3 }}></div>
                          ))}
                       </div>
                     ) : (
                       <span style={{ color: mainColor, fontWeight: '700', fontSize: '12px', textTransform: 'uppercase' }}>{l.level}</span>
                     )}
                   </div>
                 ))}
             </div>
             )}
           </div>
        );

      case 'courses':
        if (!courses.length) return null;
        return (
          <div key={key} style={{ marginBottom: '32px' }}>
            <SectionTitle color={mainColor}>{t.courses}</SectionTitle>
            {courses.map(c => (
              <div key={c.id} style={{ marginBottom: '12px' }}>
                <div style={{ fontWeight: '600', fontSize: '13.5px', color: textColor }}>{c.name}</div>
                <div style={{ fontSize: '12.5px', color: mainColor, fontWeight: '500' }}>{c.institution} <span style={{ opacity: 0.6 }}>| {c.year}</span></div>
              </div>
            ))}
          </div>
        );

      default:
        return null;
    }
  };

  const layoutType = templateConfig.layout?.type || 'two-column';
  const sidebarWidth = templateConfig.layout?.sidebarWidth || '35%';
  const hasSidebar = layoutType.includes('sidebar') || layoutType === 'two-column';
  const hasTopbar = layoutType.includes('topbar');

  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column',
      width: '100%', 
      minHeight: '1123px', // A4
      fontFamily: templateConfig.theme?.font || "'Inter', sans-serif",
      backgroundColor: colors.background || '#fff',
      boxSizing: 'border-box',
      position: 'relative',
      overflow: 'hidden'
    }}>
      
      {geometry && <CustomGeometry type={geometry} color={colors.primary} />}

      <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', flex: 1 }}>
          {hasTopbar && (
            <header style={{
                width: '100%',
                backgroundColor: colors.topbarBg === 'transparent' ? 'transparent' : (colors.topbarBg || colors.primary),
                padding: geometry ? '50px 50px 30px' : '40px 50px',
                display: 'flex',
                alignItems: 'center',
                gap: '30px',
                boxSizing: 'border-box'
            }}>
                {templateConfig.structure.topbar?.map((block, i) => renderBlock(block, `topbar-${i}`, 'topbar'))}
            </header>
          )}

          <div style={{ display: 'flex', flex: 1, flexDirection: templateConfig.layout?.sidebarPosition === 'right' ? 'row-reverse' : 'row' }}>
             {hasSidebar && (
               <aside style={{
                 width: sidebarWidth,
                 backgroundColor: colors.sidebarBg === 'transparent' ? 'transparent' : (colors.sidebarBg || '#f1f5f9'),
                 padding: hasTopbar ? '30px 40px' : '50px 40px',
                 boxSizing: 'border-box',
                 borderRight: templateConfig.layout?.sidebarPosition === 'left' && colors.sidebarBg === 'transparent' ? `1px solid rgba(0,0,0,0.1)` : 'none',
                 borderLeft: templateConfig.layout?.sidebarPosition === 'right' && colors.sidebarBg === 'transparent' ? `1px solid rgba(0,0,0,0.1)` : 'none'
               }}>
                 {templateConfig.structure.sidebar?.map((block, i) => renderBlock(block, `sidebar-${i}`, 'sidebar'))}
               </aside>
             )}

             <main style={{
               flex: 1,
               backgroundColor: 'transparent',
               padding: hasTopbar ? '30px 50px' : '50px 50px',
               boxSizing: 'border-box'
             }}>
                {templateConfig.structure.main?.map((block, i) => renderBlock(block, `main-${i}`, 'main'))}
             </main>
          </div>
      </div>
    </div>
  );
};

export default TemplateEngine;
