import { useState } from 'react'

interface User {
  name: string
  phone: string
}

interface UserFormProps {
  onSubmit: (user: User) => void
}

const UserForm: React.FC<UserFormProps> = ({ onSubmit }) => {
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [errors, setErrors] = useState<{name?: string, phone?: string}>({})

  const validateForm = () => {
    const newErrors: {name?: string, phone?: string} = {}
    
    if (!name.trim()) {
      newErrors.name = '请输入姓名'
    }
    
    if (!phone.trim()) {
      newErrors.phone = '请输入手机号'
    } else if (!/^1[3-9]\d{9}$/.test(phone)) {
      newErrors.phone = '请输入正确的手机号格式'
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (validateForm()) {
      onSubmit({ name: name.trim(), phone: phone.trim() })
    }
  }

  return (
    <div className="max-w-md mx-auto">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">开始答题</h2>
          <p className="text-gray-600">请先填写您的基本信息</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
              姓名 *
            </label>
            <input
              type="text"
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                errors.name ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder="请输入您的姓名"
              maxLength={20}
            />
            {errors.name && (
              <p className="mt-1 text-sm text-red-600">{errors.name}</p>
            )}
          </div>

          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
              手机号 *
            </label>
            <input
              type="tel"
              id="phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                errors.phone ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder="请输入您的手机号"
              maxLength={11}
            />
            {errors.phone && (
              <p className="mt-1 text-sm text-red-600">{errors.phone}</p>
            )}
          </div>

          <button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg transition-colors focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            开始答题
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-gray-500">
          <p>• 共 25 道题目，限时 30 分钟</p>
          <p>• 请认真作答，提交后无法修改</p>
        </div>
      </div>
    </div>
  )
}

export default UserForm
