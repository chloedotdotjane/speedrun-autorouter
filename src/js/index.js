const canvas = document.querySelector('#main_canvas');
const width = canvas.width = window.innerWidth;
const height = canvas.height = window.innerHeight;

function degToRad(degrees) {
  return degrees * Math.PI / 180;
};


const ctx = canvas.getContext('2d');
ctx.fillStyle = 'rgb(0, 0, 255)';
ctx.beginPath();
ctx.arc(150, 106, 50, degToRad(0), degToRad(360), false);
ctx.fill();