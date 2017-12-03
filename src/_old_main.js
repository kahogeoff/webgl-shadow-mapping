import {
    vec3,
    vec4,
    quat,
    mat2,
    mat4
} from "gl-matrix"
const MinimalGLTFLoader = require("../lib/minimal-gltf-loader.js")

let glTFLoader = new MinimalGLTFLoader.glTFLoader()

let canvas /*: HTMLCanvasElement */ = undefined
let gl /*: WebGLRenderingContext */ = undefined

let shadowDepthTextureSize = 1024

let lightVertex = require("./shader/light.vert")
let lightFragment = require("./shader/light.frag")

function init() {
    canvas = document.createElement("canvas")
    canvas.width = 800
    canvas.height = 600
    document.body.appendChild(canvas)

    gl = canvas.getContext("webgl2")
    if (!gl) {
        console.log("ERROR: WebGL cannot be initialize!")
        return
    }

    console.log("OK: WebGL had been initialized!")
    gl.clearColor(0, 0, 0, 1.0)
    gl.enable(gl.DEPTH_TEST)
    gl.depthFunc(gl.LEQUAL)
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)
    gl.viewport(0, 0, canvas.width, canvas.height)
}

function render() {
    requestAnimationFrame(render)
}

init()