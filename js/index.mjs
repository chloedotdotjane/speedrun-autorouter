import {Editor} from "./editor.mjs";


const canvas = document.querySelector('#main_canvas');
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

let e = new Editor(canvas);