import { jsPDF } from 'jspdf'

const COLORS = {
  navy: [12, 35, 64],
  blue: [29, 95, 166],
  ink: [26, 36, 51],
  slate: [91, 102, 117],
  line: [227, 232, 239],
}

const MARGIN = 54 // 0.75in in points
const PAGE_WIDTH = 612 // Letter, points
const PAGE_HEIGHT = 792
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2

export function generateReportPdf(analysis) {
  const doc = new jsPDF({ unit: 'pt', format: 'letter' })
  let y = MARGIN

  function checkPageBreak(needed) {
    if (y + needed > PAGE_HEIGHT - MARGIN) {
      doc.addPage()
      y = MARGIN
    }
  }

  function setColor(rgb) {
    doc.setTextColor(rgb[0], rgb[1], rgb[2])
  }

  function heading(text, size = 11) {
    checkPageBreak(24)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(size)
    setColor(COLORS.navy)
    doc.text(text, MARGIN, y)
    y += size + 6
  }

  function paragraph(text, { size = 10, color = COLORS.slate, gap = 14, indent = 0 } = {}) {
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(size)
    setColor(color)
    const lines = doc.splitTextToSize(text, CONTENT_WIDTH - indent)
    for (const line of lines) {
      checkPageBreak(gap)
      doc.text(line, MARGIN + indent, y)
      y += gap
    }
  }

  function bulletList(items, renderItem) {
    for (const item of items) {
      const text = renderItem(item)
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(10)
      setColor(COLORS.slate)
      const lines = doc.splitTextToSize(text, CONTENT_WIDTH - 14)
      checkPageBreak(14)
      doc.text('•', MARGIN, y)
      lines.forEach((line, i) => {
        checkPageBreak(14)
        doc.text(line, MARGIN + 14, y)
        if (i < lines.length - 1) y += 14
      })
      y += 14
    }
  }

  function divider() {
    checkPageBreak(16)
    doc.setDrawColor(...COLORS.line)
    doc.line(MARGIN, y, PAGE_WIDTH - MARGIN, y)
    y += 20
  }

  // Cover
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(16)
  setColor(COLORS.navy)
  doc.text('Coverage Compass Review', PAGE_WIDTH / 2, y, { align: 'center' })
  y += 24
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  setColor(COLORS.slate)
  const coverLines = [
    ...(analysis.namedInsured ? [`Prepared for: ${analysis.namedInsured}`] : []),
    `Document reviewed: ${analysis.fileName}`,
    `Report Generated: ${analysis.analyzedAt}`,
  ]
  for (const line of coverLines) {
    doc.text(line, PAGE_WIDTH / 2, y, { align: 'center' })
    y += 14
  }
  y += 10
  divider()

  // 1. Score
  heading('1. Overall Coverage Score')
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(22)
  setColor(COLORS.blue)
  doc.text(`${analysis.coverageScore}/100`, MARGIN, y)
  y += 26
  paragraph(
    "This score is an educational snapshot of your policy across key protection areas. It is not a guarantee of claim outcomes and does not replace a licensed insurance professional's review.",
  )
  y += 6
  divider()

  // 2. Policy Summary table
  heading('2. Policy Summary')
  const colX = { name: MARGIN, limit: MARGIN + 150, explanation: MARGIN + 240 }
  const colWidth = { explanation: CONTENT_WIDTH - 240 }
  checkPageBreak(16)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8)
  setColor(COLORS.slate)
  doc.text('COVERAGE', colX.name, y)
  doc.text('LIMIT', colX.limit, y)
  doc.text('EXPLANATION', colX.explanation, y)
  y += 6
  doc.setDrawColor(...COLORS.line)
  doc.line(MARGIN, y, PAGE_WIDTH - MARGIN, y)
  y += 12
  for (const c of analysis.coverages) {
    // splitTextToSize measures against the document's *current* font/size, so
    // it must be set before each measurement, not just before rendering, or
    // wrapping is computed against whatever font a previous row/section left
    // behind and the rendered (often larger/bolder) text overflows its column.
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(9.5)
    const nameLines = doc.splitTextToSize(c.name, 140)

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9.5)
    const limitLines = doc.splitTextToSize(c.limit, 80)
    const explanationLines = doc.splitTextToSize(c.explanation, colWidth.explanation)

    const maxLines = Math.max(nameLines.length, limitLines.length, explanationLines.length)
    const rowHeight = Math.max(14, maxLines * 12)
    checkPageBreak(rowHeight + 8)

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(9.5)
    setColor(COLORS.ink)
    doc.text(nameLines, colX.name, y)
    doc.setFont('helvetica', 'normal')
    setColor(COLORS.slate)
    doc.text(limitLines, colX.limit, y)
    explanationLines.forEach((line, i) => doc.text(line, colX.explanation, y + i * 12))
    y += rowHeight + 8
    checkPageBreak(1)
    doc.setDrawColor(...COLORS.line)
    doc.line(MARGIN, y - 4, PAGE_WIDTH - MARGIN, y - 4)
  }
  y += 12
  divider()

  // 3. Strengths
  heading('3. Strengths')
  bulletList(analysis.strengths, (s) => s)
  y += 6
  divider()

  // 4. Potential Gaps
  heading('4. Potential Gaps')
  bulletList(analysis.gaps, (g) => `${g.name}: ${g.why}`)
  y += 6
  divider()

  // 5. Questions
  heading('5. Questions to Ask Your Insurance Professional')
  bulletList(analysis.questionsToAsk, (q) => `“${q}”`)
  y += 6
  divider()

  // 6. Next steps
  heading('6. Next Steps')
  const nextSteps = [
    'Review this report alongside your official policy documents.',
    'Bring your questions to a licensed insurance professional.',
    'Revisit Coverage Compass after any policy changes or renewals to generate an updated review.',
  ]
  nextSteps.forEach((step, i) => {
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(10)
    setColor(COLORS.slate)
    const lines = doc.splitTextToSize(step, CONTENT_WIDTH - 16)
    checkPageBreak(14)
    doc.text(`${i + 1}.`, MARGIN, y)
    lines.forEach((line, li) => {
      checkPageBreak(14)
      doc.text(line, MARGIN + 16, y)
      if (li < lines.length - 1) y += 14
    })
    y += 14
  })
  y += 10
  divider()

  // Disclaimer
  paragraph(
    'Coverage Compass is an independent insurance education platform. It is not an insurance company, agency, or broker, and does not sell, bind, cancel, or modify insurance policies. Information provided is educational only and does not constitute insurance, legal, or financial advice. Coverage decisions should be made in consultation with a licensed insurance professional. Coverage Compass does not guarantee the accuracy of AI-generated summaries and recommends verifying all details against your official policy documents.',
    { size: 8, gap: 11 },
  )

  return doc
}
