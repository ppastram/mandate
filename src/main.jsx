import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './styles/tokens.css'
import App from './App.jsx'
import { LangProvider } from './i18n/LangProvider.jsx'
import { QuizProvider } from './state/QuizProvider.jsx'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <LangProvider>
      <QuizProvider>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </QuizProvider>
    </LangProvider>
  </React.StrictMode>,
)
