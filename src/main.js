import * as twgl from "twgl.js"
import * as MinimalGLTFLoader from "minimal-gltf-loader"
import {
    ModelObject,
    PointLightObject,
    CameraObject
} from "./object"
import {
    vec3,
    glMatrix
} from "gl-matrix";
const m4 = twgl.m4
const v3 = twgl.v3

let canvas /*: HTMLCanvasElement */ = undefined
let gl /*: WebGLRenderingContext */ = undefined

let glTFLoader = new MinimalGLTFLoader.glTFLoader()

let shadowDepthTextureSize = 1024

let lightVertex = require("./shader/light.vert")
let lightFragment = require("./shader/light.frag")
let defaultVertex = require("./shader/default.vert")
let defaultFragment = require("./shader/default.frag")
let lightHintVertex = require("./shader/light_hint.vert")
let lightHintFragment = require("./shader/light_hint.frag")
//let defaultVertex = require("./shader/bump.vert")
//let defaultFragment = require("./shader/bump.frag")

let programInfo = undefined
let lightHintProgramInfo = undefined
let bufferInfo = undefined

let box = new ModelObject()
box.name = "A freaking box"
box.model_data = {
    position: [1, 1, -1, 1, 1, 1, 1, -1, 1, 1, -1, -1, -1, 1, 1, -1, 1, -1, -1, -1, -1, -1, -1, 1, -1, 1, 1, 1, 1, 1, 1, 1, -1, -1, 1, -1, -1, -1, -1, 1, -1, -1, 1, -1, 1, -1, -1, 1, 1, 1, 1, -1, 1, 1, -1, -1, 1, 1, -1, 1, -1, 1, -1, 1, 1, -1, 1, -1, -1, -1, -1, -1],
    normal: [1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1],
    texcoord: [1, 0, 0, 0, 0, 1, 1, 1, 1, 0, 0, 0, 0, 1, 1, 1, 1, 0, 0, 0, 0, 1, 1, 1, 1, 0, 0, 0, 0, 1, 1, 1, 1, 0, 0, 0, 0, 1, 1, 1, 1, 0, 0, 0, 0, 1, 1, 1],
    indices: [0, 1, 2, 0, 2, 3, 4, 5, 6, 4, 6, 7, 8, 9, 10, 8, 10, 11, 12, 13, 14, 12, 14, 15, 16, 17, 18, 16, 18, 19, 20, 21, 22, 20, 22, 23],
}
box.position = v3.create(0, 1, 0)
box.rotation = v3.create(0, glMatrix.toRadian(45), 0)
box.textures.push([
    255, 255, 255, 255,
    192, 192, 192, 255,
    255, 255, 255, 255,
    192, 192, 192, 255,
    255, 255, 255, 255,
    192, 192, 192, 255,
    255, 255, 255, 255,
    192, 192, 192, 255,
    255, 255, 255, 255,
])

let point_light = new PointLightObject()
point_light.position = v3.create(1, 0.5, -2)
point_light.name = "MyLittlePointLight"
point_light.color = [0.8, 0.8, 0.8, 1]

let camera = new CameraObject()
camera.name = "MyLittleCamera"
camera.position = v3.create(1, 4, -6)
camera.fov_angle = 60
camera.zFar = 300

let tex = {}
let plane_tex_src = [
    Math.floor(Math.random() * 128 + 128),
    Math.floor(Math.random() * 128 + 128),
    Math.floor(Math.random() * 128 + 128),
    255
]
let uniforms = {}
let my_uniforms = {}
let light_hint_uniforms = {}

