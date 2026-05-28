/**
 * TechButton — reusable sci-fi cut-corner button with scan-line animation.
 * Props: label, onClick, variant ('primary'|'secondary'|'reset'), icon
 */
export default function TechButton({ label, onClick, variant = 'primary', icon }) {
  return (
    <div className={`trigger-pill ${variant}`} onClick={onClick}>
      {icon && <span>{icon}</span>}
      {label}
    </div>
  );
}
