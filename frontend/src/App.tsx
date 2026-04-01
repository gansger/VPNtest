import { useEffect, useState } from 'react'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

interface User {
  id: number
  username: string
  first_name: string
  has_subscription: boolean
}

interface Subscription {
  status: string
  start_date?: string
  end_date?: string
}

function App() {
  const [initData, setInitData] = useState<string>('')
  const [user, setUser] = useState<User | null>(null)
  const [subscription, setSubscription] = useState<Subscription | null>(null)
  const [vpnConfig, setVpnConfig] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string>('')

  useEffect(() => {
    // Инициализация Telegram WebApp
    const tg = window.Telegram.WebApp
    tg.ready()
    tg.expand()

    // Получаем initData для авторизации
    const data = tg.initData
    if (data) {
      setInitData(data)
    } else {
      setError('Запустите приложение через Telegram')
    }
  }, [])

  // Загрузка данных пользователя
  useEffect(() => {
    if (!initData) return

    const fetchUser = async () => {
      try {
        const response = await fetch(`${API_URL}/api/me?init_data=${encodeURIComponent(initData)}`)
        if (response.ok) {
          const data = await response.json()
          setUser(data)
        } else {
          setError('Ошибка авторизации')
        }
      } catch (e) {
        setError('Ошибка соединения с сервером')
      }
    }

    fetchUser()
  }, [initData])

  // Загрузка статуса подписки
  useEffect(() => {
    if (!initData || !user) return

    const fetchSubscription = async () => {
      try {
        const response = await fetch(`${API_URL}/api/subscription?init_data=${encodeURIComponent(initData)}`)
        if (response.ok) {
          const data = await response.json()
          setSubscription(data)
        }
      } catch (e) {
        console.error('Error fetching subscription:', e)
      }
    }

    fetchSubscription()
  }, [initData, user])

  // Покупка подписки
  const handleBuySubscription = async () => {
    setLoading(true)
    setError('')
    
    try {
      const response = await fetch(`${API_URL}/api/create-invoice`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ init_data: initData }),
      })

      if (response.ok) {
        const data = await response.json()
        
        // В реальном приложении здесь открывается invoice Telegram
        // Для демонстрации показываем сообщение
        alert(`Счет на ${data.amount_stars} Stars создан!\nВ продакшене откроется окно оплаты Telegram.`)
        
        // После успешной оплаты Telegram вызовет webhook на бэкенде
        // и мы обновим данные
        setTimeout(() => {
          window.location.reload()
        }, 2000)
      } else {
        setError('Ошибка создания счета')
      }
    } catch (e) {
      setError('Ошибка соединения')
    } finally {
      setLoading(false)
    }
  }

  // Получение ключа VPN
  const handleGetKey = async () => {
    setLoading(true)
    setError('')
    
    try {
      const response = await fetch(`${API_URL}/api/key?init_data=${encodeURIComponent(initData)}`)
      
      if (response.ok) {
        const data = await response.json()
        setVpnConfig(data.config)
      } else if (response.status === 403) {
        setError('У вас нет активной подписки')
      } else {
        setError('Ошибка получения ключа')
      }
    } catch (e) {
      setError('Ошибка соединения')
    } finally {
      setLoading(false)
    }
  }

  // Копирование конфига в буфер
  const copyConfig = () => {
    navigator.clipboard.writeText(vpnConfig)
    alert('Конфиг скопирован в буфер обмена!')
  }

  // Скачивание конфига как файл
  const downloadConfig = () => {
    const blob = new Blob([vpnConfig], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'vpn_config.conf'
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <div className="max-w-md mx-auto">
        <h1 className="text-2xl font-bold mb-6 text-center">VPN Subscription</h1>

        {error && (
          <div className="bg-red-500 text-white p-3 rounded-lg mb-4">
            {error}
          </div>
        )}

        {!user ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
            <p className="mt-4">Загрузка...</p>
          </div>
        ) : (
          <>
            {/* Информация о пользователе */}
            <div className="bg-gray-800 rounded-lg p-4 mb-6">
              <p className="text-lg">
                Привет, {user.first_name || user.username}!
              </p>
            </div>

            {/* Статус подписки */}
            <div className="bg-gray-800 rounded-lg p-4 mb-6">
              <h2 className="text-xl font-semibold mb-2">Статус подписки</h2>
              {subscription?.status === 'active' ? (
                <div className="text-green-400">
                  <p>✅ Активна</p>
                  {subscription.end_date && (
                    <p className="text-sm text-gray-400 mt-1">
                      До: {new Date(subscription.end_date).toLocaleDateString()}
                    </p>
                  )}
                </div>
              ) : (
                <div className="text-yellow-400">
                  <p>❌ Не активна</p>
                  <button
                    onClick={handleBuySubscription}
                    disabled={loading}
                    className="mt-3 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg w-full disabled:opacity-50"
                  >
                    {loading ? 'Обработка...' : 'Купить подписку (100 Stars)'}
                  </button>
                </div>
              )}
            </div>

            {/* Получение ключа */}
            {subscription?.status === 'active' && (
              <div className="bg-gray-800 rounded-lg p-4 mb-6">
                <h2 className="text-xl font-semibold mb-2">Ваш VPN ключ</h2>
                
                {!vpnConfig ? (
                  <button
                    onClick={handleGetKey}
                    disabled={loading}
                    className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg w-full disabled:opacity-50"
                  >
                    {loading ? 'Генерация...' : 'Получить ключ'}
                  </button>
                ) : (
                  <div>
                    <div className="bg-gray-900 p-3 rounded-lg mb-3 overflow-x-auto">
                      <pre className="text-xs text-green-400 whitespace-pre-wrap">
                        {vpnConfig}
                      </pre>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={copyConfig}
                        className="flex-1 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg"
                      >
                        Копировать
                      </button>
                      <button
                        onClick={downloadConfig}
                        className="flex-1 bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded-lg"
                      >
                        Скачать .conf
                      </button>
                    </div>
                    <p className="text-xs text-gray-400 mt-2">
                      Импортируйте этот конфиг в клиент WireGuard
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Продление */}
            {subscription?.status === 'active' && (
              <div className="bg-gray-800 rounded-lg p-4">
                <button
                  onClick={handleBuySubscription}
                  disabled={loading}
                  className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg w-full disabled:opacity-50"
                >
                  Продлить подписку
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

export default App
