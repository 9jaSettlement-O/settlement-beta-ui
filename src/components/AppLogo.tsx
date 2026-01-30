import { cn } from "@/lib/utils";

interface AppLogoProps {
  className?: string;
  width?: number;
  height?: number;
}

const AppLogo = ({ className, width = 107, height = 80 }: AppLogoProps) => {
  return (
    <img
      src="/assets/images/logo.png"
      alt="9jaSettlement Logo"
      className={cn("h-auto", className)}
      width={width}
      height={height}
    />
  );
};

export default AppLogo;
