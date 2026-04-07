import React, { useRef, useEffect, useState } from 'react';

const hexToRgba = (hex) => {
  const cleanHex = hex.replace('#', '');
  if (cleanHex.length === 3) {
    return [
      parseInt(cleanHex[0] + cleanHex[0], 16),
      parseInt(cleanHex[1] + cleanHex[1], 16),
      parseInt(cleanHex[2] + cleanHex[2], 16),
      255
    ];
  }
  return [
    parseInt(cleanHex.substring(0, 2), 16),
    parseInt(cleanHex.substring(2, 4), 16),
    parseInt(cleanHex.substring(4, 6), 16),
    255
  ];
};

const matchStartColor = (data, pos, startR, startG, startB, startA) => {
  return data[pos] === startR && data[pos + 1] === startG && data[pos + 2] === startB && data[pos + 3] === startA;
};

const colorPixel = (data, pos, r, g, b, a) => {
  data[pos] = r;
  data[pos + 1] = g;
  data[pos + 2] = b;
  data[pos + 3] = a;
};

const performFloodFill = (ctx, startX, startY, fillColor) => {
  const canvas = ctx.canvas;
  const w = canvas.width;
  const h = canvas.height;
  const imageData = ctx.getImageData(0, 0, w, h);
  const data = imageData.data;

  startX = Math.floor(startX);
  startY = Math.floor(startY);
  const startPos = (startY * w + startX) * 4;

  const startR = data[startPos];
  const startG = data[startPos + 1];
  const startB = data[startPos + 2];
  const startA = data[startPos + 3];

  const [fillR, fillG, fillB, fillA] = hexToRgba(fillColor);

  if (startR === fillR && startG === fillG && startB === fillB && startA === fillA) {
    return;
  }

  const pixelStack = [[startX, startY]];

  while (pixelStack.length > 0) {
    const [x, y] = pixelStack.pop();
    let currentY = y;
    let pos = (currentY * w + x) * 4;

    while (currentY >= 0 && matchStartColor(data, pos, startR, startG, startB, startA)) {
      currentY--;
      pos -= w * 4;
    }
    
    pos += w * 4;
    currentY++;

    let reachLeft = false;
    let reachRight = false;

    while (currentY < h && matchStartColor(data, pos, startR, startG, startB, startA)) {
      colorPixel(data, pos, fillR, fillG, fillB, fillA);

      if (x > 0) {
        if (matchStartColor(data, pos - 4, startR, startG, startB, startA)) {
          if (!reachLeft) {
            pixelStack.push([x - 1, currentY]);
            reachLeft = true;
          }
        } else if (reachLeft) {
          reachLeft = false;
        }
      }

      if (x < w - 1) {
        if (matchStartColor(data, pos + 4, startR, startG, startB, startA)) {
          if (!reachRight) {
            pixelStack.push([x + 1, currentY]);
            reachRight = true;
          }
        } else if (reachRight) {
          reachRight = false;
        }
      }

      currentY++;
      pos += w * 4;
    }
  }

  ctx.putImageData(imageData, 0, 0);
};

