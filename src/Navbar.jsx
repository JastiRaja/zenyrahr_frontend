import React from 'react'
import logo from '../assets/image.png'
const Navbar = () => {
  return (
    <>
        <nav className='novcontainer'>
            <aside className='logo'>
                <img src={logo} alt="" />
            </aside>
        </nav>
    </>
  )
}

export default Navbar