import React, { useRef, useEffect, useState } from "react";

export default function DrawingCanvas({ turn, socket, roomId }) {
  const canvasRef = useRef(null);
  const [drawing, setDrawing] = useState(false);
  const [color, setColor] = useState("black");
  const [size, setSize] = useState(3);
  const lastPos = useRef(null);
  const historyStack = useRef([]);
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    const drawListener = (data) => {
      const { x, y, color: remoteColor, size: remoteSize, type } = data;
      console.log("Received draw event:", type);
      if (type === "end") {
        lastPos.current = null;
        return;
      }

      ctx.strokeStyle = remoteColor;
      ctx.lineWidth = remoteSize;
      ctx.lineCap = "round";

      if (type === "start") {
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
      const ctx = canvas.getContext("2d");
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
    socket.on("draw", drawListener);
    socket.on("clear-canvas", clearListener);
    socket.on('undo-canvas', onUndoCanvas);
    return () => {
      socket.off("draw", drawListener);
      socket.off("clear-canvas", clearListener);
    };
  }, [socket]);

  const getPos = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
      x: e.nativeEvent.offsetX * scaleX,
      y: e.nativeEvent.offsetY * scaleY,
    };
  };

  const startDrawing = (e) => {
    if (turn !== "your_turn") return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const { x, y } = getPos(e);
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(x, y);
    remoteDraw(x, y, "start");
    setDrawing(true);
  };

  const draw = (e) => {
    if (!drawing || turn !== "your_turn") return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const { x, y } = getPos(e);
    ctx.beginPath();
    ctx.moveTo(lastPos.current?.x ?? x, lastPos.current?.y ?? y);
    ctx.lineTo(x, y);
    ctx.strokeStyle = color;
    ctx.lineWidth = size;
    ctx.lineCap = "round";
    ctx.stroke();
    lastPos.current = { x, y };
    remoteDraw(x, y, "middle");
  };

  const remoteDraw = (x, y, type) => {
    if (!roomId) return;
    socket.emit("draw", { roomId, x, y, color, size, type });
    console.log("Emitted draw event:", type);
  };

  const stopDrawing = () => {
    if (!drawing) return;
    remoteDraw(0, 0, "end");
    lastPos.current = null;
    setDrawing(false);
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const snapshot = ctx.getImageData(0, 0, canvas.width, canvas.height);
    historyStack.current.push(snapshot);
  };

  const clearCanvas = () => {
    if (!roomId) return;
    if (turn !== "your_turn") return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    socket.emit("clear-canvas", { roomId });
  };
  const undoCanvas = () => {
    if (historyStack.current.length === 0) return;
    historyStack.current.pop();
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (historyStack.current.length === 0) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      socket.emit("undo-canvas", { roomId, imageData: null });
    } else {
      const prev = historyStack.current[historyStack.current.length - 1];
      ctx.putImageData(prev, 0, 0);
      // Send as base64 so remote clients can restore it
      socket.emit("undo-canvas", { roomId, imageData: canvas.toDataURL() });
    }
  };
  return (
    <div className="flex h-[30rem] flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center gap-3">
        <input
          disabled={turn !== "your_turn"}
          type="color"
          value={color}
          onChange={(e) => setColor(e.target.value)}
          className="h-10 w-14 cursor-pointer rounded-lg border border-slate-300 bg-white p-1 disabled:cursor-not-allowed"
        />
        <input
          disabled={turn !== "your_turn"}
          type="range"
          value={size}
          onChange={(e) => setSize(Number(e.target.value))}
          min={1}
          max={10}
          className="w-40 accent-slate-800"
        />
        <button className="border-2 border-solid border-black h-7 w-7" onClick={() => { setColor("#ffffff") }} ></button>
        <button
          disabled={turn !== "your_turn"}
          onClick={undoCanvas}
          className="rounded-xl border border-slate-300 px-3 py-2 text-sm font-medium hover:bg-slate-100 disabled:cursor-not-allowed"
        >
          ↩ Undo
        </button>
      </div>

      <canvas
        ref={canvasRef}
        width={800}
        height={500}
        className="h-3/4 w-full rounded-2xl border border-slate-200 bg-white shadow"
        onMouseDown={startDrawing}
        onMouseMove={draw}
        onMouseUp={stopDrawing}
        onMouseLeave={stopDrawing}
      />

      <button
        onClick={clearCanvas}
        className="mt-4 self-start rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white shadow transition hover:bg-slate-700"
      >
        Clear Canvas
      </button>
    </div>
  );
}
