import './Tag.css'

export default function Tag({ type = 'default', children }) {
  return (
    <span className={`tag tag--${type}`}>{children}</span>
  )
}