document.addEventListener("keydown", function (event) {
    if (event.keyCode == 32) {
        //console.log("Left")
        var dir = v3.subtract(point_light.position, box.position)
        console.log(dir)
        /*
        console.log(box.rotationBetweenVectors(
            [0, 0, 1], dir
        ))
        */
    }

    if (event.keyCode == 65) {
        v3.add(point_light.position, v3.create(0.1, 0, 0), point_light.position)
        //console.log("Left")
    } else if (event.keyCode == 87) {
        v3.add(point_light.position, v3.create(0, 0, 0.1), point_light.position)
        //console.log("Up")
    } else if (event.keyCode == 68) {
        v3.add(point_light.position, v3.create(-0.1, 0, 0), point_light.position)
        //console.log("Right")
    } else if (event.keyCode == 83) {
        v3.add(point_light.position, v3.create(0, 0, -0.1), point_light.position)
        //console.log("Up")
    } else if (event.keyCode == 33) {
        v3.add(point_light.position, v3.create(0, 0.1, 0), point_light.position)
        //console.log("Up")
    } else if (event.keyCode == 34) {
        v3.add(point_light.position, v3.create(0, -0.1, 0), point_light.position)
        //console.log("Up")
    }
})

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

    programInfo = twgl.createProgramInfo(gl, [defaultVertex, defaultFragment])
    lightHintProgramInfo = twgl.createProgramInfo(gl, [lightHintVertex, lightHintFragment])
    bufferInfo = twgl.createBufferInfoFromArrays(gl, box.model_data)

    tex = twgl.createTexture(gl, {
        min: gl.NEAREST,
        mag: gl.NEAREST,
        src: box.textures[0],
    })

    uniforms = {
        u_lightWorldPos: point_light.position,
        u_lightColor: point_light.color,
        u_ambient: [0, 0, 0, 1],
        u_specular: [1, 1, 1, 1],
        u_shininess: 50,
        u_specularFactor: 1,
        u_diffuse: tex,
    }

    my_uniforms = {
        uniform_light_pos: point_light.position,
        uniform_light_color: point_light.color,
        //u_ambient: [0, 0, 0, 1],
        //u_specular: [1, 1, 1, 1],
        uniform_shininess: 50,
        //u_specularFactor: 1,
        uniform_texture: tex,
        uniform_M: m4.identity(),
        uniform_V: m4.identity(),
        uniform_P: m4.identity()
    }

    light_hint_uniforms = {
        uniform_MVP: m4.identity()
    }
}

function render(time) {
    time *= 0.001
    twgl.resizeCanvasToDisplaySize(gl.canvas)
    gl.viewport(0, 0, canvas.width, canvas.height)

    gl.enable(gl.DEPTH_TEST)
    gl.enable(gl.CULL_FACE)
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)

    uniforms.u_lightWorldPos = point_light.position

    // Camera Settings

    //camera.lookAt(point_light.position)
    const camera_mat = m4.lookAt(camera.position, [0, 0, 0], camera.up)
    const view = m4.inverse(camera_mat)
    const viewProjection = m4.multiply(camera.projection, view)

    let world = m4.identity()
    // Move the box
    //box.lookAt(point_light.position)
    //box.rotation[1] = time
    world = box.transformMatrix

    //m4.transformDirection(world, [0,0,-0.1], box.position)
    //m4.multiply(world, m4.translation(box.position), world)
    //m4.multiply(world, m4.lookAt(box.position, point_light.position, camera.up), world)

    uniforms.u_viewInverse = camera_mat
    uniforms.u_world = world
    uniforms.u_worldInverseTranspose = m4.transpose(m4.inverse(world))
    uniforms.u_worldViewProjection = m4.multiply(viewProjection, world)
    uniforms.u_diffuse = tex

    // Draw the box
    gl.useProgram(programInfo.program)
    twgl.setBuffersAndAttributes(gl, programInfo, bufferInfo)
    twgl.setUniforms(programInfo, uniforms)
    gl.drawElements(gl.TRIANGLES, bufferInfo.numElements, gl.UNSIGNED_SHORT, 0)

    // Move the floor
    world = m4.translation([0, 0, 0])
    uniforms.u_world = world
    uniforms.u_worldInverseTranspose = m4.transpose(m4.inverse(world))
    uniforms.u_worldViewProjection = m4.multiply(viewProjection, world)
    uniforms.u_diffuse = twgl.createTexture(gl, {
        min: gl.NEAREST,
        mag: gl.NEAREST,
        src: plane_tex_src,
    })

    // Draw the floor
    let plane_buffer_info = twgl.primitives.createPlaneBufferInfo(gl, 10, 10)
    twgl.setBuffersAndAttributes(gl, programInfo, plane_buffer_info)
    twgl.setUniforms(programInfo, uniforms)
    twgl.drawBufferInfo(gl, plane_buffer_info)

    // Draw the light hint
    world = m4.translation(point_light.position)
    light_hint_uniforms.uniform_MVP = m4.multiply(viewProjection, world)

    gl.useProgram(lightHintProgramInfo.program)

    let ball_buffer_info = twgl.primitives.createSphereBufferInfo(gl, 0.1, 8, 8)
    twgl.setBuffersAndAttributes(gl, lightHintProgramInfo, ball_buffer_info)
    twgl.setUniforms(lightHintProgramInfo, light_hint_uniforms)
    twgl.drawBufferInfo(gl, ball_buffer_info)

    gl.useProgram(null)
    requestAnimationFrame(render)
}

init()
requestAnimationFrame(render)