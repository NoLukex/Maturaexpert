import React from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';
import { cn } from '../../utils/cn';
import { Loader2 } from 'lucide-react';

interface ButtonProps extends HTMLMotionProps<"button"> {
    children: React.ReactNode;
    variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
    size?: 'sm' | 'md' | 'lg' | 'icon';
    isLoading?: boolean;
    disabled?: boolean;
}

const Button: React.FC<ButtonProps> = ({
    children,
    className,
    variant = 'primary',
    size = 'md',
    isLoading = false,
    disabled,
    ...props
}) => {
    const baseStyles = "inline-flex items-center justify-center rounded-xl font-bold transition-all focus:outline-none focus:ring-2 focus:ring-matura-accent/50 focus:ring-offset-2 focus:ring-offset-[#0A1628] disabled:opacity-50 disabled:cursor-not-allowed";

    const variants = {
        primary: "bg-matura-accent text-matura-bg shadow-[0_0_20px_rgba(245,197,24,0.3)] hover:bg-yellow-400 active:scale-95",
        secondary: "bg-white/10 text-white hover:bg-white/20 active:scale-95 backdrop-blur-md",
        outline: "border border-white/10 text-white hover:bg-white/5 active:scale-95",
        ghost: "text-gray-400 hover:text-white hover:bg-white/5 active:scale-95",
        danger: "bg-red-500/10 text-red-500 hover:bg-red-500/20 border border-red-500/20 active:scale-95"
    };

    const sizes = {
        sm: "px-3 py-1.5 text-xs",
        md: "px-6 py-3.5 text-sm",
        lg: "px-8 py-4 text-base",
        icon: "p-3"
    };

    return (
        <motion.button
            whileHover={{ scale: disabled || isLoading ? 1 : 1.02 }}
            whileTap={{ scale: disabled || isLoading ? 1 : 0.98 }}
            className={cn(
                baseStyles,
                variants[variant],
                sizes[size],
                className
            )}
            disabled={disabled || isLoading}
            {...props}
        >
            {isLoading ? (
                <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Ładowanie...
                </>
            ) : (
                children
            )}
        </motion.button>
    );
};

export default Button;
