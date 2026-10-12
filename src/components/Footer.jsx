import { Link } from 'react-router-dom'
import { useLang } from '../i18n/LangProvider.jsx'
import './Footer.css'

export default function Footer() {
  const { t } = useLang()
  return (
    <footer className="footer">
      <div className="footer__inner">
        <p className="footer__text">
          {t('footer.lead')}{' '}
          <a className="footer__link" href="https://airegulationmap.org" target="_blank" rel="noreferrer">
            {t('footer.aiReg')}
          </a>
          {t('footer.aiReg_lic')}.{' '}
          <a className="footer__link" href="https://oxfordinsights.com/ai-readiness/government-ai-readiness-index-2025/" target="_blank" rel="noreferrer">
            {t('footer.oxford')}
          </a>
          .{' '}
          <a className="footer__link" href="https://www.cepal.org/es/publicaciones/82514-indice-latinoamericano-inteligencia-artificial-ilia-2025" target="_blank" rel="noreferrer">
            {t('footer.ilia')}
          </a>
          . {t('footer.ne_lead')}{' '}
          <a className="footer__link" href="https://www.naturalearthdata.com/" target="_blank" rel="noreferrer">
            {t('footer.ne')}
          </a>
          . {t('footer.tail')}
        </p>
        <nav className="footer__nav">
          <Link className="footer__link" to="/method">{t('footer.method')}</Link>
        </nav>
      </div>
    </footer>
  )
}