export default function DrawingCanvas({ turn, socket, roomId }) {
  const canvasRef = useRef(null);
  const [drawing, setDrawing] = useState(false);
  const [color, setColor] = useState('#000000');
  const [size, setSize] = useState(3);
  const [tool, setTool] = useState('brush'); // 'brush', 'eraser', 'bucket'
  const lastPos = useRef(null);
  const historyStack = useRef([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const drawListener = (data) => {
      const { x, y, color: remoteColor, size: remoteSize, type } = data;
      
      if (type === 'fill') {
        performFloodFill(ctx, x, y, remoteColor);
        return;
      }

      if (type === 'end') {
        lastPos.current = null;
        return;
      }

      ctx.strokeStyle = remoteColor;
      ctx.lineWidth = remoteSize;
      ctx.lineCap = 'round';

      if (type === 'start') {
        lastPos.current = { x, y };
      } else {
        if (!lastPos.current) return;
        ctx.beginPath();
        ctx.moveTo(lastPos.current.x, lastPos.current.y);
        ctx.lineTo(x, y);
        ctx.stroke();
        lastPos.current = { x, y };
      }
    };

    const clearListener = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    };

    const onUndoCanvas = ({ imageData }) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!imageData) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      } else {
        const img = new Image();
        img.onload = () => {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(img, 0, 0);
        };
        img.src = imageData;
      }
    };

    socket.on('turn-ended', () => {
      historyStack.current = [];
    });
    socket.on('draw', drawListener);
    socket.on('clear-canvas', clearListener);
    socket.on('undo-canvas', onUndoCanvas);

    return () => {
      socket.off('draw', drawListener);
      socket.off('clear-canvas', clearListener);
      socket.off('undo-canvas', onUndoCanvas);
    };
  }, [socket]);

  const getPos = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    // Support both mouse and touch events
    const clientX = e.touches ? e.touches[0].clientX : e.nativeEvent.offsetX + rect.left;
    const clientY = e.touches ? e.touches[0].clientY : e.nativeEvent.offsetY + rect.top;

    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY,
    };
  };

  const startDrawing = (e) => {
    if (turn !== 'your_turn') return;
    if (e.touches) e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const { x, y } = getPos(e);
    
    if (tool === 'bucket') {
      performFloodFill(ctx, x, y, color);
      remoteDraw(x, y, 'fill');
      
      const snapshot = ctx.getImageData(0, 0, canvas.width, canvas.height);
      historyStack.current.push(snapshot);
      return;
    }

    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(x, y);
    remoteDraw(x, y, 'start');
    setDrawing(true);
  };

  const draw = (e) => {
    if (!drawing || turn !== 'your_turn' || tool === 'bucket') return;
    if (e.touches) e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const { x, y } = getPos(e);
    ctx.beginPath();
    ctx.moveTo(lastPos.current?.x ?? x, lastPos.current?.y ?? y);
    ctx.lineTo(x, y);
    
    const effectiveColor = tool === 'eraser' ? '#ffffff' : color;
    ctx.strokeStyle = effectiveColor;
    ctx.lineWidth = size;
    ctx.lineCap = 'round';
    ctx.stroke();
    lastPos.current = { x, y };
    remoteDraw(x, y, 'middle');
  };

  const remoteDraw = (x, y, type) => {
    if (!roomId) return;
    const effectiveColor = tool === 'eraser' ? '#ffffff' : color;
    socket.emit('draw', { roomId, x, y, color: effectiveColor, size, type });
  };

  const stopDrawing = () => {
    if (!drawing || tool === 'bucket') return;
    remoteDraw(0, 0, 'end');
    lastPos.current = null;
    setDrawing(false);
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      const snapshot = ctx.getImageData(0, 0, canvas.width, canvas.height);
      historyStack.current.push(snapshot);
    }
  };

  const clearCanvas = () => {
    if (!roomId) return;
    if (turn !== 'your_turn') return;
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      socket.emit('clear-canvas', { roomId });
    }
  };
  const undoCanvas = () => {
    if (historyStack.current.length === 0) return;
    historyStack.current.pop();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (historyStack.current.length === 0) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      socket.emit('undo-canvas', { roomId, imageData: null });
    } else {
      const prev = historyStack.current[historyStack.current.length - 1];
      ctx.putImageData(prev, 0, 0);
      // Send as base64 so remote clients can restore it
      socket.emit('undo-canvas', { roomId, imageData: canvas.toDataURL() });
    }
  };

  return (
    <div className="flex h- flex-col rounded-3xl bg-[#f0f0f0] p-4 skribbl-box gap-4 flex-1">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 lg:gap-4 w-full h-[3.5rem]">
          <input
            disabled={turn !== 'your_turn'}
            type="color"
            value={color}
            onChange={(e) => setColor(e.target.value)}
            className="h-10 w-14 lg:h-12 lg:w-16 cursor-pointer rounded-2xl border-none outline-none disabled:opacity-50 skribbl-box p-1 bg-white"
            title="Brush Color"
          />
          <div className="flex bg-white rounded-2xl skribbl-box p-1 px-4 items-center flex-1 h-full gap-4">
             <input
               disabled={turn !== 'your_turn'}
               type="range"
               value={size}
               onChange={(e) => setSize(Number(e.target.value))}
               min={1}
               max={50}
               className="flex-1 accent-sky-500 cursor-pointer disabled:opacity-50"
             />
             
             <div className="flex gap-2">
               <button
                 className={`h-10 w-10 rounded-xl border-2 transition text-lg flex justify-center items-center ${tool === 'brush' ? 'bg-sky-200 border-sky-400' : 'bg-white border-stone-200 hover:bg-stone-200'} disabled:opacity-50`}
                 onClick={() => setTool('brush')}
                 disabled={turn !== 'your_turn'}
                 title="Brush"
               >
                 🖌️
               </button>
               <button
                 className={`h-10 w-10 rounded-xl border-2 transition text-lg flex justify-center items-center ${tool === 'eraser' ? 'bg-sky-200 border-sky-400' : 'bg-white border-stone-200 hover:bg-stone-200'} disabled:opacity-50`}
                 onClick={() => setTool('eraser')}
                 disabled={turn !== 'your_turn'}
                 title="Eraser"
               >
                 🧼
               </button>
               <button
                 className={`h-10 w-10 rounded-xl border-2 transition text-lg flex justify-center items-center ${tool === 'bucket' ? 'bg-sky-200 border-sky-400' : 'bg-white border-stone-200 hover:bg-stone-200'} disabled:opacity-50`}
                 onClick={() => setTool('bucket')}
                 disabled={turn !== 'your_turn'}
                 title="Fill Bucket"
               >
                 🪣
               </button>
             </div>
          </div>
          <button
            disabled={turn !== 'your_turn'}
            onClick={undoCanvas}
            className="h-12 rounded-2xl bg-orange-400 text-white font-black px-4 lg:px-6 skribbl-btn disabled:opacity-50 hover:bg-orange-500 text-base whitespace-nowrap"
          >
            ← Undo
          </button>
          <button
            onClick={clearCanvas}
            disabled={turn !== 'your_turn'}
            className="h-12 rounded-2xl bg-red-400 px-4 lg:px-6 text-base font-black text-white skribbl-btn hover:bg-red-500 disabled:opacity-50 whitespace-nowrap"
          >
             Clear
          </button>
        </div>
      </div>

      <div className={`flex-1 relative w-full rounded-2xl overflow-hidden skribbl-box bg-white ${tool === 'bucket' ? 'cursor-alias' : 'cursor-crosshair'}`}>
        <canvas
          ref={canvasRef}
          width={800}
          height={500}
          className="absolute inset-0 w-full h-full touch-none"
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
          onTouchCancel={stopDrawing}
        />
      </div>
    </div>
  );
}
