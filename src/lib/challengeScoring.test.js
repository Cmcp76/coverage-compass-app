import { describe, expect, it } from 'vitest'
import { getChallengeScore, getMissedTopics } from './challengeScoring.js'
import { challengeQuestions } from '../data/challengeQuiz.js'

const mockQuestions = [
  { topic: 'Topic 1' },
  { topic: 'Topic 2' },
  { topic: 'Topic 3' },
  { topic: 'Topic 4' },
  { topic: 'Topic 5' },
]

describe('getChallengeScore', () => {
  it('counts only answers marked correct', () => {
    const answers = [{ correct: true }, { correct: false }, { correct: true }]
    expect(getChallengeScore(answers)).toBe(2)
  })

  it('returns 0 for an empty answers array', () => {
    expect(getChallengeScore([])).toBe(0)
  })

  it('treats unanswered (undefined) slots as not correct', () => {
    const answers = [{ correct: true }, undefined, { correct: true }]
    expect(getChallengeScore(answers)).toBe(2)
  })
})

describe('getMissedTopics', () => {
  it('returns the topic only for questions answered incorrectly', () => {
    const answers = [{ correct: true }, { correct: false }, { correct: true }]
    expect(getMissedTopics(mockQuestions, answers)).toEqual(['Topic 2'])
  })

  it('returns topics in question order, not answer order', () => {
    const answers = [{ correct: false }, { correct: true }, { correct: false }]
    expect(getMissedTopics(mockQuestions, answers)).toEqual(['Topic 1', 'Topic 3'])
  })

  it('returns an empty array when nothing was missed', () => {
    const answers = [{ correct: true }, { correct: true }, { correct: true }]
    expect(getMissedTopics(mockQuestions, answers)).toEqual([])
  })

  it('returns an empty array when no questions have been answered yet', () => {
    expect(getMissedTopics(mockQuestions, [])).toEqual([])
  })

  it('does not surface a topic for an unanswered question', () => {
    // Regression: a question the user hasn't reached yet (answers[i] is
    // undefined) must never be treated as "missed."
    const answers = [{ correct: false }, undefined, { correct: false }]
    expect(getMissedTopics(mockQuestions, answers)).toEqual(['Topic 1', 'Topic 3'])
  })

  it('caps the result at maxTopics even if more were missed, never padding', () => {
    const answers = [
      { correct: false },
      { correct: false },
      { correct: false },
      { correct: false },
      { correct: false },
    ]
    const result = getMissedTopics(mockQuestions, answers, 3)
    expect(result).toEqual(['Topic 1', 'Topic 2', 'Topic 3'])
    expect(result.length).toBeLessThanOrEqual(3)
  })

  it('defaults maxTopics to 3', () => {
    const answers = mockQuestions.map(() => ({ correct: false }))
    expect(getMissedTopics(mockQuestions, answers)).toHaveLength(3)
  })
})

describe('getMissedTopics against the real quiz data', () => {
  it('maps a missed Q3/Q5/Q6 to the exact topics named in the build brief example', () => {
    // The quiz copy doc's results-screen mockup gives these three example
    // bullets verbatim; pin the mapping so a reorder of challengeQuestions
    // can't silently break it.
    const answers = challengeQuestions.map((q, i) =>
      [2, 4, 5].includes(i) ? { correct: false } : { correct: true },
    )
    expect(getMissedTopics(challengeQuestions, answers)).toEqual([
      'Replacement Cost vs. Actual Cash Value on your home',
      'Whether an umbrella policy fits your situation',
      'Rental reimbursement on your auto policy',
    ])
  })

  it('has exactly 10 questions, each with a non-empty topic', () => {
    expect(challengeQuestions).toHaveLength(10)
    for (const q of challengeQuestions) {
      expect(q.topic).toBeTruthy()
      expect(q.options).toHaveLength(4)
      expect(q.correctIndex).toBeGreaterThanOrEqual(0)
      expect(q.correctIndex).toBeLessThan(4)
    }
  })
})
