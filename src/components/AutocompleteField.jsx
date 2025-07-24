import React, { useState, useEffect } from 'react'
import { Autocomplete, TextField, Chip } from '@mui/material'
import { supabase } from '../config/supabase'

const AutocompleteField = ({ 
  label, 
  value, 
  onChange, 
  tableName, 
  columnName, 
  required = false,
  multiple = false,
  type = 'text',
  ...props 
}) => {
  const [options, setOptions] = useState([])
  const [loading, setLoading] = useState(false)

  // Mevcut değerleri Supabase'den çek
  useEffect(() => {
    const fetchOptions = async () => {
      if (!tableName || !columnName) return

      setLoading(true)
      try {
        const { data, error } = await supabase
          .from(tableName)
          .select(columnName)
          .not(columnName, 'is', null)
          .order(columnName)

        if (error) throw error

        // Benzersiz değerleri al
        const uniqueValues = [...new Set(data.map(item => item[columnName]))].filter(Boolean)
        setOptions(uniqueValues)
      } catch (error) {
        console.error('Veri çekme hatası:', error)
        setOptions([])
      } finally {
        setLoading(false)
      }
    }

    fetchOptions()
  }, [tableName, columnName])

  const handleChange = (event, newValue) => {
    onChange(newValue)
  }

  return (
    <Autocomplete
      freeSolo
      multiple={multiple}
      options={options}
      value={value || (multiple ? [] : '')}
      onChange={handleChange}
      loading={loading}
      renderInput={(params) => (
        <TextField
          {...params}
          label={label}
          required={required}
          type={type}
          variant="outlined"
          helperText={`${label} seçin veya yeni bir değer yazın`}
          {...props}
        />
      )}
      renderTags={(value, getTagProps) =>
        multiple && value.map((option, index) => (
          <Chip
            variant="outlined"
            label={option}
            {...getTagProps({ index })}
            key={index}
          />
        ))
      }
      filterOptions={(options, params) => {
        const filtered = options.filter(option =>
          option.toLowerCase().includes(params.inputValue.toLowerCase())
        )

        const { inputValue } = params
        const isExisting = options.some(option => inputValue === option)
        if (inputValue !== '' && !isExisting) {
          filtered.push(inputValue)
        }

        return filtered
      }}
      selectOnFocus
      clearOnBlur
      handleHomeEndKeys
    />
  )
}

export default AutocompleteField 