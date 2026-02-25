export default function Input({ label, type = 'text', value, onChange, placeholder, maxLength, required }) {
  return (
    <label className="ui-label">
      {label}
      <input
        className="ui-input"
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        maxLength={maxLength}
        required={required}
      />
    </label>
  );
}
