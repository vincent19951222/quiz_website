import { useState, useEffect } from 'react'
import UserForm from './components/UserForm'
import Quiz from './components/Quiz'
import Results from './components/Results'
import AdminPanel from './components/AdminPanel'
import { uploadToFeishu, type QuizRecord } from './utils/feishu'

interface User {
  name: string
  phone: string
}

interface QuizData {
  title: string
  description: string
  time_limit: number
  total_questions: number
  questions: Question[]
}

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

type AppState = 'userForm' | 'quiz' | 'results' | 'admin'

function App() {
  const [currentState, setCurrentState] = useState<AppState>('userForm')
  const [user, setUser] = useState<User | null>(null)
  const [quizData, setQuizData] = useState<QuizData | null>(null)
  const [currentResult, setCurrentResult] = useState<QuizResult | null>(null)
  const [showAdmin, setShowAdmin] = useState(false)

  useEffect(() => {
    // 加载题目数据
    fetch('/quiz_questions.json')
      .then(response => response.json())
      .then(data => setQuizData(data))
      .catch(error => console.error('Error loading quiz data:', error))
  }, [])

  const handleUserSubmit = (userData: User) => {
    // 检查用户是否已经查看过答案
    const hasViewedAnswers = localStorage.getItem(`viewed_answers_${userData.phone}`) === 'true'
    
    if (hasViewedAnswers) {
      alert('您已查看过答案，无法再次答题。')
      return
    }

    setUser(userData)
    setCurrentState('quiz')
  }

  const handleQuizComplete = async (result: QuizResult) => {
    // 保存答题记录到localStorage（本地备份）
    const existingRecords = JSON.parse(localStorage.getItem('quiz_records') || '[]')
    existingRecords.push(result)
    localStorage.setItem('quiz_records', JSON.stringify(existingRecords))
    
    // 准备飞书上传数据
    if (quizData && user) {
      const feishuRecord: QuizRecord = {
        name: result.name,
        phone: result.phone,
        score: result.score,
        correctRate: result.accuracy,
        wrongCount: quizData.questions.length - Math.round((result.accuracy / 100) * quizData.questions.length),
        timeUsed: calculateTimeUsed(result.timestamp),
        startTime: new Date(result.timestamp - (quizData.time_limit * 60 * 1000)).toLocaleString('zh-CN'),
        endTime: new Date(result.timestamp).toLocaleString('zh-CN'),
        answers: result.answers.map((userAnswer, index) => ({
          question: quizData.questions[index]?.question || '',
          userAnswer: quizData.questions[index]?.options[userAnswer] || '未选择',
          correctAnswer: quizData.questions[index]?.options[quizData.questions[index].correct_answer] || '',
          isCorrect: userAnswer === quizData.questions[index]?.correct_answer
        })),
        ipAddress: await getClientIP(),
        userAgent: navigator.userAgent
      }
      
      // 异步上传到飞书（不阻塞用户界面）
      uploadToFeishu(feishuRecord).then(success => {
        if (success) {
          console.log('答题记录已成功同步到飞书多维表格')
        } else {
          console.log('飞书同步失败，记录已保存在本地')
        }
      }).catch(error => {
        console.error('飞书上传出错:', error)
      })
    }
    
    setCurrentResult(result)
    setCurrentState('results')
  }
  
  /**
   * 计算答题用时
   * @param endTimestamp 结束时间戳
   * @returns 格式化的用时字符串
   */
  const calculateTimeUsed = (endTimestamp: number): string => {
    if (!quizData) return '未知'
    
    const startTime = endTimestamp - (quizData.time_limit * 60 * 1000)
    const timeUsedMs = endTimestamp - startTime
    const minutes = Math.floor(timeUsedMs / 60000)
    const seconds = Math.floor((timeUsedMs % 60000) / 1000)
    
    return `${minutes}分${seconds}秒`
  }
  
  /**
   * 获取客户端IP地址（简化版）
   * @returns Promise<string> IP地址
   */
  const getClientIP = async (): Promise<string> => {
    try {
      // 这里可以调用IP查询服务，暂时返回本地标识
      return 'Local Network'
    } catch {
      return '未知'
    }
  }

  const handleViewAnswers = () => {
    if (user && currentResult) {
      // 标记用户已查看答案
      localStorage.setItem(`viewed_answers_${user.phone}`, 'true')
      
      // 更新记录中的hasViewedAnswers状态
      const existingRecords = JSON.parse(localStorage.getItem('quiz_records') || '[]')
      const updatedRecords = existingRecords.map((record: QuizResult) => 
        record.userId === currentResult.userId 
          ? { ...record, hasViewedAnswers: true }
          : record
      )
      localStorage.setItem('quiz_records', JSON.stringify(updatedRecords))
    }
  }

  const handleRetakeQuiz = () => {
    setCurrentState('userForm')
    setUser(null)
    setCurrentResult(null)
  }

  const handleShowAdmin = () => {
    const password = prompt('请输入管理员密码:')
    if (password === 'admin') {
      setShowAdmin(true)
      setCurrentState('admin')
    } else {
      alert('密码错误')
    }
  }

  const handleBackToQuiz = () => {
    setShowAdmin(false)
    setCurrentState('userForm')
  }

  if (!quizData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">加载题目数据中...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{quizData.title}</h1>
            <p className="text-gray-600 text-sm mt-1">{quizData.description}</p>
          </div>
          <button
            onClick={handleShowAdmin}
            className="px-4 py-2 text-sm text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
          >
            管理员
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 py-8">
        {currentState === 'userForm' && (
          <UserForm onSubmit={handleUserSubmit} />
        )}
        
        {currentState === 'quiz' && user && (
          <Quiz
            questions={quizData.questions}
            timeLimit={quizData.time_limit}
            user={user}
            onComplete={handleQuizComplete}
          />
        )}
        
        {currentState === 'results' && currentResult && quizData && (
          <Results
            result={currentResult}
            questions={quizData.questions}
            onViewAnswers={handleViewAnswers}
            onRetakeQuiz={handleRetakeQuiz}
          />
        )}
        
        {currentState === 'admin' && showAdmin && (
          <AdminPanel onBack={handleBackToQuiz} />
        )}
      </main>
    </div>
  )
}

export default App
