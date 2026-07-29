// Extracts plain text from a PDF file entirely in the browser using
// pdfjs-dist. No file is sent to a server, consistent with the prototype's
// "sample/demo data only, no real backend" guardrail, this just reads the
// file the person already has open in their own browser tab.

import pdfjsWorkerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url'

let pdfjsLibPromise = null

async function loadPdfjs() {
  if (!pdfjsLibPromise) {
    pdfjsLibPromise = import('pdfjs-dist')
      .then((lib) => {
        // Bundled locally rather than fetched from a CDN at runtime, so PDF
        // upload doesn't depend on an external host being reachable, and the
        // worker version can never drift from whatever pdfjs-dist version is
        // actually installed.
        lib.GlobalWorkerOptions.workerSrc = pdfjsWorkerUrl
        return lib
      })
      .catch((err) => {
        // Don't cache a failed import, a transient chunk-load failure would
        // otherwise permanently break PDF upload for the rest of the tab's
        // lifetime, with no way to recover short of a full page reload.
        pdfjsLibPromise = null
        throw err
      })
  }
  return pdfjsLibPromise
}

// pdf.js flags each text item with hasEOL when a line break follows it,
// which is how it reconstructs line breaks lost in the raw text-item
// stream. Joining every item with a plain space (as it used to) collapsed
// every line on a page into one run-on line, which matters because
// policyAnalysis's negation-window logic treats "\n" as a sentence
// boundary specifically to handle tabular/columnar declarations pages
// where lines are separated by breaks rather than periods, exactly the
// case a real PDF upload hits most often. Exported as its own pure
// function so this join logic is testable without needing to mock the
// entire pdf.js document/page/worker pipeline.
export function joinTextItems(items) {
  let text = ''
  for (const item of items) {
    text += (item.str || '') + (item.hasEOL ? '\n' : ' ')
  }
  return text
}

export async function extractTextFromPdf(file) {
  const pdfjsLib = await loadPdfjs()
  const arrayBuffer = await file.arrayBuffer()
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise

  try {
    let fullText = ''
    const pageCount = Math.min(pdf.numPages, 20) // cap for a prototype
    for (let i = 1; i <= pageCount; i += 1) {
      const page = await pdf.getPage(i)
      const content = await page.getTextContent()
      fullText += joinTextItems(content.items) + '\n'
    }
    return fullText
  } finally {
    // Release the worker and retained page/text buffers, otherwise each
    // upload (including retries via Upload.jsx's "Try again") leaks one.
    pdf.destroy()
  }
}
