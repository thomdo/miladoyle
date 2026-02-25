export default function FileInput({ label, accept, onChange, required }) {
  return (
    <label className="ui-label">
      {label}
      <input
        className="ui-file-input"
        type="file"
        accept={accept}
        onChange={onChange}
        required={required}
      />
    </label>
  );
}
