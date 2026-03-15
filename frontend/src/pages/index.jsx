import React, { useState, useRef, useCallback } from 'react';
import axios from 'axios';
import '../styles.css';

export default function Index() {
    const inputRef = useRef(null);
    const [dragActive, setDragActive] = useState(false);

    const handleDrag = useCallback((e) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === 'dragenter' || e.type === 'dragover') {
            setDragActive(true);
        } else if (e.type === 'dragleave') {
            setDragActive(false);
        }
    }, []);

    const handleDrop = useCallback((e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            inputRef.current.files = e.dataTransfer.files;
        }
    }, []);

    const handleClick = useCallback((e) => {
        e.preventDefault();
        inputRef.current?.click();
    }, []);

    const handleTranscribe = () => {
        console.log('Файл отправлен:', inputRef.current?.files[0]);
    };

    return (
        <div className="app-container">
            <div className="file_get_box">
                <h1>Вставьте файл для расшифровки</h1>
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
                            Перетащите файл сюда или кликните
                        </div>
                        <input 
                            type="file" 
                            ref={inputRef}
                            id="input_file" 
                            className="input_file" 
                            multiple 
                            hidden
                        />
                    </form>
                </div>
                <div className="data_input_box">
                    <button onClick={handleTranscribe} className="transcribe-btn">
                        Расшифровать
                    </button>
                    <div className='data_input'></div>
                </div>
            </div>
        </div>
    );
}
