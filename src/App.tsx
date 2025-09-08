import { BrowserRouter as Router, Routes, Route } from "react-router-dom"
import Layout from "./pages/layout"
import MainPage from "./pages/mainPage"
import WelcomePage from "./pages/landing"

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path = "/" element={<Layout />}>
          <Route index element={<WelcomePage />} />
          <Route path="main" element={<MainPage />} />
        </Route>
      </Routes>
    </Router>
  )
}