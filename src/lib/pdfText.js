// Extracts plain text from a PDF file entirely in the browser using
// pdfjs-dist. No file is sent to a server, consistent with the prototype's
// "sample/demo data only, no real backend" guardrail, this just reads the
// file the person already has open in their own browser tab.

let pdfjsLibPromise = null

async function loadPdfjs() {
  if (!pdfjsLibPromise) {
    pdfjsLibPromise = import('pdfjs-dist').then((lib) => {
      lib.GlobalWorkerOptions.workerSrc =
        'https://unpkg.com/pdfjs-dist@4.6.82/build/pdf.worker.min.mjs'
      return lib
    })
  }
  return pdfjsLibPromise
}

export async function extractTextFromPdf(file) {
  const pdfjsLib = await loadPdfjs()
  const arrayBuffer = await file.arrayBuffer()
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise

  let fullText = ''
  const pageCount = Math.min(pdf.numPages, 20) // cap for a prototype
  for (let i = 1; i <= pageCount; i += 1) {
    const page = await pdf.getPage(i)
    const content = await page.getTextContent()
    fullText += content.items.map((item) => item.str).join(' ') + '\n'
  }
  return fullText
}
