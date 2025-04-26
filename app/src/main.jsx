// src/main.jsx
import React from 'react'
import ReactDOM from 'react-dom/client'
//import './index.css'
import { App } from './app.jsx'

// Wait until DOM is loaded (the #app div might be hidden initially)
window.addEventListener('DOMContentLoaded', () => {
  const root = ReactDOM.createRoot(document.getElementById('app'))
  root.render(<App />)
})
