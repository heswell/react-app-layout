'use strict';

var BoxModel = require('./BoxModel');

var SCALE_FACTOR = 0.4;

class DragState {

    constructor(zone, component, mouseX, mouseY){
        this.init(zone, component, mouseX, mouseY);
    }

    init(zone, component, mouseX, mouseY){
        
        var json = component.state.json || component.props.json;
        var rect = json.$clientRect;
        if (rect.height === 0){ // non-selected child in TabbedContainer
            rect = component.props.container.props.json.$clientRect;
        }

        var {left: x, top: y} = rect;

        var mousePosition = BoxModel.pointPositionWithinComponent(mouseX,mouseY,component);

        // We are applying a scale factor of 0.4 to the draggee. This is purely a visual
        // effect - the actual box size remains the original size. The 'leading' values 
        // represent the difference between the visual scaled down box and the actual box.

        var scaleFactor = SCALE_FACTOR;

        var leadX = mousePosition.pctX * rect.width;
        var trailX = rect.width - leadX;
        var leadY = mousePosition.pctY * rect.height;
        var trailY = rect.height - leadY;

        // When we assign position to rect using css. positioning units are applied to the 
        // unscaled shape, so we have to adjust values to take scaling into account.
        var scaledWidth = rect.width * scaleFactor,
            scaledHeight = rect.height * scaleFactor;

        var scaleDiff = 1 - scaleFactor;
        var leadXScaleDiff = leadX * scaleDiff; 
        var leadYScaleDiff = leadY * scaleDiff; 
        var trailXScaleDiff = trailX * scaleDiff; 
        var trailYScaleDiff = trailY * scaleDiff; 

        this.constraint = {
            zone : {
                x : {
                    lo: zone.left,
                    hi: zone.right
                },
                y : {
                    lo: zone.top,
                    hi: zone.bottom
                }
            },

            pos : {
                x : {
                    lo: /* left */ zone.left - leadXScaleDiff,
                    hi: /* right */ zone.right - rect.width + trailXScaleDiff
                },
                y : {
                    lo: /* top */ zone.top - leadYScaleDiff,
                    hi: /* bottom */ zone.bottom - rect.height + trailYScaleDiff
                }
            },
            mouse :{
                x : {
                    lo: /* left */ zone.left + scaledWidth * mousePosition.pctX,
                    hi: /* right */ zone.right - scaledWidth * (1-mousePosition.pctX)
                },
                y: {
                    lo: /* top */ zone.top + scaledHeight * mousePosition.pctY,
                    hi: /* bottom */ zone.bottom - scaledHeight * (1-mousePosition.pctY)
                }
            }
        };

        //onsole.log(JSON.stringify(this.constraint,null,2));

        this.x = {pos:x, lo: false, hi: false, mousePos: mouseX, mousePct: mousePosition.pctX};
        this.y = {pos:y, lo: false, hi: false, mousePos: mouseY, mousePct: mousePosition.pctY};

    }

    outOfBounds(){
        return this.x.lo || this.x.hi || this.y.lo || this.y.hi;
    }

    inBounds(){
        return !this.outOfBounds();
    }

    dropX(){
        return dropXY.call(this,'x');
    }

    dropY(){
        return dropXY.call(this,'y');
    }


    /*
     *  diff = mouse movement, signed int
     *  xy = 'x' or 'y'
     */
     //todo, diff can be calculated in here
    update(xy, mousePos){

        var state = this[xy],
            mouseConstraint = this.constraint.mouse[xy],
            posConstraint = this.constraint.pos[xy],
            previousPos = state.pos;

       var diff = mousePos - state.mousePos;

       //xy==='x' && console.log(`update: state.lo=${state.lo}, mPos=${mousePos}, mC.lo=${mouseConstraint.lo}, prevPos=${previousPos}, diff=${diff} `  );

        if (diff < 0){
            if (state.lo) {/* do nothing */}

            else if (mousePos < mouseConstraint.lo){
                state.lo = true;
                state.pos =  posConstraint.lo;
            }
            else if (state.hi){
                if (mousePos < mouseConstraint.hi){
                    state.hi = false;
                    state.pos += diff;
                }
            }
            else {
                state.pos += diff;
            }
        }
        else if (diff > 0){
            if (state.hi){/* do nothing */}

            else if (mousePos > mouseConstraint.hi){
                state.hi = true;
                state.pos =  posConstraint.hi;
            }
            else if (state.lo){
                if (mousePos > mouseConstraint.lo){
                    state.lo = false;
                    state.pos += diff;
                }
            }
            else {
                state.pos += diff;
            }
        }

        state.mousePos = mousePos;

        return previousPos !== state.pos;

    }

}

module.exports = DragState;

function dropXY(dir){

    var pos = this[dir],
        rect = this.constraint.zone[dir];
        // why not do the rounding +/- 1 on the rect initially - this is all it is usef for
    return pos.lo ? Math.max(rect.lo,pos.mousePos) : pos.hi ? Math.min(pos.mousePos, Math.round(rect.hi) -1) : pos.mousePos;

}

