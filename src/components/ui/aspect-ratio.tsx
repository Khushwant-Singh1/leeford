"use client"

// Temporary implementation to avoid dependency issues
const AspectRatio = ({ ratio = 1, children, className, ...props }: {
  ratio?: number;
  children?: React.ReactNode;
  className?: string;
  [key: string]: any;
}) => {
  return (
    <div 
      className={className}
      style={{ 
        position: 'relative',
        width: '100%',
        paddingBottom: `${100 / ratio}%`
      }}
      {...props}
    >
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0
      }}>
        {children}
      </div>
    </div>
  );
};

export { AspectRatio }
