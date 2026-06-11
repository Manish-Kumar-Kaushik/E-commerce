const Button = ({ children, className = '', type = 'button', disabled = false, ...props }) => {
  return (
    <button
      type={type}
      disabled={disabled}
      className={`inline-flex items-center justify-center rounded-xl bg-[#1876D2] px-6 py-3 text-sm font-semibold text-white shadow-[0_12px_28px_rgba(24,118,210,0.24)] transition hover:bg-[#1469bb] disabled:cursor-not-allowed disabled:opacity-60 sm:px-8 sm:py-3.5 sm:text-base ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}

export default Button