import React, { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import logo from '../assets/logo.svg'
import logoName from '../assets/logo-name.svg'
import styles from './PoliticaPrivacidadePage.module.css'

const PoliticaPrivacidadePage: React.FC = () => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [isScrolled, setIsScrolled] = useState(false)

  useEffect(() => {
    let ticking = false
    const handleScroll = () => {
      if (!ticking) {
        ticking = true
        requestAnimationFrame(() => {
          setIsScrolled(window.scrollY > 15)
          ticking = false
        })
      }
    }

    handleScroll()
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const handleBack = () => {
    navigate('/', { replace: true })
  }

  const handleScrollTo = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    e.preventDefault()
    const target = document.getElementById(id)
    if (target) {
      const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
      target.scrollIntoView({ behavior: prefersReducedMotion ? 'instant' : 'smooth' })
      window.history.replaceState(null, '', `#${id}`)
    }
  }

  const tocItems = (t('privacyPolicy.tocItems', { returnObjects: true }) as string[]) || []
  const s1Sub2Items = (t('privacyPolicy.s1Sub2Items', { returnObjects: true }) as string[]) || []
  const s1Sub3Items = (t('privacyPolicy.s1Sub3Items', { returnObjects: true }) as string[]) || []
  const s2Items = (t('privacyPolicy.s2Items', { returnObjects: true }) as string[]) || []
  const s4Items = (t('privacyPolicy.s4Items', { returnObjects: true }) as string[]) || []
  const s5Items = (t('privacyPolicy.s5Items', { returnObjects: true }) as string[]) || []
  const s12UserRightsItems = (t('privacyPolicy.s12Items', { returnObjects: true }) as string[]) || []

  return (
    <div className={styles.page}>
      <div className={`${styles.headerWrapper} ${isScrolled ? styles.headerScrolled : ''}`}>
        <header className={styles.header}>
          <Link to="/" className={styles.logo} aria-label="Liftech Home">
            <img src={logo} alt="" aria-hidden="true" className={styles.logoIcon} />
            <img src={logoName} alt="Liftech" className={styles.logoName} />
          </Link>
          <button
            type="button"
            onClick={handleBack}
            className={styles.backButton}
          >
            {t('privacyPolicy.backButton')}
          </button>
        </header>
      </div>

      <div className={styles.bodyContainer}>
        <aside className={styles.sidebar} aria-label={t('privacyPolicy.metadataLabel')}>
          <div className={styles.metaGroup}>
            <span className={styles.metaLabel}>{t('privacyPolicy.lastUpdateLabel')}</span>
            <span className={styles.metaValue}>{t('privacyPolicy.lastUpdateDate')}</span>
          </div>

          <div className={styles.metaGroup}>
            <span className={styles.metaLabel}>{t('privacyPolicy.companyLabel')}</span>
            <span className={styles.metaValue}>{t('privacyPolicy.companyName')}</span>
          </div>

          <nav className={styles.quickNav} aria-label={t('privacyPolicy.tocTitle')}>
            <p className={styles.quickNavTitle}>{t('privacyPolicy.tocTitle')}</p>
            {tocItems.map((label, idx) => (
              <a
                key={`secao-${idx + 1}`}
                href={`#secao-${idx + 1}`}
                onClick={(e) => handleScrollTo(e, `secao-${idx + 1}`)}
                className={styles.quickNavLink}
              >
                {label}
              </a>
            ))}
          </nav>
        </aside>

        <div className={styles.contentWrapper}>
          <article className={styles.content}>
            <div className={styles.pageHeader}>
              <h1 className={styles.pageTitle}>{t('privacyPolicy.pageTitle')}</h1>
              <p className={styles.lastUpdateNotice}>{t('privacyPolicy.lastUpdateNotice')}</p>
            </div>

            <p className={styles.paragraph}>{t('privacyPolicy.introP1')}</p>
            <p className={styles.paragraph}>{t('privacyPolicy.introP2')}</p>

            {/* 1. Dados coletados */}
            <section id="secao-1" className={styles.section}>
              <h2 className={styles.sectionTitle}>{t('privacyPolicy.s1Title')}</h2>
              <p className={styles.paragraph}>{t('privacyPolicy.s1Intro')}</p>

              <div className={styles.subSection}>
                <h3 className={styles.subSectionTitle}>{t('privacyPolicy.s1Sub1Title')}</h3>
                <p className={styles.paragraph}>{t('privacyPolicy.s1Sub1Text')}</p>
              </div>

              <div className={styles.subSection}>
                <h3 className={styles.subSectionTitle}>{t('privacyPolicy.s1Sub2Title')}</h3>
                <p className={styles.paragraph}>{t('privacyPolicy.s1Sub2Intro')}</p>
                <ul className={styles.list}>
                  {s1Sub2Items.map((item, idx) => (
                    <li key={idx} className={styles.listItem}>{item}</li>
                  ))}
                </ul>
                <p className={styles.paragraph}>{t('privacyPolicy.s1Sub2Outro')}</p>
              </div>

              <div className={styles.subSection}>
                <h3 className={styles.subSectionTitle}>{t('privacyPolicy.s1Sub3Title')}</h3>
                <p className={styles.paragraph}>{t('privacyPolicy.s1Sub3Intro')}</p>
                <ul className={styles.list}>
                  {s1Sub3Items.map((item, idx) => (
                    <li key={idx} className={styles.listItem}>{item}</li>
                  ))}
                </ul>
                <p className={styles.paragraph}>{t('privacyPolicy.s1Sub3Outro')}</p>
              </div>
            </section>

            {/* 2. Dados provenientes do hardware */}
            <section id="secao-2" className={styles.section}>
              <h2 className={styles.sectionTitle}>{t('privacyPolicy.s2Title')}</h2>
              <p className={styles.paragraph}>{t('privacyPolicy.s2P1')}</p>
              <p className={styles.paragraph}>{t('privacyPolicy.s2P2')}</p>
              <ul className={styles.list}>
                {s2Items.map((item, idx) => (
                  <li key={idx} className={styles.listItem}>{item}</li>
                ))}
              </ul>
              <p className={styles.paragraph}>{t('privacyPolicy.s2P3')}</p>
              <p className={styles.paragraph}>{t('privacyPolicy.s2P4')}</p>
            </section>

            {/* 3. Histórico de utilização das empilhadeiras */}
            <section id="secao-3" className={styles.section}>
              <h2 className={styles.sectionTitle}>{t('privacyPolicy.s3Title')}</h2>
              <p className={styles.paragraph}>{t('privacyPolicy.s3P1')}</p>
              <p className={styles.paragraph}>{t('privacyPolicy.s3P2')}</p>
              <p className={styles.paragraph}>{t('privacyPolicy.s3P3')}</p>
              <p className={styles.paragraph}>{t('privacyPolicy.s3P4')}</p>
            </section>

            {/* 4. Eventos de segurança e acidentes */}
            <section id="secao-4" className={styles.section}>
              <h2 className={styles.sectionTitle}>{t('privacyPolicy.s4Title')}</h2>
              <p className={styles.paragraph}>{t('privacyPolicy.s4P1')}</p>
              <p className={styles.paragraph}>{t('privacyPolicy.s4P2')}</p>
              <ul className={styles.list}>
                {s4Items.map((item, idx) => (
                  <li key={idx} className={styles.listItem}>{item}</li>
                ))}
              </ul>
              <p className={styles.paragraph}>{t('privacyPolicy.s4P3')}</p>
              <div className={styles.severityList}>
                <p className={styles.severityItem}>{t('privacyPolicy.s4Severities.medium')}</p>
                <p className={styles.severityItem}>{t('privacyPolicy.s4Severities.high')}</p>
                <p className={styles.severityItem}>{t('privacyPolicy.s4Severities.critical')}</p>
              </div>
              <p className={styles.paragraph}>{t('privacyPolicy.s4P4')}</p>
              <p className={styles.paragraph}>{t('privacyPolicy.s4P5')}</p>
            </section>

            {/* 5. Finalidade do tratamento dos dados */}
            <section id="secao-5" className={styles.section}>
              <h2 className={styles.sectionTitle}>{t('privacyPolicy.s5Title')}</h2>
              <p className={styles.paragraph}>{t('privacyPolicy.s5Intro')}</p>
              <ul className={styles.list}>
                {s5Items.map((item, idx) => (
                  <li key={idx} className={styles.listItem}>{item}</li>
                ))}
              </ul>
              <p className={styles.paragraph}>{t('privacyPolicy.s5Outro')}</p>
            </section>

            {/* 6. Acesso às informações */}
            <section id="secao-6" className={styles.section}>
              <h2 className={styles.sectionTitle}>{t('privacyPolicy.s6Title')}</h2>
              <p className={styles.paragraph}>{t('privacyPolicy.s6Intro')}</p>

              <div className={styles.subSection}>
                <h3 className={styles.subSectionTitle}>{t('privacyPolicy.s6AdminTitle')}</h3>
                <p className={styles.paragraph}>{t('privacyPolicy.s6AdminText')}</p>
              </div>

              <div className={styles.subSection}>
                <h3 className={styles.subSectionTitle}>{t('privacyPolicy.s6EmployeeTitle')}</h3>
                <p className={styles.paragraph}>{t('privacyPolicy.s6EmployeeText')}</p>
              </div>
            </section>

            {/* 7. Compartilhamento de dados */}
            <section id="secao-7" className={styles.section}>
              <h2 className={styles.sectionTitle}>{t('privacyPolicy.s7Title')}</h2>
              <p className={styles.paragraph}>{t('privacyPolicy.s7P1')}</p>
              <p className={styles.paragraph}>{t('privacyPolicy.s7P2')}</p>
              <p className={styles.paragraph}>{t('privacyPolicy.s7P3')}</p>
            </section>

            {/* 8. Armazenamento e retenção */}
            <section id="secao-8" className={styles.section}>
              <h2 className={styles.sectionTitle}>{t('privacyPolicy.s8Title')}</h2>
              <p className={styles.paragraph}>{t('privacyPolicy.s8P1')}</p>
              <p className={styles.paragraph}>{t('privacyPolicy.s8P2')}</p>
              <p className={styles.paragraph}>{t('privacyPolicy.s8P3')}</p>
            </section>

            {/* 9. Segurança */}
            <section id="secao-9" className={styles.section}>
              <h2 className={styles.sectionTitle}>{t('privacyPolicy.s9Title')}</h2>
              <p className={styles.paragraph}>{t('privacyPolicy.s9P1')}</p>
              <p className={styles.paragraph}>{t('privacyPolicy.s9P2')}</p>
              <p className={styles.paragraph}>{t('privacyPolicy.s9P3')}</p>
            </section>

            {/* 10. Senhas e credenciais */}
            <section id="secao-10" className={styles.section}>
              <h2 className={styles.sectionTitle}>{t('privacyPolicy.s10Title')}</h2>
              <p className={styles.paragraph}>{t('privacyPolicy.s10P1')}</p>
              <p className={styles.paragraph}>{t('privacyPolicy.s10P2')}</p>
              <p className={styles.paragraph}>{t('privacyPolicy.s10P3')}</p>
            </section>

            {/* 11. Cookies e tecnologias semelhantes */}
            <section id="secao-11" className={styles.section}>
              <h2 className={styles.sectionTitle}>{t('privacyPolicy.s11SecTitle')}</h2>
              <p className={styles.paragraph}>{t('privacyPolicy.s11P1')}</p>
              <p className={styles.paragraph}>{t('privacyPolicy.s11P2')}</p>
            </section>

            {/* 12. Direitos dos usuários */}
            <section id="secao-12" className={styles.section}>
              <h2 className={styles.sectionTitle}>{t('privacyPolicy.s12Title')}</h2>
              <p className={styles.paragraph}>{t('privacyPolicy.s12P1')}</p>
              <p className={styles.paragraph}>{t('privacyPolicy.s12P2')}</p>
              <ul className={styles.list}>
                {s12UserRightsItems.map((item, idx) => (
                  <li key={idx} className={styles.listItem}>{item}</li>
                ))}
              </ul>
              <p className={styles.paragraph}>{t('privacyPolicy.s12P3')}</p>
            </section>

            {/* 13. Privacidade dos colaboradores */}
            <section id="secao-13" className={styles.section}>
              <h2 className={styles.sectionTitle}>{t('privacyPolicy.s13Title')}</h2>
              <p className={styles.paragraph}>{t('privacyPolicy.s13P1')}</p>
              <p className={styles.paragraph}>{t('privacyPolicy.s13P2')}</p>
              <p className={styles.paragraph}>{t('privacyPolicy.s13P3')}</p>
              <p className={styles.paragraph}>{t('privacyPolicy.s13P4')}</p>
            </section>

            {/* 14. Alterações nesta Política de Privacidade */}
            <section id="secao-14" className={styles.section}>
              <h2 className={styles.sectionTitle}>{t('privacyPolicy.s14Title')}</h2>
              <p className={styles.paragraph}>{t('privacyPolicy.s14P1')}</p>
              <p className={styles.paragraph}>{t('privacyPolicy.s14P2')}</p>
              <p className={styles.paragraph}>{t('privacyPolicy.s14P3')}</p>
            </section>

            {/* 15. Contato */}
            <section id="secao-15" className={styles.section}>
              <h2 className={styles.sectionTitle}>{t('privacyPolicy.s15Title')}</h2>
              <p className={styles.paragraph}>{t('privacyPolicy.s15P1')}</p>
            </section>

            <hr className={styles.divider} />

            <footer className={styles.footerSection}>
              <p className={styles.footerBrand}>{t('privacyPolicy.footerBrand')}</p>
              <p className={styles.footerDesc}>{t('privacyPolicy.footerDesc')}</p>
            </footer>
          </article>
        </div>
      </div>
    </div>
  )
}

export default PoliticaPrivacidadePage
