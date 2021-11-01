class Entity {
    z_index;

    constructor() {
        this.z_index = 0;
    }

    draw(ctx, x_px, y_px, px) {

    }

    contains_coordinate(x, y) {
        return false;
    }

    handle_click() {
        return false;   /* should return true if we handled this click (stop
         looking for something else to handle it) */
    }
}

export class Rectangle extends Entity {
    constructor(x, y, width, height, color) {
        super();
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.color = color;
    }

    draw(ctx, x_px, y_px, px) {
        super.draw(ctx, x_px, y_px, px);

        ctx.globalAlpha = 0.4
        ctx.fillStyle = this.color;
        ctx.fillRect(x_px(this.x), y_px(this.y), px(this.width), px(this.height));
    }


    contains_coordinate(x, y) {
        return x >= this.x
            && x <= this.x + this.width
            && y >= this.y
            && y <= this.y + this.height;
    }

    handle_click() {
        console.log("Clicked rectangle x=" + this.x + " y=" + this.y);
        return true;
    }
}

export class Viewport {
    // coordinate system x value aligning with left side of canvas
    x;
    // coordinate system y value aligning with top side of canvas
    y;
    // how many pixels are represented by one unit of our coordinate system
    scale_factor;

    // we take over an entire canvas (for now, at least). Makes it
    // easier not needing to worry about overflow management.
    canvas;
    ctx;

    // scale coordinate x value to screen pixel x
    x_px;
    // scale coordinate y value to screen pixel y
    y_px;
    // scale coordinate distance to screen pixel distance
    len_px;

    // scale screen pixel x to coordinate x
    x_coord;
    // scale screen pixel y to coordinate y
    y_coord;
    // scale screen pixel distance to coordinate distance
    len_coord;

    // list of instances we know about
    entities;

    constructor(canvas) {
        this.canvas = canvas;
        let left = canvas.offsetLeft + canvas.clientLeft;
        let top = canvas.offsetTop + canvas.clientTop;
        let self = this;
        this.canvas.addEventListener('click', function (event) {
            let x = event.pageX - left;
            let y = event.pageY - top;
            self.handle_click(x, y);
        }, false);
        this.ctx = this.canvas.getContext('2d');
        this.set_view(0, 0, 2)
        this.entities = []
    }

    set_view(x, y, scale_factor) {
        this.x = x;
        this.y = y;
        this.scale_factor = scale_factor;

        this.x_px = x => (x - this.x) * this.scale_factor;
        this.y_px = y => (y - this.y) * this.scale_factor;
        this.len_px = a => a * this.scale_factor;

        // inverse of above functions
        this.x_coord = x => this.x + (x / this.scale_factor);
        this.y_coord = y => this.y + (y / this.scale_factor);
        this.len_coord = a => a / this.scale_factor;
    }

    add_entity(e) {
        this.entities.push(e)
        // higher z-index = precedence for handling clicks; put them at
        // front of the list
        this.entities.sort((a, b) => {
            return a.z_index < b.z_index;
        })
    }

    draw() {
        for (let e of this.entities)
            this.draw_entity(e);
    }

    draw_entity(e) {
        this.ctx.save()

        e.draw(this.ctx, this.x_px, this.y_px, this.len_px);

        this.ctx.restore()
    }

    handle_click(x_px, y_px) {
        let x = this.x_coord(x_px);
        let y = this.y_coord(y_px);

        for (let e of this.entities) {
            if (e.contains_coordinate(x, y) && e.handle_click())
                break;
        }
    }


}