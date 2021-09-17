function pointInRect(p, r) {
    return p.x > r.x && p.x < (r.x + r.w) && p.y > r.y && p.y < (r.y + r.h);
}

class App {
    constructor(element_ids, rectSize) {
        this.mouse = {
            down: false,
            position: {
                x: 0,
                y: 0
            }
        }

        this.selected = -1;
        this.points = [];
        this.norm_points = [];
        this.rects = [];
        this.rectSize = rectSize;

        this.canvas = document.getElementById(element_ids.canvas);
        this.max_time = document.getElementById(element_ids.max_time);
        this.time_unit = document.getElementById(element_ids.time_unit);
        this.min_req = document.getElementById(element_ids.min_req);
        this.max_req = document.getElementById(element_ids.max_req)
        this.stages = document.getElementById(element_ids.stages);

        this.context = this.canvas.getContext("2d");
        
    }

    getMousePosition(event) {
        var rect = canvas.getBoundingClientRect();
        this.mouse.position = {
            x: event.clientX - rect.left,
            y: event.clientY - rect.top
        };
    }

    mouseDown() {
        this.mouse.down = true;
        this.checkSelect();

        if(this.selected == -1) {
            this.clear();
            this.points = [{x: 0, y: this.canvas.height}, this.mouse.position];
            this.context.beginPath();
            this.context.moveTo(this.mouse.position.x, this.mouse.position.y);
        }
    }
    mouseMove(event) {
        this.getMousePosition(event);

        if(this.mouse.down) {
            if(this.selected == -1) {
                this.points.push(this.mouse.position);
                this.context.lineTo(this.mouse.position.x, this.mouse.position.y);
                this.context.strokeStyle = "#FF0000";
                this.context.lineWidth = 5;
                this.context.stroke();
            }
            else {
                this.points[this.selected] = this.mouse.position;
                this.rects[this.selected].x = this.mouse.position.x - 0.5 * this.rectSize;
                this.rects[this.selected].y = this.mouse.position.y - 0.5 * this.rectSize;

                this.clear();
                this.renderPoints();
                this.renderRects();
            }
        }
    }
    mouseUp() {
        this.mouse.down = false;
        this.selected = -1;

        this.injectify();
        
        this.normalize();
        this.scale();

        this.clear();
        this.renderPoints();
        this.genRects();
        this.renderRects();
        this.genStages();
    }

    genRects() {
        this.rects = [];
        this.points.forEach((p) => {
            this.rects.push({
                x: p.x - 0.5 * this.rectSize,
                y: p.y - 0.5 * this.rectSize,
                w: this.rectSize,
                h: this.rectSize
            })
        })
    }
    checkSelect() {
        for(let i = 0; i < this.rects.length; i++) {
            if(pointInRect(this.mouse.position, this.rects[i])) {
                this.selected = i;
                return;
            }
        }
        this.selected = -1;
    }

    injectify() {
        let i = 1;
        while(i < this.points.length) {
            if(this.points[i].x <= this.points[i-1].x) {
                this.points.splice(i, 1);
                
            }
            else {i++}
        }
    }

    normalize() {
        var xs = this.points.map(p => p.x)
        var ys = this.points.map(p => p.y)
        
        var max_x = Math.max(...xs);
        var min_x = Math.min(...xs);

        var max_y = Math.max(...ys);
        var min_y = Math.min(...ys);

        this.norm_points = [];

        this.points.forEach(point => {
            this.norm_points.push({
                x: (point.x - min_x) / (max_x - min_x),
                y: (point.y - min_y) / (max_y - min_y)
            })
        });
    }

    scale() {
        for(let i = 0; i < this.points.length; i++) {
            this.points[i].x = this.norm_points[i].x * (this.canvas.width - 2 * this.rectSize) + this.rectSize;
            this.points[i].y = this.norm_points[i].y * (this.canvas.height - 2 * this.rectSize) + this.rectSize;
        }
    }

    renderPoints() {
        this.context.beginPath();
        this.context.moveTo(this.points[0].x, this.points[0].y);

        for(let i = 1; i < this.points.length; i++) {
            this.context.lineTo(this.points[i].x, this.points[i].y);
        }

        this.context.stroke();
    }
    renderRects() {
        this.rects.forEach((r) => {
            this.context.fillRect(r.x, r.y, r.w, r.h);
        })
    }
    clear() {
        this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }

    genStages() {
        var stages = [];
        var times = [];
        var requests = [];
        

        this.norm_points.forEach((point) => {
            times.push(point.x * this.max_time.value)
            requests.push((1 - point.y) * (this.max_req.value - this.min_req.value) + Number(this.min_req.value));
        })

        for(let i = 1; i < times.length; i++) {
            let d = Math.round(times[i] - times[i-1]);
            if(d > 0) {
                stages.push({
                    duration: d,
                    target: Math.round(requests[i])
                })
            }
        }

        for(let i = 2; i < stages.length; i++) {
            if(stages[i-1].target == stages[i-2].target) {
                while(stages.length > i && stages[i-1].target == stages[i].target) {
                    stages[i-1].duration += stages[i].duration;
                    stages.splice(i, 1);
                }
            }
        }
        stages.map(s => {
            s.duration = String(s.duration) + this.time_unit.value;
        })
        this.stages.value = JSON.stringify(stages, null, 2);
    }
}