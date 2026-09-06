import { Select as RadixSelect } from 'radix-ui'
import { type Ref, useId } from 'react'
import { CheckIcon, ChevronDownIcon, SpinnerIcon } from '../icons.tsx'
import './Select.css'

export type SelectSize = 'sm' | 'md' | 'lg'

export type SelectItem = {
  value: string
  label: string
  description?: string
  disabled?: boolean
}

export type SelectProps = {
  label: string
  value: string | null
  onValueChange: (value: string) => void
  items: SelectItem[]
  hideLabel?: boolean
  placeholder?: string
  emptyLabel?: string
  loading?: boolean
  invalid?: boolean
  size?: SelectSize
  disabled?: boolean
  disabledReason?: string
  className?: string
  id?: string
  ref?: Ref<HTMLButtonElement>
}

const NO_VALUE = ''
const SIDE_OFFSET = 4

export function Select({
  label,
  value,
  onValueChange,
  items,
  hideLabel = false,
  placeholder = 'Choose…',
  emptyLabel = 'Nothing to choose from',
  loading = false,
  invalid = false,
  size = 'md',
  disabled = false,
  disabledReason,
  className,
  id,
  ref,
}: SelectProps) {
  const labelId = useId()
  const reasonId = useId()
  const empty = items.length === 0
  const describedBy = disabled && disabledReason ? reasonId : undefined

  return (
    <div className={['lm-select', className].filter(Boolean).join(' ')} data-size={size}>
      <span className={hideLabel ? 'lm-hidden-text' : 'lm-select-label'} id={labelId}>
        {label}
      </span>
      <RadixSelect.Root
        value={value ?? NO_VALUE}
        onValueChange={onValueChange}
        disabled={disabled}
        {...(loading ? { open: false } : {})}
      >
        <RadixSelect.Trigger
          ref={ref}
          id={id}
          className="lm-select-trigger lm-focusable"
          aria-labelledby={labelId}
          {...(loading ? { 'aria-busy': true, 'data-loading': '', 'aria-disabled': true } : {})}
          {...(empty ? { 'data-empty': '', 'aria-disabled': true } : {})}
          {...(invalid ? { 'aria-invalid': true, 'data-invalid': '' } : {})}
          {...(describedBy ? { 'aria-describedby': describedBy } : {})}
        >
          <span className="lm-select-value">
            {empty ? (
              <span className="lm-select-placeholder">{emptyLabel}</span>
            ) : (
              <RadixSelect.Value
                placeholder={<span className="lm-select-placeholder">{placeholder}</span>}
              />
            )}
          </span>
          <RadixSelect.Icon className="lm-select-icon">
            {loading ? <SpinnerIcon className="lm-spin" /> : <ChevronDownIcon />}
          </RadixSelect.Icon>
        </RadixSelect.Trigger>
        <RadixSelect.Portal>
          <RadixSelect.Content
            className="lm-select-content"
            position="popper"
            align="start"
            sideOffset={SIDE_OFFSET}
          >
            <RadixSelect.Viewport className="lm-select-viewport">
              {empty ? (
                <div
                  className="lm-select-empty"
                  role="option"
                  aria-disabled="true"
                  aria-selected="false"
                  tabIndex={-1}
                >
                  {emptyLabel}
                </div>
              ) : null}
              {items.map((item) => (
                <RadixSelect.Item
                  key={item.value}
                  value={item.value}
                  disabled={item.disabled ?? false}
                  className="lm-select-item"
                >
                  <span className="lm-select-check">
                    <RadixSelect.ItemIndicator>
                      <CheckIcon />
                    </RadixSelect.ItemIndicator>
                  </span>
                  <span className="lm-select-item-text">
                    <RadixSelect.ItemText>{item.label}</RadixSelect.ItemText>
                    {item.description ? (
                      <span className="lm-select-item-description">{item.description}</span>
                    ) : null}
                  </span>
                </RadixSelect.Item>
              ))}
            </RadixSelect.Viewport>
          </RadixSelect.Content>
        </RadixSelect.Portal>
      </RadixSelect.Root>
      {describedBy ? (
        <span id={reasonId} className="lm-hidden-text">
          {disabledReason}
        </span>
      ) : null}
    </div>
  )
}
