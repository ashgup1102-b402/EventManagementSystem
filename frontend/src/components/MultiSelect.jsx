import { useState, useRef, useEffect } from 'react'

const MultiSelect = ({ options, selected, onChange, placeholder = 'Select...' }) => {
  const [isOpen, setIsOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const containerRef = useRef(null)

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const toggleOption = (id) => {
    const newSelected = selected.includes(id)
      ? selected.filter(item => item !== id)
      : [...selected, id]
    onChange(newSelected)
  }

  const filteredOptions = options.filter(opt => 
    opt.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const displayValue = () => {
    if (selected.length === 0) return <span className="multi-select-placeholder">{placeholder}</span>
    if (selected.length <= 2) {
      return selected.map(id => {
        const opt = options.find(o => o.id === id)
        return opt ? (
          <span key={id} className="multi-select-badge">
            {opt.name}
            <span className="badge-remove" onClick={(e) => { e.stopPropagation(); toggleOption(id) }}>×</span>
          </span>
        ) : null
      })
    }
    return <span className="multi-select-count">{selected.length} Selected</span>
  }

  return (
    <div className="multi-select-container" ref={containerRef}>
      <div className={`multi-select-trigger ${isOpen ? 'active' : ''} ${selected.length > 0 ? 'has-values' : ''}`} onClick={() => setIsOpen(!isOpen)}>
        <div className="multi-select-values">
          {displayValue()}
        </div>
        <span className="multi-select-arrow">{isOpen ? '▴' : '▾'}</span>
      </div>
      
      {isOpen && (
        <div className="multi-select-dropdown">
          <div className="multi-select-search-wrap">
            <input 
              type="text" 
              className="multi-select-search" 
              placeholder="Filter..." 
              value={searchTerm} 
              onChange={e => setSearchTerm(e.target.value)}
              onClick={e => e.stopPropagation()}
            />
          </div>
          <div className="multi-select-options">
            {filteredOptions.map(opt => (
              <div 
                key={opt.id} 
                className={`multi-select-option ${selected.includes(opt.id) ? 'selected' : ''}`}
                onClick={() => toggleOption(opt.id)}
              >
                <div className="checkbox-custom">
                  {selected.includes(opt.id) && <span className="checkmark">✓</span>}
                </div>
                {opt.name}
              </div>
            ))}
            {filteredOptions.length === 0 && <div className="multi-select-no-options">No matches found</div>}
          </div>
          {selected.length > 0 && (
            <div className="multi-select-footer">
              <button className="text-btn" onClick={(e) => { e.stopPropagation(); onChange([]) }}>Clear All</button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default MultiSelect
