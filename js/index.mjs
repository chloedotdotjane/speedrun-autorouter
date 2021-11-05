import {Editor} from "./editor.mjs";


const canvas = document.querySelector('#main_canvas');
canvas.width = window.innerWidth - 120 - 350;
canvas.height = window.innerHeight - 50;

const toolButtons = {
    pointer: document.getElementById("pointer_tool"),
    addNode: document.getElementById("add_node_tool"),
    addEdge: document.getElementById("add_edge_tool"),
}

let e = new Editor(canvas, toolButtons);

console.log(e.serializeEntities(2))