import { useEffect, useState } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'

import HomePage from './pages/HomePage'
import ToolsPage from './pages/ToolsPage'
import AboutPage from './pages/AboutPage'
import PrivacyPage from './pages/PrivacyPage'

import CompressPage from './pages/tools/CompressPage'
import ResizePage from './pages/tools/ResizePage'
import ConvertPage from './pages/tools/ConvertPage'
import CropPage from './pages/tools/CropPage'
import SplitterPage from './pages/tools/SplitterPage'
import MergerPage from './pages/tools/MergerPage'

export default function App() {
  const [darkMode, setDarkMode] = useState(false)

  const toggleDarkMode = () => {
    setDarkMode((value) => !value)
  }

  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode)
  }, [darkMode])

  return (
    <BrowserRouter>
      <Routes>
        {/* Home */}
        <Route
          path="/"
          element={
            <HomePage
              darkMode={darkMode}
              onToggleDarkMode={toggleDarkMode}
            />
          }
        />

        {/* Tools */}
        <Route
          path="/tools"
          element={
            <ToolsPage
              darkMode={darkMode}
              onToggleDarkMode={toggleDarkMode}
            />
          }
        />

        {/* Tool 1 — Compress */}
        <Route
          path="/tools/compress"
          element={
            <CompressPage
              darkMode={darkMode}
              onToggleDarkMode={toggleDarkMode}
            />
          }
        />

        {/* Tool 2 — Resize */}
        <Route
          path="/tools/resize"
          element={
            <ResizePage
              darkMode={darkMode}
              onToggleDarkMode={toggleDarkMode}
            />
          }
        />

        {/* Tool 3 — Convert */}
        <Route
          path="/tools/convert"
          element={
            <ConvertPage
              darkMode={darkMode}
              onToggleDarkMode={toggleDarkMode}
            />
          }
        />

        {/* Tool 4 — Crop */}
        <Route
          path="/tools/crop"
          element={
            <CropPage
              darkMode={darkMode}
              onToggleDarkMode={toggleDarkMode}
            />
          }
        />

        {/* Tool 5 — Splitter */}
        <Route
          path="/tools/splitter"
          element={
            <SplitterPage
              darkMode={darkMode}
              onToggleDarkMode={toggleDarkMode}
            />
          }
        />
 <Route
          path="/tools/merger"
          element={
            <MergerPage
              darkMode={darkMode}
              onToggleDarkMode={toggleDarkMode}
            />
          }
        />

        {/* About */}
        <Route
          path="/about"
          element={
            <AboutPage
              darkMode={darkMode}
              onToggleDarkMode={toggleDarkMode}
            />
          }
        />

        {/* Privacy */}
        <Route
          path="/privacy"
          element={
            <PrivacyPage
              darkMode={darkMode}
              onToggleDarkMode={toggleDarkMode}
            />
          }
        />
      </Routes>
    </BrowserRouter>
  )
}