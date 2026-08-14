import { useEffect, useState } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'

import HomePage from './pages/HomePage'
import ToolsPage from './pages/ToolsPage'
import AboutPage from './pages/AboutPage'
import PrivacyPage from './pages/PrivacyPage'

import CompressPage from './pages/tools/CompressPage'


export default function App() {
  const [darkMode, setDarkMode] = useState(false)

  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode)
  }, [darkMode])

  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/"
          element={
            <HomePage
              darkMode={darkMode}
              onToggleDarkMode={() => setDarkMode((value) => !value)}
            />
          }
        />

        <Route
          path="/tools"
          element={
            <ToolsPage
              darkMode={darkMode}
              onToggleDarkMode={() => setDarkMode((value) => !value)}
            />
          }
        />
        
<Route
  path="/tools/compress"
  element={
    <CompressPage
      darkMode={darkMode}
      onToggleDarkMode={() => setDarkMode((value) => !value)}
    />
  }
/>

        <Route
          path="/about"
          element={
            <AboutPage
              darkMode={darkMode}
              onToggleDarkMode={() => setDarkMode((value) => !value)}
            />
          }
        />

        <Route
          path="/privacy"
          element={
            <PrivacyPage
              darkMode={darkMode}
              onToggleDarkMode={() => setDarkMode((value) => !value)}
            />
          }
        />
      </Routes>
    </BrowserRouter>
  )
}