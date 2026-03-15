import React, { useState, useRef, useCallback } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from './auth/auth_context.jsx'
import '../styles.css'

export default function Index() {
    const inputRef = useRef(null)
    const [dragActive, setDragActive] = useState(false)
    const [fileName, setFileName] = useState('')
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

    const handleTranscribe = () => {
        console.log('Файл отправлен:', inputRef.current?.files[0])
    }

    const handleLogout = useCallback(() => {
        logout()
    }, [logout])

    if (loading) {
        return null
    }

    if (!user) {
        return <Navigate to="/auth/login" replace />
    }
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/auth/login';
    }, []);

    return (
        <div className="app-container">
            <div className="file_get_box">
                <h1>Выберите файл для расшифровки</h1>
                <div className="file_get">
                    <form action="/upload" method="post" enctype="multipart/form-data">
                        <div
                            id="drop-zone"
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
                        <input 
                            type="file" 
                            ref={inputRef}
                            id="input_file" 
                            className="input_file" 
                            multiple 
                            hidden
                            onChange={handleChange}
                        />
                    </form>
                    {fileName && (
                        <div className="file-name-display">
                            Выбран: <span>{fileName}</span>
                        </div>
                    )}
                </div>
                <div className="data_input_box">
                    <button onClick={handleTranscribe} className="transcribe-btn">
                        Расшифровать
                    </button>
                    <div className='data_input'></div>
                </div>
            </div>
        </div>
    )
}
