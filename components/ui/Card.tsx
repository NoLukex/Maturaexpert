import React from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';
import { cn } from '../../utils/cn';

interface CardProps extends HTMLMotionProps<"div"> {
    children: React.ReactNode;
    variant?: 'default' | 'glass' | 'outline' | 'ghost';
    noPadding?: boolean;
}

const Card: React.FC<CardProps> = ({
    children,
    className,
    variant = 'glass',
    noPadding = false,
    ...props
}) => {
    const variants = {
        default: "bg-[#0F1B2D] border border-white/5",
        glass: "bg-[#112240]/70 backdrop-blur-xl border border-white/5 shadow-xl",
        outline: "bg-transparent border border-white/10",
        ghost: "bg-transparent border-none"
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className={cn(
                "rounded-3xl overflow-hidden transition-colors",
                variants[variant],
                !noPadding && "p-6",
                className
            )}
            {...props}
        >
            {children}
        </motion.div>
    );
};

export default Card;
