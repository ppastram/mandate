import { Routes, Route } from 'react-router-dom'
import Header from './components/Header.jsx'
import Footer from './components/Footer.jsx'
import CountryPickerScreen from './screens/CountryPickerScreen.jsx'
import QuizScreen from './screens/QuizScreen.jsx'
import ResultScreen, { averageWhole } from './screens/ResultScreen.jsx'
import SharedResultScreen from './screens/SharedResultScreen.jsx'
import MapScreen from './screens/MapScreen.jsx'
import MethodScreen from './screens/MethodScreen.jsx'
import ResponseSubmitter from './components/ResponseSubmitter.jsx'
import { useCountries } from './hooks/useCountries.js'
import { useQuiz } from './state/QuizProvider.jsx'

export default function App() {
  return (
    <>
      <ResponseSubmitter />
      <Routes>
        <Route path="/"       element={<Shell><Home /></Shell>} />
        <Route path="/map"    element={<Shell><MapScreen /></Shell>} />
        <Route path="/method" element={<Shell><MethodScreen /></Shell>} />
        <Route path="/r"      element={<Shell><SharedResultScreen /></Shell>} />
        <Route path="*"       element={<Shell><NotFound /></Shell>} />
      </Routes>
    </>
  )
}

/* ────────────────────────────────────────────────────────────── */

function Shell({ children }) {
  const countries = useCountries()
  const { state, setCountry } = useQuiz()
  return (
    <>
      <Header
        countries={countries}
        selectedIso3={state.countryIso3}
        onPickCountry={setCountry}
      />
      {children}
      <Footer />
    </>
  )
}

function Home() {
  const countries = useCountries()
  const { state, setCountry, answer, next, prev, goTo, changeAnswers } = useQuiz()
  const country = countries?.find((c) => c.iso3 === state.countryIso3) ?? null

  // 1. Pick a country
  if (!state.countryIso3) {
    return (
      <CountryPickerScreen
        countries={countries}
        selectedIso3={state.countryIso3}
        onPick={setCountry}
        onStart={() => goTo(0)}
      />
    )
  }

  // 2. Quiz
  if (!state.completed) {
    return (
      <QuizScreen
        country={country}
        currentIndex={state.currentQuestion}
        answers={state.answers}
        onAnswer={(value) => answer(state.currentQuestion, value)}
        onPrev={prev}
        onNext={next}
      />
    )
  }

  // 3. Result
  const userReg = averageWhole(state.answers.slice(0, 3))
  const userPro = averageWhole(state.answers.slice(3, 6))
  return (
    <ResultScreen
      country={country}
      totalCountries={countries?.length ?? 195}
      userReg={userReg}
      userPro={userPro}
      onChangeAnswers={changeAnswers}
    />
  )
}

function NotFound() {
  return (
    <section style={{ padding: 'var(--sp-10) var(--sp-6)', textAlign: 'center', color: 'var(--text-muted)' }}>
      404
    </section>
  )
}
