const canvas = document.getElementById("crop-canvas");
const ctx = canvas.getContext("2d");

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

let startX,
  startY,
  isDrawing = false;

canvas.addEventListener("mousedown", (e) => {
  startX = e.clientX;
  startY = e.clientY;
  isDrawing = true;
});

canvas.addEventListener("mousemove", (e) => {
  if (!isDrawing) return;

  const x = e.clientX;
  const y = e.clientY;

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.clearRect(startX, startY, x - startX, y - startY);
  ctx.strokeStyle = "red";
  ctx.strokeRect(startX, startY, x - startX, y - startY);
});

canvas.addEventListener("mouseup", (e) => {
  isDrawing = false;
  const x = e.clientX;
  const y = e.clientY;

  const rect = {
    x: Math.min(startX, x),
    y: Math.min(startY, y),
    width: Math.abs(x - startX),
    height: Math.abs(y - startY),
  };

  const urlParams = new URLSearchParams(window.location.search);
  const displayId = urlParams.get("displayId");
  window.horseAPI.sendCropSelection({ rect, displayId });
});

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    window.horseAPI.sendCropSelection({ rect: null, displayId: null });
  }
});
