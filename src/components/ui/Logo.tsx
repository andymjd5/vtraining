interface LogoProps {
  className?: string;
}

const Logo = ({ className = "h-20 w-auto" }: LogoProps) => {
  return (
    <div className="flex items-center">
      <img 
        src="/vtlogo.png"
        alt="Vision Training Logo" 
        className={className}
      />
    </div>
  );
};

export default Logo;
