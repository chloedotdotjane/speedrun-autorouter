import {Rectangle, Viewport} from "./editor.mjs";


const canvas = document.querySelector('#main_canvas');

let vp = new Viewport(canvas)

vp.add_entity(new Rectangle(30, 81, 100, 50, 'rgb(50, 50, 80'));
vp.add_entity(new Rectangle(50, 100, 100, 150, 'rgb(50, 50, 80'));

let r = new Rectangle(60, 90, 10, 10, 'rgb(70, 50, 50)');
r.z_index = 10;
vp.add_entity(r);

vp.draw()

