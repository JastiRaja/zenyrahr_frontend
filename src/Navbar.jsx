import React from 'react'
import logo from '../assets/logo.jpeg'
const Navbar = () => {
  return (
    <>
        <nav className='novcontainer'>
            <aside className='logo'>
                <img src={logo} alt="ZenyraHR" />
            </aside>
        </nav>
    </>
  )
}

export default Navbar