const QuantitySelector = ({ onChange, value, min = 1, max = Number.POSITIVE_INFINITY }) => {
  const currentValue = Number.isFinite(Number(value)) ? Number(value) : min
  const safeMin = Number.isFinite(Number(min)) ? Number(min) : 1
  const safeMax = Number.isFinite(Number(max)) ? Number(max) : Number.POSITIVE_INFINITY
  const canDecrement = currentValue > safeMin
  const canIncrement = currentValue < safeMax

  const updateValue = (nextValue) => {
    const normalizedValue = Math.min(safeMax, Math.max(safeMin, nextValue))
    onChange(normalizedValue)
  }

  return (
    <div className="inline-flex items-center overflow-hidden rounded-full border border-stone-200 bg-white shadow-sm">
      <button
        type="button"
        onClick={() => updateValue(currentValue - 1)}
        disabled={!canDecrement}
        aria-label="Decrease quantity"
        className="flex h-11 w-11 items-center justify-center text-lg font-semibold text-stone-700 transition hover:bg-stone-100 disabled:cursor-not-allowed disabled:text-stone-300 disabled:hover:bg-white"
      >
        −
      </button>
      <span className="min-w-12 border-x border-stone-200 px-4 py-2 text-center text-sm font-semibold text-stone-900">
        {currentValue}
      </span>
      <button
        type="button"
        onClick={() => updateValue(currentValue + 1)}
        disabled={!canIncrement}
        aria-label="Increase quantity"
        className="flex h-11 w-11 items-center justify-center text-lg font-semibold text-stone-700 transition hover:bg-stone-100 disabled:cursor-not-allowed disabled:text-stone-300 disabled:hover:bg-white"
      >
        +
      </button>
    </div>
  )
}

export default QuantitySelector
