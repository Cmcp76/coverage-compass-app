// Required guardrail component: wrap any screen or section that displays
// translated insurance/legal content (glossary, gap report, professional
// report, policy summaries, educational articles) with this disclaimer.
//
// Rule this enforces: Coverage Compass NEVER presents a translated version
// of an uploaded policy as an official replacement for the original
// document. The original-language document is always the authoritative
// source — translations here are for comprehension only.
//
// Usage:
//   <TranslationDisclaimer />                     // standard footer note
//   <TranslationDisclaimer variant="policy" />     // stronger wording for
//                                                   // anything derived from
//                                                   // an uploaded policy

import { useTranslation } from 'react-i18next'

const COPY = {
  en: {
    standard:
      'This content has been translated for convenience. In the event of any difference in meaning, the English version is authoritative.',
    policy:
      'This is a plain-language translation of information extracted from your policy, provided for educational understanding only. It is not a certified translation and is not a substitute for your official policy document, which remains the legally controlling version in its original language. Always verify coverage details against your original policy.',
  },
  es: {
    standard:
      'Este contenido ha sido traducido por conveniencia. En caso de cualquier diferencia de significado, la versión en inglés prevalece.',
    policy:
      'Esta es una traducción en lenguaje sencillo de la información extraída de tu póliza, proporcionada únicamente para fines de comprensión educativa. No es una traducción certificada y no sustituye tu documento oficial de póliza, que sigue siendo la versión legalmente vinculante en su idioma original. Siempre verifica los detalles de cobertura con tu póliza original.',
  },
}

export default function TranslationDisclaimer({ variant = 'standard', className = '' }) {
  const { i18n } = useTranslation()
  const lang = i18n.language in COPY ? i18n.language : 'en'

  // Only show the disclaimer when the active language isn't the document's
  // authoritative language (English policies, in this build). Adjust if you
  // support non-English source documents.
  if (lang === 'en') return null

  return (
    <p
      role="note"
      className={`rounded-lg border border-compass-line bg-compass-skyblue/40 px-4 py-2.5 text-xs leading-relaxed text-compass-slate ${className}`}
    >
      {COPY[lang][variant]}
    </p>
  )
}
