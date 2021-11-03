/**
 * Custom class hierarchy for events relevant to editor
 */
import {
    MAP_BACKGROUND_STYLE,
    MAP_NODE_ACTIVE_STYLE, MAP_NODE_HELD_STYLE,
    MAP_NODE_HOVER_STYLE,
    MAP_NODE_STYLE
} from "./style.mjs";

class EditorEvent extends Event {
    sourceEntity;

    constructor(type, sourceEntity, props = {}) {
        super("editor_" + type);
        this.sourceEntity = sourceEntity;

        for (const [key, value] of Object.entries(props)) {
            this[key] = value;
        }
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
    zIndex = 0;
    hovered = false;
    active = false;

    /* is non-null if currently held */
    moveHandleOffset = null;

    constructor() {
    }

    /**
     * subclasses should override this is x, y does not represent center
     * point -- it's used to e.g. to determine both how to move an entity and
     * collision with a selection box.
     * @returns {{x, y}}
     */
    getCenterPointCoord() {
        return {x: this.x, y: this.y};
    }

    /**
     * subclasses should override this is x, y does not represent center
     * point -- it's used to e.g. to determine both how to move an entity and
     * collision with a selection box.
     *
     * @param x: new center point x
     * @param y: new center point y
     */
    setCenterPointCoord(x, y) {
        this.x = x;
        this.y = y;
    }

    /**
     * Using this canvas's context, draw this entity.
     *
     * With the exception of this function and where annotated as px_, x and
     * y values are an abstract coordinate system. Conversion functions are
     * necessarily provided to convert coordinates to pixel values.
     * @param ctx: 2d context of an html canvas
     * @param xToPx function converting an absolute x value to pixel x position
     * @param yToPx function converting an absolute y value to pixel y position
     * @param dToPx function converting distance in abstract coordinates to
     * distance in pixels
     */
    draw(ctx, xToPx, yToPx, dToPx) {

    }

    coordinateCollides(x, y) {
        return false;
    }

    handleMouseDown(dispatch, x, y) {
        dispatch(new EditorEvent("entity_mousedown", this, {x: x, y: y}));
        return true;
    }

    handleMouseUp(dispatch, x, y) {
        dispatch(new EditorEvent("entity_mouseup", this, {x: x, y: y}));
        return true;
    }

    handleMouseMove(dispatch, x, y) {
        dispatch(new EditorEvent("entity_mousemove", this, {x: x, y: y}));
        return true;
    }

    handleWheel(dispatch, x, y, deltaX, deltaY) {
        let e = new EditorEvent("entity_wheel", this);
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

    startMove(handle_x, handle_y) {
        let {x, y} = this.getCenterPointCoord();
        this.moveHandleOffset = {x: handle_x - x, y: handle_y - y};
    }

    move(handle_x, handle_y) {
        if (this.moveHandleOffset !== null)
            this.setCenterPointCoord(handle_x - this.moveHandleOffset.x,
                handle_y - this.moveHandleOffset.y);
    }

    endMove() {
        this.moveHandleOffset = null;
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

    // handleMouseDown(dispatch, x, y) {
    //     dispatch(new EditorEvent("rect_mouse_down", this, {x: x, y: y}));
    //     return true;
    // }
}

class MapNode extends Entity {
    x;
    y;
    style = MAP_NODE_STYLE;

    constructor(x, y) {
        super();
        this.x = x;
        this.y = y;
        this.zIndex = 10;
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

    setHovered(state) {
        super.setHovered(state);

        this.updateStyle();
    }

    setActive(state) {
        super.setActive(state);

        this.updateStyle();
    }

    startMove(handle_x, handle_y) {
        super.startMove(handle_x, handle_y);

        this.updateStyle();
    }

    endMove() {
        super.endMove();

        this.updateStyle();
    }

    updateStyle() {
        if (this.moveHandleOffset !== null)
            this.style = MAP_NODE_HELD_STYLE;
        else if (this.active)
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

    /**
     * move the current view such that coordinate (x, y) ends up at pixel
     * location (px_x, px_y)
     * @param x
     * @param y
     * @param px_x
     * @param px_y
     */
    moveViewByPoint(x, y, px_x, px_y) {
        let dx = x - this.xFromPx(px_x);
        let dy = y - this.yFromPx(px_y);

        this.setView(this.x + dx, this.y + dy, this.scaleFactor);
    }

    addEntity(e) {
        this.entities.push(e)
        // higher z-index = precedence for handling clicks; put them at
        // front of the list
        this.entities.sort((a, b) => {
            return b.zIndex - a.zIndex;
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
            if (e.coordinateCollides(x, y) && e.handleMouseDown((e) => this.dispatchEvent(e), x, y))
                return;
        }

        this.dispatchEvent(new EditorEvent("bg_mousedown",
            null,
            {x: x, y: y}
        ));
    }

    handleMouseUp(x, y) {
        for (let e of this.entities) {
            if (e.coordinateCollides(x, y) && e.handleMouseUp((e) => this.dispatchEvent(e), x, y))
                return;
        }

        this.dispatchEvent(new EditorEvent("bg_mouseup",
            null,
            {x: x, y: y}
        ));
    }

    handleMouseMove(x, y) {
        for (let e of this.entities) {
            if (e.coordinateCollides(x, y) && e.handleMouseMove((e) => this.dispatchEvent(e), x, y))
                return;
        }

        this.dispatchEvent(new EditorEvent("bg_mousemove",
            null,
            {x: x, y: y}
        ));
    }

    handleWheel(x, y, deltaX, deltaY) {
        for (let e of this.entities) {
            if (e.coordinateCollides(x, y)
                && e.handleWheel((e) => this.dispatchEvent(e), x, y, deltaX, deltaY))
                return;
        }

        this.dispatchEvent(new EditorEvent("bg_wheel", this,
            {x: x, y: y, deltaX: deltaX, deltaY: deltaY}));
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
    selectedEntities = [];
    heldEntity = null;

    backgroundPanCoord = null;

    constructor(canvas) {
        this.viewport = new Viewport(canvas);
        this.viewport.addEntity(new Rectangle(30, 81, 100, 50, 'rgb(100, 100,' +
            ' 100'));
        this.viewport.addEntity(new Rectangle(50, 100, 100, 150, 'rgb(100,' +
            ' 200, 100'));
        this.viewport.addEntity(new MapNode(200, 200));
        this.viewport.draw()
        let events = [
            "entity_mousedown",
            "entity_mouseup",
            "entity_mousemove",
            "entity_wheel",
            "bg_mousedown",
            "bg_mouseup",
            "bg_mousemove",
            "bg_wheel",
        ]

        for (let e of events) {
            if (e.endsWith("mousemove"))
                this.viewport.addEditorEventListener(e, (e) => this.handle_editor_mousemove(e))

        }
        for (let e of events) {
            if (e.endsWith("wheel"))
                this.viewport.addEditorEventListener(e, (e) => this.handle_editor_wheel(e))
        }

        this.viewport.addEditorEventListener("bg_mousedown",
            (e) => this.handle_editor_bg_mousedown(e));
        this.viewport.addEditorEventListener("bg_mouseup",
            (e) => this.handle_editor_mouseup(e));
        this.viewport.addEditorEventListener("entity_mousedown",
            (e) => this.handle_editor_entity_mousedown(e));
        this.viewport.addEditorEventListener("entity_mouseup",
            (e) => this.handle_editor_mouseup(e));
    }

    handle_editor_event(e) {

    }

    handle_editor_mousemove(e) {
        if (this.heldEntity === "bg") {
            this.viewport.moveViewByPoint(
                this.backgroundPanCoord[0],
                this.backgroundPanCoord[1],
                this.viewport.xToPx(e.x),
                this.viewport.yToPx(e.y))

            this.viewport.draw();
            return;
        } else if (this.heldEntity !== null) {
            this.heldEntity.move(e.x, e.y);

            this.viewport.draw();
        }
        if (e.sourceEntity !== this.hoveredEntity) {
            this.hoveredEntity?.setHovered(false);
            e.sourceEntity?.setHovered(true);

            this.hoveredEntity = e.sourceEntity;

            this.viewport.draw();
        }
    }

    handle_editor_wheel(e) {
        let newScale = this.viewport.scaleFactor - e.deltaY / 10.0;
        if (newScale > 10)
            newScale = 10;
        if (newScale < 0.1)
            newScale = 0.1;

        this.viewport.changeScaleCenteredOnPoint(e.x, e.y, newScale);
        this.viewport.draw();
    }

    handle_editor_mouseup(e) {
        if (this.heldEntity !== null && this.heldEntity === e.sourceEntity) {
            e.sourceEntity.endMove();
            this.viewport.draw();
        }

        this.heldEntity = null;
        document.body.style.cursor = "default";
    }

    handle_editor_bg_mousedown(e) {
        this.heldEntity = "bg";
        document.body.style.cursor = "move";
        this.backgroundPanCoord = [e.x, e.y];
    }

    handle_editor_entity_mousedown(e) {
        this.heldEntity = e.sourceEntity;
        document.body.style.cursor = "grabbing";
        e.sourceEntity.startMove(e.x, e.y);
        this.viewport.draw();
    }
}