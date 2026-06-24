
export const QUIZ_CONFIRMATIONS = {
  submitAnswer: {
    variant: "submit",
    title: "Submit your answer?",
    description:
      "Once submitted, this answer is final and cannot be edited or deleted. Take a moment to review before confirming.",
    bullets: [
      "Your answer text will be locked permanently",
      "You can still change the emotion analysis method after submitting",
      "You can share this answer with your therapist later",
    ],
    confirmLabel: "Yes, submit my answer",
    cancelLabel: "I want to review it first",
  },

  shareAnswers: {
    variant: "share",
    title: "Share with your therapist?",
    description:
      "The selected answers will become visible to your therapist. This action cannot be undone.",
    bullets: [
      "Your therapist will see the answer text and emotions you chose",
      "Once shared, you cannot hide these answers again",
      "You can share more answers later if you change your mind",
    ],
    confirmLabel: "Yes, share with my therapist",
    cancelLabel: "Not yet",
  },

  shareAllAnswers: {
    variant: "share",
    title: "Share all answers?",
    description:
      "Every submitted answer in this quiz will become visible to your therapist. This action cannot be undone.",
    bullets: [
      "Your therapist will see all your answers and emotions",
      "Once shared, you cannot hide any of them",
      "Only submitted answers will be shared - drafts are excluded",
    ],
    confirmLabel: "Yes, share everything",
    cancelLabel: "Let me pick specific ones",
  },

  publishQuiz: {
    variant: "submit",
    title: "Publish this quiz?",
    description:
      "Once published, your client will see this quiz on their Daily Quiz page. You won't be able to modify or delete it after publishing.",
    bullets: [
      "The client will be able to see and answer the quiz immediately",
      "You cannot change the questions or deadline after publishing",
      "The quiz will appear until the deadline or until all answers are submitted",
    ],
    confirmLabel: "Yes, publish to client",
    cancelLabel: "Keep as draft",
  },

  deleteQuiz: {
    variant: "delete",
    title: "Delete this quiz?",
    description:
      "This quiz and all its questions will be permanently removed. This cannot be undone.",
    bullets: [
      "Custom questions created with this quiz will remain in your question bank",
      "The client has not seen this quiz (it was never published)",
    ],
    confirmLabel: "Yes, delete quiz",
    cancelLabel: "Keep it",
  },

  deleteQuestion: {
    variant: "delete",
    title: "Delete this question?",
    description:
      "This custom question will be permanently removed from your question bank.",
    bullets: [
      "This won't affect quizzes where this question was already used",
      "Predefined questions cannot be deleted",
    ],
    confirmLabel: "Yes, delete question",
    cancelLabel: "Keep it",
  },
};

export function buildShareConfig(selectedCount, totalSubmitted) {
  if (selectedCount === totalSubmitted) {
    return QUIZ_CONFIRMATIONS.shareAllAnswers;
  }
  return {
    ...QUIZ_CONFIRMATIONS.shareAnswers,
    description:
      `You are about to share ${selectedCount} ${selectedCount === 1 ? "answer" : "answers"} ` +
      `with your therapist. This action cannot be undone.`,
  };
}