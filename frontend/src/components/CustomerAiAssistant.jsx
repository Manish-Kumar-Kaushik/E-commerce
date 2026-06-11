import { useEffect, useMemo, useState } from 'react'
import { useSelector } from 'react-redux'
import { useLocation } from 'react-router-dom'
import toast from 'react-hot-toast'
import { Bot, Loader2, MessageCircle, Send, Sparkles, X } from 'lucide-react'
import { useChatCustomerSupportMutation, useGetProductQuery } from '../features/api/apiSlice'

const getAssistantContext = (pathname = '') => {
  if (pathname.startsWith('/products/')) {
    return {
      type: 'product',
      title: 'Product Help',
      subtitle: 'Ask about specs, price, stock, delivery, or returns.',
      suggestedPrompts: ['Tell me about this product', 'Is it in stock?', 'What are the key specs?'],
    }
  }

  if (pathname.startsWith('/account/orders')) {
    return {
      type: 'orders',
      title: 'Order Help',
      subtitle: 'Ask about tracking, cancellation, refunds, or invoices.',
      suggestedPrompts: ['Where is my order?', 'Can I cancel it?', 'How do I get an invoice?'],
    }
  }

  if (pathname.startsWith('/account/dashboard')) {
    return {
      type: 'orders',
      title: 'Order Help',
      subtitle: 'Ask about your orders, delivery, or returns.',
      suggestedPrompts: ['Check my latest order', 'Help with delivery', 'What is my return status?'],
    }
  }

  return {
    type: 'general',
    title: 'AI Support',
    subtitle: 'Ask about orders, products, delivery, cancellation, or returns.',
    suggestedPrompts: ['Track my order', 'Tell me about a product', 'I need help with a return'],
  }
}

