export default function Button({ children, type = 'button', disabled, onClick, href, icon }) {
  const content = (
    <>
      {icon && <span className="ui-button-icon">{icon}</span>}
      {children}
    </>
  );

  if (href) {
    return (
      <a className="ui-button" href={href}>
        {content}
      </a>
    );
  }
  return (
    <button className="ui-button" type={type} disabled={disabled} onClick={onClick}>
      {content}
    </button>
  );
}
