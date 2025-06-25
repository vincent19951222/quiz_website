import { useState, useEffect } from 'react'
import Timer from './Timer'

interface Question {
  id: number
  question: string
  options: string[]
  correct_answer: number
  explanation: string
}

interface User {
  name: string
  phone: string
}

interface QuizResult {
  userId: string
  name: string
  phone: string
  score: number
  accuracy: number
  timestamp: number
  hasViewedAnswers: boolean
  answers: number[]
}

interface QuizProps {
  questions: Question[]
  timeLimit: number
  user: User
  onComplete: (result: QuizResult) => void
}

const Quiz: React.FC<QuizProps> = ({ questions, timeLimit, user, onComplete }) => {
  const [shuffledQuestions, setShuffledQuestions] = useState<Question[]>([])
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [answers, setAnswers] = useState<number[]>([])
  const [showConfirmSubmit, setShowConfirmSubmit] = useState(false)

  useEffect(() => {
    // 随机化题目顺序
    const shuffled = [...questions].sort(() => Math.random() - 0.5)
    setShuffledQuestions(shuffled)
    setAnswers(new Array(questions.length).fill(-1))
  }, [questions])

  const handleAnswerSelect = (optionIndex: number) => {
    const newAnswers = [...answers]
    newAnswers[currentQuestionIndex] = optionIndex
    setAnswers(newAnswers)
  }

  const handleNext = () => {
    if (currentQuestionIndex < shuffledQuestions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1)
    }
  }

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1)
    }
  }

  const handleQuestionJump = (index: number) => {
    setCurrentQuestionIndex(index)
  }

  const calculateScore = () => {
    let correct = 0
    shuffledQuestions.forEach((question, index) => {
      if (answers[index] === question.correct_answer) {
        correct++
      }
    })
    return correct
  }

  const handleSubmit = () => {
    const score = calculateScore()
    const accuracy = Math.round((score / shuffledQuestions.length) * 100)
    const userId = `${user.phone}_${Date.now()}`
    
    const result: QuizResult = {
      userId,
      name: user.name,
      phone: user.phone,
      score,
      accuracy,
      timestamp: Date.now(),
      hasViewedAnswers: false,
      answers
    }

    onComplete(result)
  }

  const handleTimeUp = () => {
    alert('时间到！系统将自动提交您的答案。')
    handleSubmit()
  }

  const getAnsweredCount = () => {
    return answers.filter(answer => answer !== -1).length
  }

  if (shuffledQuestions.length === 0) {
    return <div className="text-center">加载题目中...</div>
  }

  const currentQuestion = shuffledQuestions[currentQuestionIndex]

  return (
    <div className="max-w-4xl mx-auto">
      {/* 顶部信息栏 */}
      <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="text-sm text-gray-600">
              答题人：<span className="font-medium text-gray-900">{user.name}</span>
            </div>
            <div className="text-sm text-gray-600">
              进度：<span className="font-medium text-gray-900">
                {currentQuestionIndex + 1} / {shuffledQuestions.length}
              </span>
            </div>
            <div className="text-sm text-gray-600">
              已答：<span className="font-medium text-gray-900">
                {getAnsweredCount()} / {shuffledQuestions.length}
              </span>
            </div>
          </div>
          <div className="lg:w-64">
            <Timer timeLimit={timeLimit} onTimeUp={handleTimeUp} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* 题目导航 */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg border border-gray-200 p-4 sticky top-6">
            <h3 className="font-medium text-gray-900 mb-3">题目导航</h3>
            <div className="grid grid-cols-5 lg:grid-cols-5 gap-2">
              {shuffledQuestions.map((_, index) => (
                <button
                  key={index}
                  onClick={() => handleQuestionJump(index)}
                  className={`w-8 h-8 rounded text-sm font-medium transition-colors ${
                    index === currentQuestionIndex
                      ? 'bg-blue-600 text-white'
                      : answers[index] !== -1
                      ? 'bg-green-100 text-green-700 hover:bg-green-200'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {index + 1}
                </button>
              ))}
            </div>
            <div className="mt-4 text-xs text-gray-500">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-3 h-3 bg-blue-600 rounded"></div>
                <span>当前题目</span>
              </div>
              <div className="flex items-center gap-2 mb-1">
                <div className="w-3 h-3 bg-green-100 border border-green-300 rounded"></div>
                <span>已答题目</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-gray-100 border border-gray-300 rounded"></div>
                <span>未答题目</span>
              </div>
            </div>
          </div>
        </div>

        {/* 题目内容 */}
        <div className="lg:col-span-3">
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="mb-6">
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm text-gray-500">
                  第 {currentQuestionIndex + 1} 题
                </span>
                <span className="text-sm text-gray-500">
                  单选题
                </span>
              </div>
              <h2 className="text-lg font-medium text-gray-900 leading-relaxed">
                {currentQuestion.question}
              </h2>
            </div>

            {/* 选项 */}
            <div className="space-y-3 mb-8">
              {currentQuestion.options.map((option, index) => (
                <label
                  key={index}
                  className={`block p-4 border rounded-lg cursor-pointer transition-colors ${
                    answers[currentQuestionIndex] === index
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <input
                      type="radio"
                      name={`question-${currentQuestion.id}`}
                      value={index}
                      checked={answers[currentQuestionIndex] === index}
                      onChange={() => handleAnswerSelect(index)}
                      className="mt-0.5 w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                    />
                    <div className="flex-1">
                      <span className="font-medium text-gray-700 mr-2">
                        {String.fromCharCode(65 + index)}.
                      </span>
                      <span className="text-gray-900">{option}</span>
                    </div>
                  </div>
                </label>
              ))}
            </div>

            {/* 导航按钮 */}
            <div className="flex justify-between items-center">
              <button
                onClick={handlePrevious}
                disabled={currentQuestionIndex === 0}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                上一题
              </button>

              <div className="flex gap-3">
                {currentQuestionIndex === shuffledQuestions.length - 1 ? (
                  <button
                    onClick={() => setShowConfirmSubmit(true)}
                    className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
                  >
                    提交答卷
                  </button>
                ) : (
                  <button
                    onClick={handleNext}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                  >
                    下一题
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 提交确认对话框 */}
      {showConfirmSubmit && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-medium text-gray-900 mb-4">确认提交</h3>
            <p className="text-gray-600 mb-6">
              您已完成 {getAnsweredCount()} / {shuffledQuestions.length} 题。
              {getAnsweredCount() < shuffledQuestions.length && (
                <span className="text-orange-600">
                  <br />还有 {shuffledQuestions.length - getAnsweredCount()} 题未作答，确定要提交吗？
                </span>
              )}
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowConfirmSubmit(false)}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                继续答题
              </button>
              <button
                onClick={handleSubmit}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
              >
                确认提交
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Quiz
