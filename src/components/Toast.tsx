import { useEffect } from 'react'
import './Toast.css'

type Props = {
  message: string
  type?: 'info' | 'error' | 'success'
  onClose: () => void
}

export default function Toast({ message, type = 'info', onClose }: Props) {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000)
    return () => clearTimeout(timer)
  }, [onClose])

  return (
    <div className={`toast toast-${type}`} onClick={onClose}>
      {message}
    </div>
  )
}
