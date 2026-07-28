// Pure scoring/mapping logic for the Coverage Compass Challenge, split out
// of the Challenge page component so it can be unit tested without a DOM.

export function getChallengeScore(answers) {
  return answers.filter((a) => a?.correct).length
}

// Maps missed questions to their "worth discussing" topic, in question
// order, capped at maxTopics. Never pads with topics from questions that
// were answered correctly or left unanswered.
export function getMissedTopics(questions, answers, maxTopics = 3) {
  return questions
    .filter((_, i) => answers[i] && answers[i].correct === false)
    .map((q) => q.topic)
    .slice(0, maxTopics)
}
