/**
 * Custom class hierarchy for events relevant to editor
 */
import {
    MAP_BACKGROUND_STYLE,
    MAP_NODE_ACTIVE_STYLE,
    MAP_NODE_HOVER_STYLE,
    MAP_NODE_STYLE
} from "./style.mjs";

class EditorEvent extends Event {
    sourceEntity;

    constructor(type, sourceEntity) {
        super("editor_" + type);
        this.sourceEntity = sourceEntity;
    }
}

/**
 * Indicates no action should be taken in response to some UI interaction.
 * (No-op)
 */
class NopEditorEvent extends EditorEvent {
    constructor(sourceEntity) {
        super("null", sourceEntity);
    }
}

class Entity {
    zIndex;
    hovered = false;
    active = false;

    constructor() {
        this.zIndex = 0;
    }

    draw(ctx, xToPx, yToPx, dToPx) {

    }

    coordinateCollides(x, y) {
        return false;
    }

    handleMouseDown(dispatch) {
        dispatch(new EditorEvent("mousedown", this));
        return true;
    }

    handleMouseUp(dispatch) {
        dispatch(new EditorEvent("mouseup", this));
        return true;
    }

    handleMouseMove(dispatch) {
        dispatch(new EditorEvent("mousemove", this));
        return true;
    }

    handleWheel(dispatch, x, y, deltaX, deltaY) {
        let e = new EditorEvent("wheel", this);
        e.x = x;
        e.y = y;
        e.deltaX = deltaX;
        e.deltaY = deltaY;
        dispatch(e);
        return true;
    }

    setHovered(state) {
        this.hovered = state;
    }

    setActive(state) {
        this.active = state;
    }
}

/**
 * Just a test class, not actually useful or part of end goal
 */
class Rectangle extends Entity {
    constructor(x, y, width, height, color) {
        super();
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.color = color;
    }

    draw(ctx, xToPx, yToPx, dToPx) {
        super.draw(ctx, xToPx, yToPx, dToPx);

        ctx.globalAlpha = 0.4
        ctx.fillStyle = this.color;
        ctx.fillRect(xToPx(this.x), yToPx(this.y), dToPx(this.width), dToPx(this.height));
    }


    coordinateCollides(x, y) {
        return x >= this.x
            && x <= this.x + this.width
            && y >= this.y
            && y <= this.y + this.height;
    }

    handleMouseDown(dispatch) {
        dispatch(new EditorEvent("rect_mouse_down", this));
        return true;
    }
}

class MapNode extends Entity {
    x;
    y;
    style = MAP_NODE_STYLE;

    constructor(x, y) {
        super();
        this.x = x;
        this.y = y;
    }


    draw(ctx, xToPx, yToPx, dToPx) {
        super.draw(ctx, xToPx, yToPx, dToPx);

        ctx.globalAlpha = this.style.alpha;
        ctx.fillStyle = this.style.fillColor;
        ctx.strokeStyle = this.style.strokeColor;
        ctx.lineWidth = this.style.strokeWidth;
        ctx.beginPath();
        ctx.arc(xToPx(this.x), yToPx(this.y), dToPx(this.style.radius), 0, 2 * Math.PI);
        ctx.fill();
        ctx.stroke();
    }

    coordinateCollides(x, y) {
        return Math.hypot(this.x - x, this.y - y) < this.style.radius;
    }

    handleMouseDown(dispatch) {
        dispatch(new EditorEvent("map_node_mousedown", this));
        return true;
    }

    handleMouseUp(dispatch) {
        dispatch(new EditorEvent("map_node_mouseup", this));
        return true;
    }

    handleMouseMove(dispatch) {
        dispatch(new EditorEvent("map_node_mousemove", this));
        return true;
    }

    setHovered(state) {
        super.setHovered(state);

        this.updateStyle();
    }

    setActive(state) {
        super.setActive(state);

        this.updateStyle();
    }

    updateStyle() {
        if (this.active)
            this.style = MAP_NODE_ACTIVE_STYLE;
        else if (this.hovered)
            this.style = MAP_NODE_HOVER_STYLE;
        else
            this.style = MAP_NODE_STYLE;
    }
}


class Viewport extends EventTarget {
    // coordinate system x value aligning with left side of canvas
    x;
    // coordinate system y value aligning with top side of canvas
    y;
    // how many pixels are represented by one unit of our coordinate system
    scaleFactor;

    // we take over an entire canvas (for now, at least). Makes it
    // easier not needing to worry about overflow management.
    canvas;
    ctx;

    // scale coordinate x value to screen pixel x
    xToPx;
    // scale coordinate y value to screen pixel y
    yToPx;
    // scale coordinate distance to screen pixel distance
    dToPx;
    // scale screen pixel x to coordinate x
    xFromPx;
    // scale screen pixel y to coordinate y
    yFromPx;
    // scale screen pixel distance to coordinate distance
    dFromPx;

    // list of instances we know about
    entities;

    constructor(canvas) {
        super();
        this.canvas = canvas;
        let left = canvas.offsetLeft + canvas.clientLeft;
        let top = canvas.offsetTop + canvas.clientTop;
        let self = this;
        this.canvas.addEventListener('mousedown', function (event) {
            event.preventDefault();
            let x = self.xFromPx(event.pageX - left);
            let y = self.yFromPx(event.pageY - top);
            self.handleMouseDown(x, y);
        }, false);
        this.canvas.addEventListener('mouseup', function (event) {
            event.preventDefault();
            let x = self.xFromPx(event.pageX - left);
            let y = self.yFromPx(event.pageY - top);
            self.handleMouseUp(x, y);
        }, false);
        this.canvas.addEventListener('mousemove', function (event) {
            event.preventDefault();
            let x = self.xFromPx(event.pageX - left);
            let y = self.yFromPx(event.pageY - top);
            self.handleMouseMove(x, y);
        }, false);
        this.canvas.addEventListener('wheel', function (event) {
            event.preventDefault();
            let x = self.xFromPx(event.pageX - left);
            let y = self.yFromPx(event.pageY - top);
            self.handleWheel(x, y, event.deltaX, event.deltaY);
        }, false);
        this.ctx = this.canvas.getContext('2d');
        this.setView(0, 0, 2)
        this.entities = []
    }

