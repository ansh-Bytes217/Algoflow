import React, { useRef, useState, useEffect } from 'react';
import { X, Pen, Eraser, Trash2, MousePointer2, Circle, Square, Minus } from 'lucide-react';

interface Props {
  onClose: () => void;
}

type Tool = 'pen' | 'eraser';
type Color = '#000000' | '#ef4444' | '#3b82f6' | '#22c55e';

export const Whiteboard: React.FC<Props> = ({ onClose }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [tool, setTool] = useState<Tool>('pen');
  const [color, setColor] = useState<Color>('#000000');
  const [lineWidth, setLineWidth] = useState(3);
  const [context, setContext] = useState<CanvasRenderingContext2D | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Handle high DPI displays
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    ctx.scale(dpr, dpr);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    setContext(ctx);

    // Initial background (transparent, but we rely on CSS for the grid)
  }, []);

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!context) return;
    
    setIsDrawing(true);
    const { x, y } = getCoordinates(e);
    
    context.beginPath();
    context.moveTo(x, y);
    context.strokeStyle = tool === 'eraser' ? '#f8fafc' : color; // Eraser paints background color
    context.lineWidth = tool === 'eraser' ? 20 : lineWidth;
    
    // For eraser, we might use globalCompositeOperation, but painting white works for simple whiteboard
    if (tool === 'eraser') {
       // context.globalCompositeOperation = 'destination-out'; // This makes it transparent showing the grid
       // Actually, to keep the grid visible, 'destination-out' is better if the grid is CSS background
       context.globalCompositeOperation = 'destination-out';
    } else {
       context.globalCompositeOperation = 'source-over';
    }
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !context) return;
    const { x, y } = getCoordinates(e);
    context.lineTo(x, y);
    context.stroke();
  };

  const stopDrawing = () => {
    if (!context) return;
    context.closePath();
    setIsDrawing(false);
  };

  const getCoordinates = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    
    const rect = canvas.getBoundingClientRect();
    let clientX, clientY;
    
    if ('touches' in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = (e as React.MouseEvent).clientX;
      clientY = (e as React.MouseEvent).clientY;
    }
    
    return {
      x: clientX - rect.left,
      y: clientY - rect.top
    };
  };

  const clearBoard = () => {
    if (!context || !canvasRef.current) return;
    context.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-50 flex flex-col animate-in fade-in duration-200">
      
      {/* Top Bar */}
      <div className="h-14 border-b border-slate-200 bg-white flex items-center justify-between px-6 shadow-sm z-10">
        <div className="flex items-center space-x-3">
            <div className="p-2 bg-pink-100 rounded-lg">
                <Pen className="text-pink-600" size={20} />
            </div>
            <h2 className="text-lg font-bold text-slate-800">Ideation Whiteboard</h2>
        </div>
        <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600 transition-colors">
            <X size={24} />
        </button>
      </div>

      {/* Toolbar - Floating Bottom */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 bg-white rounded-full shadow-2xl border border-slate-200 p-2 flex items-center space-x-2 z-20">
         
         {/* Tools */}
         <div className="flex items-center space-x-1 border-r border-slate-200 pr-2">
             <button 
                onClick={() => setTool('pen')}
                className={`p-3 rounded-full transition-all ${tool === 'pen' ? 'bg-indigo-100 text-indigo-600 ring-2 ring-indigo-500 ring-offset-2' : 'hover:bg-slate-100 text-slate-600'}`}
             >
                <Pen size={20} />
             </button>
             <button 
                onClick={() => setTool('eraser')}
                className={`p-3 rounded-full transition-all ${tool === 'eraser' ? 'bg-indigo-100 text-indigo-600 ring-2 ring-indigo-500 ring-offset-2' : 'hover:bg-slate-100 text-slate-600'}`}
             >
                <Eraser size={20} />
             </button>
         </div>

         {/* Colors */}
         <div className="flex items-center space-x-2 px-2 border-r border-slate-200 pr-4">
             {(['#000000', '#ef4444', '#3b82f6', '#22c55e'] as Color[]).map(c => (
                 <button
                    key={c}
                    onClick={() => { setTool('pen'); setColor(c); }}
                    className={`w-6 h-6 rounded-full border-2 transition-transform hover:scale-110 ${color === c && tool === 'pen' ? 'border-indigo-500 scale-125' : 'border-transparent'}`}
                    style={{ backgroundColor: c }}
                 />
             ))}
         </div>

         {/* Thickness */}
         <div className="flex items-center space-x-2 px-2 border-r border-slate-200 pr-4">
            <button onClick={() => setLineWidth(Math.max(1, lineWidth - 1))} className="p-2 hover:bg-slate-100 rounded-full text-slate-500">
                <Minus size={14} />
            </button>
            <div className="w-8 flex justify-center">
                <div className="bg-slate-800 rounded-full" style={{ width: lineWidth, height: lineWidth, minWidth: 2, minHeight: 2 }} />
            </div>
            <button onClick={() => setLineWidth(Math.min(20, lineWidth + 1))} className="p-2 hover:bg-slate-100 rounded-full text-slate-500">
                <Plus size={14} /> // Note: Need to import Plus if using it, simplified to text or icon
            </button>
         </div>

         {/* Actions */}
         <button 
            onClick={clearBoard}
            className="p-3 hover:bg-red-50 text-slate-500 hover:text-red-500 rounded-full transition-colors"
            title="Clear Board"
         >
            <Trash2 size={20} />
         </button>
      </div>

      {/* Canvas Area */}
      <div className="flex-1 relative overflow-hidden bg-slate-50 cursor-crosshair touch-none">
         {/* Dot Grid Background */}
         <div className="absolute inset-0 pointer-events-none opacity-20"
              style={{ 
                  backgroundImage: 'radial-gradient(#94a3b8 2px, transparent 2px)', 
                  backgroundSize: '24px 24px' 
              }}>
         </div>
         
         <canvas
            ref={canvasRef}
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={stopDrawing}
            onMouseLeave={stopDrawing}
            onTouchStart={startDrawing}
            onTouchMove={draw}
            onTouchEnd={stopDrawing}
            className="w-full h-full block"
         />
      </div>
    </div>
  );
};

// Helper for 'Plus' icon not imported initially
const Plus: React.FC<{size?: number}> = ({size=24}) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg>
);