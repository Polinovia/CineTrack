import { useI18n } from '../lib/i18n'
import './ConfirmDialog.css'

type Props = {
  message: string
  onConfirm: () => void
  onCancel: () => void
  danger?: boolean
}

export default function ConfirmDialog({ message, onConfirm, onCancel, danger }: Props) {
  const { t } = useI18n()

  return (
    <div className="confirm-backdrop" onClick={onCancel}>
      <div className="confirm-dialog" onClick={(e) => e.stopPropagation()}>
        <p className="confirm-message">{message}</p>
        <div className="confirm-actions">
          <button className="confirm-cancel" onClick={onCancel}>
            {t('confirm.no')}
          </button>
          <button
            className={`confirm-ok ${danger ? 'danger' : ''}`}
            onClick={onConfirm}
          >
            {t('confirm.yes')}
          </button>
        </div>
      </div>
    </div>
  )
}
