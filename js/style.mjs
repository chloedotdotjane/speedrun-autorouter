/**
 * File to consolidate variables relating to styling javascript-produced
 * graphics; any colors, stroke widths, etc. should be placed here if possible.
 *
 * I wonder if JS can pull this info from css?
 */

export const MAP_BACKGROUND_STYLE = {
    fillColor: '#303040',
}

export const MAP_NODE_STYLE = {
    radius: 7,
    strokeStyle: '#8080c0',
    fillStyle: '#505080',
    //globalAlpha: 0.8,
    lineWidth: 2,
}

export const MAP_NODE_HOVER_STYLE = {
    ...MAP_NODE_STYLE,
    strokeStyle: '#b0b0f0',
    fillStyle: '#7070a0',
}

export const MAP_NODE_ACTIVE_STYLE = {
    ...MAP_NODE_STYLE,
    fillStyle: '#404070',
}

export const MAP_NODE_HELD_STYLE = {
    ...MAP_NODE_HOVER_STYLE,
    radius: MAP_NODE_HOVER_STYLE.radius+2,
    //globalAlpha: 0.8,
    lineWidth: 3,
    shadowColor: '#202030',
    shadowBlur: 25,
    shadowOffsetX: 0,
    shadowOffsetY: 15,
}

export const MAP_EDGE_STYLE = {
    strokeStyle: '#8080c0',
    fillStyle: '#505080',
    lineWidth: 2,
    arrowHeadLength: 8,
    arrowHeadAngle: 0.6,
}
