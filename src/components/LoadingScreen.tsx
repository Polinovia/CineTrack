import Logo from './Logo'
import './LoadingScreen.css'

export default function LoadingScreen() {
  return (
    <div className="loading-screen">
      <span className="loading-logo">
        <Logo size={40} />
      </span>
    </div>
  )
}
