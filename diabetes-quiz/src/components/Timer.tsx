import { useState, useEffect } from 'react'

interface TimerProps {
  timeLimit: number // 时间限制（分钟）
  onTimeUp: () => void
}

const Timer: React.FC<TimerProps> = ({ timeLimit, onTimeUp }) => {
  const [timeLeft, setTimeLeft] = useState(timeLimit * 60) // 转换为秒

  useEffect(() => {
    if (timeLeft <= 0) {
      onTimeUp()
      return
    }

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          onTimeUp()
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [timeLeft, onTimeUp])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const getTimeColor = () => {
    if (timeLeft <= 300) return 'text-red-600' // 最后5分钟红色
    if (timeLeft <= 600) return 'text-orange-600' // 最后10分钟橙色
    return 'text-gray-700'
  }

  const getProgressWidth = () => {
    const totalSeconds = timeLimit * 60
    return (timeLeft / totalSeconds) * 100
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm text-gray-600">剩余时间</span>
        <span className={`text-lg font-mono font-bold ${getTimeColor()}`}>
          {formatTime(timeLeft)}
        </span>
      </div>
      
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div 
          className={`h-2 rounded-full transition-all duration-1000 ${
            timeLeft <= 300 ? 'bg-red-500' : 
            timeLeft <= 600 ? 'bg-orange-500' : 
            'bg-blue-500'
          }`}
          style={{ width: `${getProgressWidth()}%` }}
        />
      </div>
      
      {timeLeft <= 300 && (
        <p className="text-xs text-red-600 mt-2">
          ⚠️ 时间即将结束，请尽快完成答题
        </p>
      )}
    </div>
  )
}

export default Timer
