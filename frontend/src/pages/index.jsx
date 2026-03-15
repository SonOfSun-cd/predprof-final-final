import React, { useState, useRef, useCallback } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from './auth/auth_context.jsx'
import Plot from 'react-plotly.js'
import '../styles.css'

export default function Index() {
  const inputRef = useRef(null)
  const [dragActive, setDragActive] = useState(false)
  const [fileName, setFileName] = useState('')
  const [prediction, setPrediction] = useState(null)
  const [status, setStatus] = useState('')
  const [loadingPred, setLoadingPred] = useState(false)
  const { user, loading, logout } = useAuth()

  const handleDrag = useCallback((e) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }, [])

  const handleDrop = useCallback((e) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      inputRef.current.files = e.dataTransfer.files
      setFileName(e.dataTransfer.files[0].name)
    }
  }, [])

  const handleClick = useCallback((e) => {
    e.preventDefault()
    inputRef.current?.click()
  }, [])

  const handleChange = useCallback((e) => {
    if (e.target.files && e.target.files[0]) {
      setFileName(e.target.files[0].name)
    }
  }, [])

  const handleTranscribe = async () => {
    if (!inputRef.current?.files?.[0]) {
      setStatus('Выберите .npz файл')
      return
    }

    const formData = new FormData()
    formData.append('dataset', inputRef.current.files[0])

    const token = user?.token || localStorage.getItem('token')
    const headers = token ? { Authorization: `Bearer ${token}` } : {}

    setLoadingPred(true)
    setStatus('')
    setPrediction(null)

    try {
      const response = await fetch('/api/predict/predict', {
        method: 'POST',
        body: formData,
        headers,
      })

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}))
        throw new Error(errData.detail || `HTTP ${response.status}`)
      }

      const json = await response.json()
      setPrediction(json)
      setStatus('Предсказание получено')
    } catch (err) {
      setStatus(err.message || 'Ошибка предсказания')
    } finally {
      setLoadingPred(false)
    }
  }

  const handleLogout = useCallback(() => {
    logout()
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    window.location.href = '/auth/login'
  }, [logout])

  if (loading) return null
  if (!user) return <Navigate to="/auth/login" replace />

  const trainDataset = prediction?.graph_data?.train_class_counts || []
  const validationDataset = prediction?.graph_data?.validation_class_counts || []
  const top5 = prediction?.graph_data?.validation_top_5_classes || []
  const perRecord = prediction?.graph_data?.per_record_accuracy || []

  return (
    <div className="app-container">
      <div className="file_get_box">
        <button className="logout-btn top-right" onClick={handleLogout}>Выйти</button>

        <h1>Выберите файл .npz с test_x/test_y</h1>

        <div
          className={`drop-zone ${dragActive ? 'drag-over' : ''}`}
          onDragEnter={handleDrag}
          onDragOver={handleDrag}
          onDragLeave={handleDrag}
          onDrop={handleDrop}
          onClick={handleClick}
          role="button"
          tabIndex={0}
        >
          Перетащите файл или кликните
        </div>

        <input type="file" ref={inputRef} className="input_file" hidden onChange={handleChange} />
        {fileName && <div className="file-name-display">Выбран: <span>{fileName}</span></div>}

        <div className="data_input_box">
          <button className="transcribe-btn" onClick={handleTranscribe} disabled={loadingPred}>
            {loadingPred ? 'Обработка…' : 'Расшифровать'}
          </button>
          {status && <div className="status-message">{status}</div>}
        </div>

        {prediction && (
          <div className="plot-section">
            <div className="plot-card">
              <h3>Тренировочные данные: количество записей на класс</h3>
              <Plot
                data={[{
                  x: trainDataset.map((i) => i.class_name),
                  y: trainDataset.map((i) => i.count),
                  type: 'bar',
                  marker: { color: '#4e8dff' },
                }]}
                layout={{ margin: { t: 30, b: 40, l: 40, r: 20 } }}
                useResizeHandler
                style={{ width: '100%', height: 340 }}
              />
            </div>

            <div className="plot-card">
              <h3>Точность по записям теста</h3>
              <Plot
                data={[{
                  x: perRecord.map((i) => i.record_index),
                  y: perRecord.map((i) => i.confidence),
                  mode: 'markers+lines',
                  type: 'scatter',
                  marker: { color: '#ffa500' },
                }]}
                layout={{ yaxis: { title: 'confidence' }, margin: { t: 30, b: 40 } }}
                useResizeHandler
                style={{ width: '100%', height: 340 }}
              />
            </div>

            <div className="plot-card">
              <h3>Топ-5 классов валидации</h3>
              <Plot
                data={[{
                  labels: top5.map((i) => i.class_name),
                  values: top5.map((i) => i.count),
                  type: 'pie',
                  textinfo: 'label+percent',
                }]}
                layout={{ margin: { t: 30, b: 40 } }}
                useResizeHandler
                style={{ width: '100%', height: 340 }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
