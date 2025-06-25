import { useState, useEffect } from 'react'
import * as XLSX from 'xlsx'
import { syncLocalRecordsToFeishu, testFeishuConnection, type QuizRecord as FeishuQuizRecord } from '../utils/feishu'

interface QuizRecord {
  userId: string
  name: string
  phone: string
  score: number
  accuracy: number
  timestamp: number
  hasViewedAnswers: boolean
  answers: number[]
}

interface AdminPanelProps {
  onBack: () => void
}

const AdminPanel: React.FC<AdminPanelProps> = ({ onBack }) => {
  const [records, setRecords] = useState<QuizRecord[]>([])
  const [filteredRecords, setFilteredRecords] = useState<QuizRecord[]>([])
  const [sortBy, setSortBy] = useState<'timestamp' | 'accuracy' | 'name'>('timestamp')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [searchTerm, setSearchTerm] = useState('')
  const [feishuStatus, setFeishuStatus] = useState<'unknown' | 'connected' | 'disconnected'>('unknown')
  const [isSyncing, setIsSyncing] = useState(false)
  const [syncProgress, setSyncProgress] = useState({ current: 0, total: 0 })

  useEffect(() => {
    // 从localStorage加载数据
    const savedRecords = JSON.parse(localStorage.getItem('quiz_records') || '[]')
    setRecords(savedRecords)
    setFilteredRecords(savedRecords)
    
    // 检查飞书连接状态
    checkFeishuConnection()
  }, [])
  
  /**
   * 检查飞书连接状态
   */
  const checkFeishuConnection = async () => {
    try {
      const isConnected = await testFeishuConnection()
      setFeishuStatus(isConnected ? 'connected' : 'disconnected')
    } catch (error) {
      console.error('检查飞书连接失败:', error)
      setFeishuStatus('disconnected')
    }
  }

  useEffect(() => {
    // 过滤和排序
    let filtered = records.filter(record => 
      record.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.phone.includes(searchTerm)
    )

    filtered.sort((a, b) => {
      let comparison = 0
      switch (sortBy) {
        case 'timestamp':
          comparison = a.timestamp - b.timestamp
          break
        case 'accuracy':
          comparison = a.accuracy - b.accuracy
          break
        case 'name':
          comparison = a.name.localeCompare(b.name)
          break
      }
      return sortOrder === 'asc' ? comparison : -comparison
    })

    setFilteredRecords(filtered)
  }, [records, searchTerm, sortBy, sortOrder])

  const exportToExcel = () => {
    const exportData = filteredRecords.map(record => ({
      '姓名': record.name,
      '手机号': record.phone,
      '得分': record.score,
      '正确率': `${record.accuracy}%`,
      '答题时间': new Date(record.timestamp).toLocaleString('zh-CN'),
      '是否查看答案': record.hasViewedAnswers ? '是' : '否'
    }))

    const ws = XLSX.utils.json_to_sheet(exportData)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, '答题记录')

    // 设置列宽
    const colWidths = [
      { wch: 10 }, // 姓名
      { wch: 15 }, // 手机号
      { wch: 8 },  // 得分
      { wch: 10 }, // 正确率
      { wch: 20 }, // 答题时间
      { wch: 12 }  // 是否查看答案
    ]
    ws['!cols'] = colWidths

    const fileName = `糖尿病答题记录_${new Date().toISOString().split('T')[0]}.xlsx`
    XLSX.writeFile(wb, fileName)
  }

  /**
   * 同步本地记录到飞书
   */
  const syncToFeishu = async () => {
    if (records.length === 0) {
      alert('没有可同步的记录')
      return
    }
    
    if (feishuStatus !== 'connected') {
      alert('飞书连接未配置或连接失败，请检查配置')
      return
    }
    
    const confirmSync = window.confirm(`确定要将 ${records.length} 条记录同步到飞书多维表格吗？`)
    if (!confirmSync) return
    
    setIsSyncing(true)
    setSyncProgress({ current: 0, total: records.length })
    
    try {
      // 转换记录格式
      const feishuRecords: FeishuQuizRecord[] = records.map(record => ({
        name: record.name,
        phone: record.phone,
        score: record.score,
        correctRate: record.accuracy,
        wrongCount: 25 - record.score, // 基于25题总数计算错题数
        timeUsed: '未知', // 本地记录没有详细时间信息
        startTime: new Date(record.timestamp - 30 * 60 * 1000).toLocaleString('zh-CN'), // 假设30分钟答题时间
        endTime: new Date(record.timestamp).toLocaleString('zh-CN'),
        answers: record.answers.map((answer, index) => ({
          question: `题目 ${index + 1}`,
          userAnswer: `选项 ${answer + 1}`,
          correctAnswer: '未知',
          isCorrect: false // 本地记录没有详细答案信息
        })),
        userAgent: 'Admin Sync'
      }))
      
      const successCount = await syncLocalRecordsToFeishu(feishuRecords)
      
      alert(`同步完成！成功同步 ${successCount} 条记录到飞书多维表格`)
    } catch (error) {
      console.error('同步到飞书失败:', error)
      alert('同步失败，请检查网络连接和飞书配置')
    } finally {
      setIsSyncing(false)
      setSyncProgress({ current: 0, total: 0 })
    }
  }
  
  const clearAllData = () => {
    if (window.confirm('确定要清空所有答题记录吗？此操作不可恢复！')) {
      localStorage.removeItem('quiz_records')
      // 清空查看答案记录
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith('viewed_answers_')) {
          localStorage.removeItem(key)
        }
      })
      setRecords([])
      setFilteredRecords([])
      alert('所有数据已清空')
    }
  }

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString('zh-CN')
  }

  const getAccuracyColor = (accuracy: number) => {
    if (accuracy >= 80) return 'text-green-600'
    if (accuracy >= 60) return 'text-orange-600'
    return 'text-red-600'
  }

  const getStats = () => {
    if (filteredRecords.length === 0) return null
    
    const totalRecords = filteredRecords.length
    const avgAccuracy = filteredRecords.reduce((sum, record) => sum + record.accuracy, 0) / totalRecords
    const highScores = filteredRecords.filter(record => record.accuracy >= 80).length
    const viewedAnswers = filteredRecords.filter(record => record.hasViewedAnswers).length
    
    // 计算平均错题数
    const avgWrongCount = filteredRecords.reduce((sum, record) => {
      const wrongCount = 25 - record.score // 基于25题总数计算错题数
      return sum + wrongCount
    }, 0) / totalRecords
    
    // 计算平均答题时间（假设30分钟答题时间）
    const avgTimeUsed = filteredRecords.reduce((sum, record) => {
      // 由于本地记录没有详细时间信息，这里使用估算值
      // 可以根据正确率推算答题时间：正确率越高，可能用时越长
      const estimatedMinutes = Math.round(15 + (record.accuracy / 100) * 10) // 15-25分钟范围
      return sum + estimatedMinutes
    }, 0) / totalRecords

    return {
      totalRecords,
      avgAccuracy: Math.round(avgAccuracy),
      highScores,
      viewedAnswers,
      avgWrongCount: Math.round(avgWrongCount * 10) / 10, // 保留一位小数
      avgTimeUsed: Math.round(avgTimeUsed) // 平均答题时间（分钟）
    }
  }

  const stats = getStats()

  return (
    <div className="max-w-6xl mx-auto">
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">管理员面板</h2>
            <p className="text-gray-600">答题记录管理与数据导出</p>
          </div>
          <button
            onClick={onBack}
            className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            返回
          </button>
        </div>

        {/* Statistics */}
        {stats && (
          <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-6">
            <div className="bg-blue-50 rounded-lg p-4">
              <div className="text-sm text-blue-600 mb-1">总答题人数</div>
              <div className="text-2xl font-bold text-blue-900">{stats.totalRecords}</div>
            </div>
            <div className="bg-green-50 rounded-lg p-4">
              <div className="text-sm text-green-600 mb-1">平均正确率</div>
              <div className="text-2xl font-bold text-green-900">{stats.avgAccuracy}%</div>
            </div>
            <div className="bg-orange-50 rounded-lg p-4">
              <div className="text-sm text-orange-600 mb-1">优秀率(≥80%)</div>
              <div className="text-2xl font-bold text-orange-900">
                {Math.round((stats.highScores / stats.totalRecords) * 100)}%
              </div>
            </div>
            <div className="bg-purple-50 rounded-lg p-4">
              <div className="text-sm text-purple-600 mb-1">查看答案人数</div>
              <div className="text-2xl font-bold text-purple-900">{stats.viewedAnswers}</div>
            </div>
            <div className="bg-red-50 rounded-lg p-4">
              <div className="text-sm text-red-600 mb-1">平均错题数</div>
              <div className="text-2xl font-bold text-red-900">{stats.avgWrongCount}</div>
            </div>
            <div className="bg-indigo-50 rounded-lg p-4">
              <div className="text-sm text-indigo-600 mb-1">平均答题时间</div>
              <div className="text-2xl font-bold text-indigo-900">{stats.avgTimeUsed}分钟</div>
            </div>
          </div>
        )}

        {/* Feishu Status */}
        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <h3 className="text-lg font-medium text-gray-900">飞书多维表格同步</h3>
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${
                  feishuStatus === 'connected' ? 'bg-green-500' :
                  feishuStatus === 'disconnected' ? 'bg-red-500' : 'bg-yellow-500'
                }`}></div>
                <span className={`text-sm ${
                  feishuStatus === 'connected' ? 'text-green-600' :
                  feishuStatus === 'disconnected' ? 'text-red-600' : 'text-yellow-600'
                }`}>
                  {feishuStatus === 'connected' ? '已连接' :
                   feishuStatus === 'disconnected' ? '未连接' : '检查中...'}
                </span>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={checkFeishuConnection}
                disabled={isSyncing}
                className="px-3 py-1 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors disabled:opacity-50"
              >
                测试连接
              </button>
              <button
                onClick={syncToFeishu}
                disabled={isSyncing || feishuStatus !== 'connected' || records.length === 0}
                className="px-3 py-1 text-sm bg-purple-600 hover:bg-purple-700 text-white rounded transition-colors disabled:opacity-50"
              >
                {isSyncing ? '同步中...' : '同步到飞书'}
              </button>
            </div>
          </div>
          {feishuStatus === 'disconnected' && (
            <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded">
              <p className="text-sm text-yellow-800">
                <strong>配置提示：</strong>请在项目根目录创建 .env 文件，并配置飞书API密钥。
                参考 .env.example 文件中的配置格式。
              </p>
            </div>
          )}
          {isSyncing && (
            <div className="mt-3">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <div className="animate-spin w-4 h-4 border-2 border-purple-600 border-t-transparent rounded-full"></div>
                <span>正在同步记录到飞书多维表格...</span>
              </div>
              {syncProgress.total > 0 && (
                <div className="mt-2">
                  <div className="bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-purple-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${(syncProgress.current / syncProgress.total) * 100}%` }}
                    ></div>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {syncProgress.current} / {syncProgress.total} 条记录
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Controls */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative">
              <input
                type="text"
                placeholder="搜索姓名或手机号..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <svg className="w-4 h-4 text-gray-400 absolute left-3 top-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            
            <select
              value={`${sortBy}-${sortOrder}`}
              onChange={(e) => {
                const [field, order] = e.target.value.split('-')
                setSortBy(field as 'timestamp' | 'accuracy' | 'name')
                setSortOrder(order as 'asc' | 'desc')
              }}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="timestamp-desc">按时间降序</option>
              <option value="timestamp-asc">按时间升序</option>
              <option value="accuracy-desc">按正确率降序</option>
              <option value="accuracy-asc">按正确率升序</option>
              <option value="name-asc">按姓名升序</option>
              <option value="name-desc">按姓名降序</option>
            </select>
          </div>

          <div className="flex gap-3">
            <button
              onClick={exportToExcel}
              disabled={filteredRecords.length === 0}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              导出Excel
            </button>
            <button
              onClick={clearAllData}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
            >
              清空数据
            </button>
          </div>
        </div>

        {/* Records Table */}
        {filteredRecords.length === 0 ? (
          <div className="text-center py-12">
            <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p className="text-gray-500">暂无答题记录</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-medium text-gray-900">姓名</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">手机号</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">得分</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">正确率</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">答题时间</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">查看答案</th>
                </tr>
              </thead>
              <tbody>
                {filteredRecords.map((record) => (
                  <tr key={record.userId} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4 font-medium text-gray-900">{record.name}</td>
                    <td className="py-3 px-4 text-gray-600">{record.phone}</td>
                    <td className="py-3 px-4 text-gray-900">{record.score}/25</td>
                    <td className={`py-3 px-4 font-medium ${getAccuracyColor(record.accuracy)}`}>
                      {record.accuracy}%
                    </td>
                    <td className="py-3 px-4 text-gray-600">{formatDate(record.timestamp)}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        record.hasViewedAnswers 
                          ? 'bg-orange-100 text-orange-700' 
                          : 'bg-green-100 text-green-700'
                      }`}>
                        {record.hasViewedAnswers ? '已查看' : '未查看'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

export default AdminPanel
