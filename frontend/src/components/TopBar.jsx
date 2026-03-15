import React, { useState } from 'react'
import { Outlet, Navigate, Link } from 'react-router-dom'




export default function TopBar() {
    const [isOpen, setIsOpen] = useState(false)

    return ( 
        <>
            <div className="TopBar">
                <h1>Это бар поверх всего ваще прям всего</h1>
            </div>
            <div class="otherdata">
                <Outlet/>
            </div>
        </>
    )
}