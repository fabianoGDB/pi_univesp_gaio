interface PriceRangeProps {
  min: number;
  max: number;
  value: number;
  onChange: (value: number) => void;
}

export const PriceRange = ({ min, max, value, onChange }: PriceRangeProps) => (
  <div>
    <div className='mb-2 flex items-center justify-between text-sm'>
      <span className='font-medium text-brand-900'>Área do imóvel</span>
      <span className='font-semibold text-accent-500'>{value}m²</span>
    </div>
    <input
      type='range'
      min={min}
      max={max}
      value={value}
      onChange={(event) => onChange(Number(event.target.value))}
      className='w-full accent-accent-500'
      aria-label='Área do imóvel em metros quadrados'
    />
    <div className='mt-1 flex justify-between text-xs text-gray-500'>
      <span>{min}m²</span>
      <span>{max}m²</span>
    </div>
  </div>
);
