import { createContext, useCallback, useContext, useEffect, useMemo, useReducer, useRef } from 'react'

const LS_STATE  = 'mandate.quiz.v1'
const LS_DEVICE = 'mandate.device'

const EMPTY_ANSWERS = [null, null, null, null, null, null]

const initial = {
  countryIso3: null,
  region: null,
  answers: EMPTY_ANSWERS,
  currentQuestion: 0,
  completed: false,
}

function reducer(state, action) {
  switch (action.type) {
    case 'HYDRATE': {
      const next = action.payload || {}
      return {
        ...initial,
        ...next,
        answers: Array.isArray(next.answers) && next.answers.length === 6
          ? next.answers.map(v => (v === 0 || v === 25 || v === 50 || v === 75 || v === 100) ? v : null)
          : EMPTY_ANSWERS,
      }
    }
    case 'SET_COUNTRY':
      return { ...state, countryIso3: action.iso3 }
    case 'SET_REGION':
      return { ...state, region: action.region ?? null }
    case 'SET_ANSWER': {
      const answers = state.answers.slice()
      answers[action.index] = action.value
      return { ...state, answers }
    }
    case 'GO': {
      const i = Math.max(0, Math.min(5, action.index))
      return { ...state, currentQuestion: i, completed: false }
    }
    case 'NEXT': {
      if (state.currentQuestion >= 5) return { ...state, completed: true }
      return { ...state, currentQuestion: state.currentQuestion + 1 }
    }
    case 'PREV':
      return { ...state, currentQuestion: Math.max(0, state.currentQuestion - 1) }
    case 'CHANGE_ANSWERS':
      return { ...state, completed: false, currentQuestion: 0 }
    case 'RESET':
      return { ...initial, countryIso3: state.countryIso3 }
    default:
      return state
  }
}

function readDeviceId() {
  try {
    const existing = localStorage.getItem(LS_DEVICE)
    if (existing) return existing
    const id = (crypto?.randomUUID?.() ?? `d-${Date.now()}-${Math.random().toString(36).slice(2)}`)
    localStorage.setItem(LS_DEVICE, id)
    return id
  } catch {
    return `ephemeral-${Date.now()}`
  }
}

const QuizContext = createContext(null)

export function QuizProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initial)
  const hydratedRef = useRef(false)
  const deviceIdRef = useRef(null)

  if (deviceIdRef.current === null && typeof window !== 'undefined') {
    deviceIdRef.current = readDeviceId()
  }

  // Hydrate once from localStorage
  useEffect(() => {
    try {
      const raw = localStorage.getItem(LS_STATE)
      if (raw) dispatch({ type: 'HYDRATE', payload: JSON.parse(raw) })
    } catch {}
    hydratedRef.current = true
  }, [])

  // Persist on change (skip first render until hydration completes)
  useEffect(() => {
    if (!hydratedRef.current) return
    try { localStorage.setItem(LS_STATE, JSON.stringify(state)) } catch {}
  }, [state])

  const actions = useMemo(() => ({
    setCountry: (iso3)      => dispatch({ type: 'SET_COUNTRY', iso3 }),
    setRegion:  (region)    => dispatch({ type: 'SET_REGION', region }),
    answer:     (index, v)  => dispatch({ type: 'SET_ANSWER', index, value: v }),
    goTo:       (index)     => dispatch({ type: 'GO', index }),
    next:       ()          => dispatch({ type: 'NEXT' }),
    prev:       ()          => dispatch({ type: 'PREV' }),
    changeAnswers: ()       => dispatch({ type: 'CHANGE_ANSWERS' }),
    reset:      ()          => dispatch({ type: 'RESET' }),
  }), [])

  const value = useMemo(() => ({
    state,
    deviceId: deviceIdRef.current,
    ...actions,
  }), [state, actions])

  return <QuizContext.Provider value={value}>{children}</QuizContext.Provider>
}

export function useQuiz() {
  const ctx = useContext(QuizContext)
  if (!ctx) throw new Error('useQuiz must be used inside <QuizProvider>')
  return ctx
}