    setView(x, y, scaleFactor) {
        this.x = x;
        this.y = y;
        this.scaleFactor = scaleFactor;

        this.xToPx = x => (x - this.x) * this.scaleFactor;
        this.yToPx = y => (y - this.y) * this.scaleFactor;
        this.dToPx = a => a * this.scaleFactor;

        // inverse of above functions
        this.xFromPx = x => this.x + (x / this.scaleFactor);
        this.yFromPx = y => this.y + (y / this.scaleFactor);
        this.dFromPx = a => a / this.scaleFactor;
    }

    changeScaleCenteredOnPoint(x, y, newScaleFactor) {
        // keep pixel x, y position constant (this.x and this.y will change,
        // they represent the abstract position lining up with pixel
        // positions x=0, y=0 respectively)

        let px_x = this.xToPx(x)
        let px_y = this.yToPx(y)

        let new_x = x - px_x / newScaleFactor;
        let new_y = y - px_y / newScaleFactor;

        this.setView(new_x, new_y, newScaleFactor);
    }

    addEntity(e) {
        this.entities.push(e)
        // higher z-index = precedence for handling clicks; put them at
        // front of the list
        this.entities.sort((a, b) => {
            return a.zIndex < b.zIndex;
        })
    }

    draw() {
        this.ctx.fillStyle = MAP_BACKGROUND_STYLE.fillColor;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        for (let e of this.entities)
            this.drawEntity(e);
    }

    drawEntity(e) {
        this.ctx.save()

        e.draw(this.ctx, this.xToPx, this.yToPx, this.dToPx);

        this.ctx.restore()
    }

    handleMouseDown(x, y) {
        for (let e of this.entities) {
            if (e.coordinateCollides(x, y) && e.handleMouseDown((e) => this.dispatchEvent(e)))
                return;
        }

        this.dispatchEvent(new EditorEvent("bg_mousedown", null));
    }

    handleMouseUp(x, y) {
        for (let e of this.entities) {
            if (e.coordinateCollides(x, y) && e.handleMouseUp((e) => this.dispatchEvent(e)))
                return;
        }

        this.dispatchEvent(new EditorEvent("bg_mouseup", null));
    }

    handleMouseMove(x, y) {
        for (let e of this.entities) {
            if (e.coordinateCollides(x, y) && e.handleMouseMove((e) => this.dispatchEvent(e)))
                return;
        }

        this.dispatchEvent(new EditorEvent("bg_mousemove", null));
    }

    handleWheel(x, y, deltaX, deltaY) {
        for (let e of this.entities) {
            if (e.coordinateCollides(x, y)
                && e.handleWheel((e) => this.dispatchEvent(e), x, y, deltaX, deltaY))
                return;
        }

        let e = new EditorEvent("bg_wheel", this);
        e.x = x;
        e.y = y;
        e.deltaX = deltaX;
        e.deltaY = deltaY;
        this.dispatchEvent(e);
    }

    addEditorEventListener(type, listener, options) {
        this.addEventListener("editor_" + type, listener, options);
    }

    removeEditorEventListener(type, callback, options) {
        this.removeEventListener("editor_" + type, callback, options);
    }

}

export class Editor {
    viewport;

    hoveredEntity = null;
    activeEntity = null;

    constructor(canvas) {
        this.viewport = new Viewport(canvas);
        this.viewport.addEntity(new Rectangle(30, 81, 100, 50, 'rgb(100, 100,' +
            ' 100'));
        this.viewport.addEntity(new Rectangle(50, 100, 100, 150, 'rgb(100,' +
            ' 200, 100'));
        this.viewport.addEntity(new MapNode(200, 200));
        this.viewport.draw()
        let events = [
            "mousedown",
            "mouseup",
            "mousemove",
            "wheel",
            "map_node_mousedown",
            "map_node_mouseup",
            "map_node_mousemove",
            "map_node_wheel",
            "bg_mousedown",
            "bg_mouseup",
            "bg_mousemove",
            "bg_wheel",

        ]
        for (let e of events)
            this.viewport.addEditorEventListener(e, (e) => this.handle_editor_event(e))

        for (let e of events) {
            if (e.endsWith("mousemove"))
                this.viewport.addEditorEventListener(e, (e) => this.handle_editor_mousemove_event(e))

        }
        for (let e of events) {
            if (e.endsWith("wheel"))
                this.viewport.addEditorEventListener(e, (e) => this.handle_editor_wheel_event(e))

        }
    }

    handle_editor_event(e) {

    }

    handle_editor_mousemove_event(e) {
        if (e.sourceEntity !== this.hoveredEntity) {
            this.hoveredEntity?.setHovered(false);
            e.sourceEntity?.setHovered(true);

            this.hoveredEntity = e.sourceEntity;

            this.viewport.draw();
        }
    }

    handle_editor_wheel_event(e) {
        let newScale = this.viewport.scaleFactor - e.deltaY / 10.0;
        if (newScale > 10)
            newScale = 10;
        if (newScale < 0.1)
            newScale = 0.1;

        this.viewport.changeScaleCenteredOnPoint(e.x, e.y, newScale);
        this.viewport.draw();
    }
}