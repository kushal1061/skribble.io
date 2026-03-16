import React, { useRef, useEffect, useState } from "react";

export default function DrawingCanvas({ turn, socket, roomId }) {
  const canvasRef = useRef(null);
  const [drawing, setDrawing] = useState(false);
  const [color, setColor] = useState("black");
  const [size, setSize] = useState(3);
  const lastPos = useRef(null);

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

    socket.on("draw", drawListener);
    socket.on("clear-canvas", clearListener);

    return () => {
      socket.off("draw", drawListener);
      socket.off("clear-canvas", clearListener);
    };
  }, [socket]);

  const startDrawing = (e) => {
    if (turn !== "your_turn") return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(e.nativeEvent.offsetX, e.nativeEvent.offsetY);
    remoteDraw(e.nativeEvent.offsetX, e.nativeEvent.offsetY, "start");
    setDrawing(true);
  };

  const draw = (e) => {
    if (!drawing || turn !== "your_turn") return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    ctx.beginPath();
    ctx.moveTo(lastPos.current?.x ?? e.nativeEvent.offsetX, lastPos.current?.y ?? e.nativeEvent.offsetY);
    ctx.lineTo(e.nativeEvent.offsetX, e.nativeEvent.offsetY);
    ctx.strokeStyle = color;
    ctx.lineWidth = size;
    ctx.lineCap = "round";
    ctx.stroke();
    lastPos.current = { x: e.nativeEvent.offsetX, y: e.nativeEvent.offsetY };
    remoteDraw(e.nativeEvent.offsetX, e.nativeEvent.offsetY, "middle");
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
  };

  const clearCanvas = () => {
    if (!roomId) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    socket.emit("clear-canvas", { roomId });
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
        <button className="border-2 border-solid border-black h-7 w-7" onClick={()=>{setColor("#ffffff")}} ></button>
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
