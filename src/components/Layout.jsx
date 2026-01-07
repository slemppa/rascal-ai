import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import MobileNavigation from './MobileNavigation'

export default function Layout() {
  return (
    <div className="app-layout">
      <Sidebar />
      <MobileNavigation />
      <div className="main-content">
        <Outlet />
      </div>
    </div>
  )
}



