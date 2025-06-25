import { useState } from 'react'

interface Question {
  id: number
  question: string
  options: string[]
  correct_answer: number
  explanation: string
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

interface ResultsProps {
  result: QuizResult
  questions: Question[]
  onViewAnswers: () => void
  onRetakeQuiz: () => void
}

const Results: React.FC<ResultsProps> = ({ 
  result, 
  questions, 
  onViewAnswers, 
  onRetakeQuiz 
}) => {
  const [showDetailedAnswers, setShowDetailedAnswers] = useState(false)

  const getScoreColor = (accuracy: number) => {
    if (accuracy >= 80) return 'text-green-600'
    if (accuracy >= 60) return 'text-orange-600'
    return 'text-red-600'
  }

  const getScoreMessage = (accuracy: number) => {
    if (accuracy >= 90) return '优秀！您对糖尿病知识掌握得很好！'
    if (accuracy >= 80) return '良好！继续保持，加强学习！'
    if (accuracy >= 60) return '及格！建议您多了解糖尿病相关知识。'
    return '需要加强！建议您系统学习糖尿病知识。'
  }

  const handleViewDetailedAnswers = () => {
    setShowDetailedAnswers(true)
    onViewAnswers()
  }

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString('zh-CN')
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* 成绩卡片 */}
      <div className="bg-white rounded-xl border border-gray-200 p-8 mb-6">
        <div className="text-center">
          <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-10 h-10 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          
          <h2 className="text-2xl font-bold text-gray-900 mb-2">答题完成</h2>
          <p className="text-gray-600 mb-6">感谢您参与糖尿病基础知识测试</p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="text-sm text-gray-600 mb-1">姓名</div>
              <div className="text-lg font-medium text-gray-900">{result.name}</div>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="text-sm text-gray-600 mb-1">得分</div>
              <div className={`text-2xl font-bold ${getScoreColor(result.accuracy)}`}>
                {result.score} / {questions.length}
              </div>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="text-sm text-gray-600 mb-1">正确率</div>
              <div className={`text-2xl font-bold ${getScoreColor(result.accuracy)}`}>
                {result.accuracy}%
              </div>
            </div>
          </div>

          <div className={`text-lg font-medium mb-6 ${getScoreColor(result.accuracy)}`}>
            {getScoreMessage(result.accuracy)}
          </div>

          <div className="text-sm text-gray-500 mb-6">
            完成时间：{formatDate(result.timestamp)}
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            {!showDetailedAnswers && (
              <button
                onClick={handleViewDetailedAnswers}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
              >
                查看详细答案
              </button>
            )}
            <button
              onClick={onRetakeQuiz}
              className="px-6 py-3 border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
            >
              重新答题
            </button>
          </div>

          {showDetailedAnswers && (
            <div className="mt-4 p-3 bg-orange-50 border border-orange-200 rounded-lg">
              <p className="text-sm text-orange-700">
                ⚠️ 您已查看详细答案，之后将无法再次参与答题。
              </p>
            </div>
          )}
        </div>
      </div>

      {/* 详细答案 */}
      {showDetailedAnswers && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-6">详细答案解析</h3>
          
          <div className="space-y-6">
            {questions.map((question, index) => {
              const userAnswer = result.answers[index]
              const isCorrect = userAnswer === question.correct_answer
              
              return (
                <div key={question.id} className="border-b border-gray-200 pb-6">
                  <div className="flex items-start gap-3 mb-4">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-sm font-medium ${
                      isCorrect ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                    }`}>
                      {isCorrect ? '✓' : '✗'}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900 mb-2">
                        第 {index + 1} 题：{question.question}
                      </h4>
                    </div>
                  </div>

                  <div className="ml-9 space-y-2 mb-4">
                    {question.options.map((option, optionIndex) => {
                      const isUserAnswer = userAnswer === optionIndex
                      const isCorrectAnswer = optionIndex === question.correct_answer
                      
                      return (
                        <div
                          key={optionIndex}
                          className={`p-3 rounded-lg border ${
                            isCorrectAnswer
                              ? 'border-green-500 bg-green-50'
                              : isUserAnswer && !isCorrectAnswer
                              ? 'border-red-500 bg-red-50'
                              : 'border-gray-200'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-gray-700">
                              {String.fromCharCode(65 + optionIndex)}.
                            </span>
                            <span className="text-gray-900">{option}</span>
                            {isCorrectAnswer && (
                              <span className="text-green-600 font-medium ml-auto">正确答案</span>
                            )}
                            {isUserAnswer && !isCorrectAnswer && (
                              <span className="text-red-600 font-medium ml-auto">您的答案</span>
                            )}
                            {userAnswer === -1 && isCorrectAnswer && (
                              <span className="text-orange-600 font-medium ml-auto">未作答</span>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>

                  <div className="ml-9 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <h5 className="font-medium text-blue-900 mb-2">答案解析</h5>
                    <p className="text-blue-800 text-sm leading-relaxed">
                      {question.explanation}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

export default Results
