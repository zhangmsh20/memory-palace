import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'

// 全局基础样式（顺序很重要：variables → global → transitions）
import './styles/variables.css'
import './styles/global.css'
import './styles/transitions.css'
import './styles/LayerIntro.css'
import './styles/LayerSticky.css'
import './styles/LayerShelf.css'
import './styles/LayerLibrary.css'
import './styles/SummonOverlay.css'
import './styles/imprint.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