const CustomerAiAssistant = () => {
  const location = useLocation()
  const token = useSelector((state) => state.auth?.token)
  const [isOpen, setIsOpen] = useState(false)
  const [input, setInput] = useState('')
  const [messages, setMessages] = useState([])
  const [chatCustomerSupport, { isLoading }] = useChatCustomerSupportMutation()

  const assistantContext = useMemo(() => getAssistantContext(location.pathname), [location.pathname])
  const isProductPage = assistantContext.type === 'product'
  const productSlug = isProductPage ? location.pathname.split('/')[2] : ''
  const { data: productData } = useGetProductQuery(
    { slug: productSlug, publicOnly: true },
    { skip: !productSlug },
  )

  const product = productData?.product || null

  useEffect(() => {
    const openingMessage = assistantContext.type === 'product'
      ? 'Hi! I can explain this product, its specs, stock, price, and return options.'
      : assistantContext.type === 'orders'
        ? 'Hi! I can help with your orders, delivery, cancellation, refund, or invoice.'
        : 'Hi! I can help with order status, delivery, cancellation, returns, and product details.'

    setMessages([
      {
        id: 'welcome',
        role: 'assistant',
        text: openingMessage,
        suggestedActions: assistantContext.suggestedPrompts,
      },
    ])
    setInput('')
  }, [assistantContext.suggestedPrompts, assistantContext.type, location.pathname])

  const appendMessage = (role, text, extras = {}) => {
    setMessages((current) => [
      ...current,
      {
        id: `${role}-${Date.now()}-${Math.random().toString(16).slice(2)}`,
        role,
        text,
        ...extras,
      },
    ])
  }

  const handleSend = async (nextMessage = input) => {
    const trimmed = String(nextMessage || '').trim()

    if (!trimmed) {
      return
    }

    appendMessage('user', trimmed)
    setInput('')

    try {
      const response = await chatCustomerSupport({
        message: trimmed,
        contextType: assistantContext.type,
        productId: product?._id || '',
        productSlug,
      }).unwrap()

      appendMessage('assistant', response?.data?.reply || 'I could not generate a reply right now.', {
        suggestedActions: response?.data?.suggestedActions || [],
        topic: response?.data?.topic || assistantContext.type,
      })
    } catch (error) {
      const fallback = error?.data?.message || 'Unable to get AI support right now.'
      toast.error(fallback)
      appendMessage('assistant', fallback)
    }
  }

  const contextBadge = isProductPage && product
    ? product.name
    : assistantContext.type === 'orders'
      ? 'Your orders'
      : 'General support'

  return (
    <>
      {!isOpen ? (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="fixed bottom-5 right-5 z-50 flex items-center gap-2 rounded-full bg-violet-600 px-4 py-3 text-sm font-semibold text-white shadow-[0_18px_50px_rgba(98,54,255,0.28)] transition hover:-translate-y-0.5 hover:bg-violet-700"
        >
          <MessageCircle className="h-4 w-4" />
          AI Help
        </button>
      ) : (
        <div className="fixed bottom-5 right-5 z-50 w-[min(92vw,24rem)] overflow-hidden rounded-[1.8rem] border border-slate-200 bg-white shadow-[0_24px_80px_rgba(15,23,42,0.18)]">
          <div className="flex items-center justify-between border-b border-slate-200 bg-linear-to-r from-violet-600 to-fuchsia-600 px-4 py-3 text-white">
            <div>
              <p className="flex items-center gap-2 text-sm font-semibold"><Bot className="h-4 w-4" /> {assistantContext.title}</p>
              <p className="mt-0.5 text-xs text-white/85">{assistantContext.subtitle}</p>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="rounded-full p-2 transition hover:bg-white/15"
              aria-label="Close AI assistant"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="border-b border-slate-100 bg-slate-50 px-4 py-2 text-xs text-slate-600">
            <span className="inline-flex items-center gap-1 rounded-full bg-white px-2.5 py-1 font-medium text-slate-700 shadow-sm">
              <Sparkles className="h-3.5 w-3.5 text-violet-600" />
              {contextBadge}
            </span>
            {!token && assistantContext.type === 'orders' ? (
              <p className="mt-2 text-xs text-amber-700">Sign in to let AI check your orders directly.</p>
            ) : null}
          </div>

          <div className="max-h-112 space-y-3 overflow-y-auto px-4 py-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm leading-6 ${
                    message.role === 'user'
                      ? 'bg-violet-600 text-white'
                      : 'border border-slate-200 bg-slate-50 text-slate-800'
                  }`}
                >
                  <p>{message.text}</p>
                  {message.suggestedActions?.length ? (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {message.suggestedActions.map((action) => (
                        <button
                          key={action}
                          type="button"
                          onClick={() => handleSend(action)}
                          className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-medium text-slate-700 transition hover:border-violet-300 hover:text-violet-700"
                        >
                          {action}
                        </button>
                      ))}
                    </div>
                  ) : null}
                </div>
              </div>
            ))}

            {isLoading ? (
              <div className="flex justify-start">
                <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Thinking...
                </div>
              </div>
            ) : null}
          </div>

          <div className="space-y-3 border-t border-slate-200 p-4">
            <div className="flex flex-wrap gap-2">
              {assistantContext.suggestedPrompts.map((prompt) => (
                <button
                  key={prompt}
                  type="button"
                  onClick={() => handleSend(prompt)}
                  className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:border-violet-300 hover:bg-violet-50 hover:text-violet-700"
                >
                  {prompt}
                </button>
              ))}
            </div>

            <form
              onSubmit={(event) => {
                event.preventDefault()
                handleSend()
              }}
              className="flex items-end gap-2"
            >
              <textarea
                value={input}
                onChange={(event) => setInput(event.target.value)}
                placeholder="Type your question..."
                className="field-input min-h-14 flex-1 resize-none rounded-2xl"
              />
              <button
                type="submit"
                disabled={!input.trim() || isLoading}
                className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-600 text-white transition hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-50"
                aria-label="Send message"
              >
                <Send className="h-4 w-4" />
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  )
}

export default CustomerAiAssistant