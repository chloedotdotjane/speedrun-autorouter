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
    radius: 25,
    strokeColor: '#8080c0',
    fillColor: '#505080',
    alpha: 0.8,
    strokeWidth: 2,
}

export const MAP_NODE_HOVER_STYLE = {
    radius: 25,
    strokeColor: '#b0b0f0',
    fillColor: '#7070a0',
    alpha: 0.8,
    strokeWidth: 2,
}

export const MAP_NODE_ACTIVE_STYLE = {
    radius: 25,
    strokeColor: '#8080c0',
    fillColor: '#505080',
    alpha: 0.8,
    strokeWidth: 2,
}

export const MAP_NODE_HELD_STYLE = {
    radius: 27,
    strokeColor: '#b0b0f0',
    fillColor: '#7070a0',
    alpha: 0.6,
    strokeWidth: 3,
}