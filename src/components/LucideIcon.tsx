import { LUCIDE_ICON_PATHS, type LucideIconName } from '../lib/lucide-icons';

interface LucideIconProps {
  name: LucideIconName;
  size?: number;
  strokeWidth?: number;
  class?: string;
  className?: string;
}

export default function LucideIcon({
  name,
  size = 18,
  strokeWidth = 1.75,
  class: classProp = '',
  className = '',
}: LucideIconProps) {
  const innerPaths = LUCIDE_ICON_PATHS[name] || LUCIDE_ICON_PATHS.calculator;
  const combinedClass = `shrink-0 ${classProp} ${className}`.trim();

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width={strokeWidth}
      stroke-linecap="round"
      stroke-linejoin="round"
      aria-hidden="true"
      class={combinedClass}
      dangerouslySetInnerHTML={{ __html: innerPaths }}
    />
  );
}
