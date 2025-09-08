import { BrowserRouter as Router, Routes, Route } from "react-router-dom"
import Layout from "./pages/layout"
import MainPage from "./pages/mainPage"

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path = "/" element={<Layout />}>
          <Route index element={<MainPage />} />

        </Route>
      </Routes>
    </Router>
  )
}