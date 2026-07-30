import { useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { usePolicy } from '../context/PolicyContext.jsx'
import { analyzeText } from '../lib/policyAnalysis.js'
import { extractTextFromPdf } from '../lib/pdfText.js'
import { localePath } from '../utils/localeRouting.js'

const MAX_FILE_SIZE_BYTES = 15 * 1024 * 1024 // 15MB, generous for a declarations page/policy PDF

export default function Upload() {
  const { t } = useTranslation('common')
  const [state, setState] = useState('idle') // idle | reading | scanning | done | error
  const [fileName, setFileName] = useState('')
  const [errorMsg, setErrorMsg] = useState('')
  const inputRef = useRef(null)
  const navigate = useNavigate()
  const { lang } = useParams()
  const { setAnalysis, addToHistory } = usePolicy()

  async function handleFile(file) {
    if (!file) return
    // The dropzone stays mounted (and droppable) across every state, so a
    // second drop while the first file is still reading/scanning would
    // otherwise race it: two concurrent analyses writing to the same
    // PolicyContext state, with whichever resolves last silently winning.
    if (state === 'reading' || state === 'scanning') return
    setFileName(file.name)
    setErrorMsg('')
    setState('reading')

    if (file.size > MAX_FILE_SIZE_BYTES) {
      setErrorMsg(
        `That file is too large for this prototype to read in the browser (${Math.round(
          file.size / (1024 * 1024),
        )}MB, 15MB max). Try a smaller file, like a declarations page instead of a full policy.`,
      )
      setState('error')
      return
    }

    try {
      let text = ''
      let truncated = false

      if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) {
        ;({ text, truncated } = await extractTextFromPdf(file))
      } else if (file.type.startsWith('text/') || file.name.toLowerCase().endsWith('.txt')) {
        text = await file.text()
      } else if (file.type.startsWith('image/')) {
        // No OCR in this prototype, fall through to the mocked scanning step
        // with a note rather than fabricating extracted text.
        text = ''
      } else {
        setErrorMsg(
          "That file type isn't supported in this prototype. Try a text-based PDF, a plain .txt file, or a JPG/PNG image.",
        )
        setState('error')
        return
      }

      setState('scanning')

      // Small delay so the scanning state is visible, this also stands in
      // for where a real OCR/extraction API call would happen for images.
      await new Promise((resolve) => setTimeout(resolve, 900))

      const analysis = analyzeText(text, { fileName: file.name, truncated })
      setAnalysis(analysis)
      addToHistory(analysis)
      setState('done')
    } catch (err) {
      console.error(err)
      setErrorMsg(
        "We couldn't read that file in the browser. Try a text-based PDF, or a plain .txt file for this prototype.",
      )
      setState('error')
    }
  }

  function onDrop(e) {
    e.preventDefault()
    const files = e.dataTransfer.files
    if (files && files.length > 1) {
      setFileName('')
      setErrorMsg('Drop just one file at a time, we can only review a single policy document per upload.')
      setState('error')
      return
    }
    handleFile(files?.[0])
  }

  return (
    <div className="mx-auto max-w-2xl px-6 py-16">
      <h1 className="font-display text-2xl font-semibold text-compass-heading">
        {t('buttons.uploadYourPolicy')}
      </h1>
      <p className="mt-2 text-sm text-compass-slate">
        Drop in a declarations page, ACORD form, or full policy, auto, homeowners,
        renters, general liability, workers' compensation, or a trucking/motor
        carrier policy. The reviewer detects which line of business it's looking at
        and adjusts the review accordingly. PDF or text file works best in this
        prototype.
      </p>

      <div
        className="mt-8 flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-compass-line bg-compass-paper px-6 py-16 text-center transition hover:border-compass-blue"
        onDragOver={(e) => e.preventDefault()}
        onDrop={onDrop}
      >
        {state === 'idle' && (
          <>
            <UploadIcon />
            <p className="mt-4 text-sm font-medium text-compass-ink">
              Drag and drop your file here
            </p>
            <p className="mt-1 text-xs text-compass-slate">PDF, TXT, JPG, or PNG</p>
            <button
              type="button"
              className="btn-secondary mt-5"
              onClick={() => inputRef.current?.click()}
            >
              {t('buttons.chooseFile')}
            </button>
            <input
              ref={inputRef}
              type="file"
              accept=".pdf,.txt,image/*"
              className="hidden"
              onChange={(e) => handleFile(e.target.files?.[0])}
            />
          </>
        )}

        {state === 'reading' && (
          <>
            <p className="text-sm font-medium text-compass-ink">
              Reading {fileName}...
            </p>
            <div className="relative mt-4 h-2 w-56 overflow-hidden rounded-full bg-compass-line">
              <div className="progress-indeterminate" />
            </div>
          </>
        )}

        {state === 'scanning' && (
          <>
            <ScanIcon />
            <p className="mt-4 text-sm font-medium text-compass-ink">
              Got it. Reviewing your policy now, this usually takes under a minute.
            </p>
          </>
        )}

        {state === 'done' && (
          <>
            <CheckIcon />
            <p className="mt-4 text-sm font-medium text-compass-ink">
              {fileName} reviewed. Your summary is ready.
            </p>
            <button
              type="button"
              className="btn-primary mt-5"
              onClick={() => navigate(localePath(lang, '/ai-review'))}
            >
              See Your Policy Review
            </button>
          </>
        )}

        {state === 'error' && (
          <div role="alert">
            <p className="text-sm font-medium text-compass-ink">
              Something went wrong reading that file
            </p>
            <p className="mt-2 max-w-sm text-xs text-compass-slate">{errorMsg}</p>
            <button
              type="button"
              className="btn-secondary mt-4"
              onClick={() => setState('idle')}
            >
              Try again
            </button>
          </div>
        )}
      </div>

      <p className="mt-4 text-center text-xs text-compass-slate">
        Never sold or shared. Not affiliated with any single carrier. This
        prototype reads your file entirely in your browser, nothing is uploaded to a
        server. Your review is saved locally in this browser, not encrypted.
      </p>
    </div>
  )
}

function UploadIcon() {
  return (
    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" aria-hidden="true" className="text-compass-link">
      <path
        d="M12 16V4m0 0L7 9m5-5l5 5M5 20h14"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function ScanIcon() {
  return (
    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" aria-hidden="true" className="animate-pulse text-compass-link">
      <rect x="4" y="3" width="16" height="18" rx="2" stroke="currentColor" strokeWidth="1.6" />
      <path d="M8 8h8M8 12h8M8 16h5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  )
}

function CheckIcon() {
  return (
    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" aria-hidden="true" className="text-compass-green">
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.6" />
      <path d="M8 12l3 3 5-6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
