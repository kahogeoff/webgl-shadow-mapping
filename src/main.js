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
} from "gl-matrix"
const m4 = twgl.m4
const v3 = twgl.v3

let canvas /*: HTMLCanvasElement */ = undefined
let gl /*: WebGLRenderingContext */ = undefined

let glTFLoader = new MinimalGLTFLoader.glTFLoader()

let shadowDepthTextureSize = 1024

let shadowVertex = require("./shader/shadow_map.vert")
let shadowFragment = require("./shader/shadow_map.frag")
let defaultVertex = require("./shader/default.vert")
let defaultFragment = require("./shader/default.frag")
let lightHintVertex = require("./shader/light_hint.vert")
let lightHintFragment = require("./shader/light_hint.frag")
let bumpVertex = require("./shader/bump.vert")
let bumpFragment = require("./shader/bump.frag")

let programInfo = undefined
let shadowProgramInfo = undefined
let bumpProgramInfo = undefined
let lightHintProgramInfo = undefined
let bufferInfo = undefined
let frameBufferInfo = undefined

// Set up a box
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

// Set up a point light
let point_light = new PointLightObject()
point_light.position = v3.create(1, 3, -2)
point_light.name = "MyLittlePointLight"
point_light.color = [0.8, 0.8, 0.8, 1]
point_light.power = 10

// Set up a camera
let camera = new CameraObject()
camera.name = "MyLittleCamera"
camera.position = v3.create(-2, 5, -6)
camera.rotation = v3.create(-0.4, -1.2, 0)
camera.fov_angle = 60
camera.zFar = 300

let tex = {}
let uniforms = {}
let my_uniforms = {}
let light_hint_uniforms = {}

let previous_time = 0
let delta_time = 0

document.addEventListener("keydown", function (event) {
    if (event.keyCode == 32) {
        console.log(camera.rotation)
    }

    // Light position control
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
    }

    // Camera rotation control
    if (event.keyCode == 38) {
        v3.add(camera.rotation, v3.create(0.1, 0, 0), camera.rotation)
    } else if (event.keyCode == 40) {
        v3.add(camera.rotation, v3.create(-0.1, 0, 0), camera.rotation)
    } else if (event.keyCode == 37) {
        v3.add(camera.rotation, v3.create(0, 0.1, 0), camera.rotation)
    } else if (event.keyCode == 39) {
        v3.add(camera.rotation, v3.create(0, -0.1, 0), camera.rotation)
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
    shadowProgramInfo = twgl.createProgramInfo(gl, [shadowVertex, shadowFragment])
    bumpProgramInfo = twgl.createProgramInfo(gl, [bumpVertex, bumpFragment])
    lightHintProgramInfo = twgl.createProgramInfo(gl, [lightHintVertex, lightHintFragment])
    bufferInfo = twgl.createBufferInfoFromArrays(gl, box.model_data)

    var attachments = [
        { 
            format: gl.DEPTH_COMPONENT16, 
            type: gl.FLOAT, 
            width: shadowDepthTextureSize,
            height: shadowDepthTextureSize,
            mag: gl.NEAREST, 
            min: gl.NEAREST, 
            wrap: gl.CLAMP_TO_EDGE 
        }
    ]
    frameBufferInfo = twgl.createFramebufferInfo(gl, attachments)
    twgl.bindFramebufferInfo(gl, frameBufferInfo.framebuffer)

    tex = twgl.createTexture(gl, {
        min: gl.NEAREST,
        mag: gl.NEAREST,
        src: box.textures[0],
    })

    uniforms = {
        u_lightWorldPos: point_light.position,
        u_lightColor: point_light.color,
        u_lightPower: point_light.power,
        u_ambient: [0.01, 0.01, 0.01, 1],
        u_specular: [1, 1, 1, 1],
        u_shininess: 50,
        u_specularFactor: 1,
        u_diffuse: tex,
    }

    my_uniforms = {
        shininess: 50,
        M: m4.identity(),
        N: m4.identity(),
        V: m4.identity(),
        P: m4.identity(),
        light_pos: point_light.position,
        light_color: point_light.color,
        light_power: point_light.power,
        texture_0: tex,
    }

    light_hint_uniforms = {
        uniform_MVP: m4.identity()
    }

    // Mouse test
    canvas.addEventListener("mousedown", (e) => {
        var rect = canvas.getBoundingClientRect()
        console.log((e.clientX - rect.left) + ", " + (e.clientY - rect.top))
    })
}

function render(time) {
    time *= 0.001
    delta_time = time - previous_time
    previous_time = time
    //console.log(delta_time)
    twgl.resizeCanvasToDisplaySize(gl.canvas)
    gl.viewport(0, 0, canvas.width, canvas.height)

    gl.enable(gl.DEPTH_TEST)
    gl.enable(gl.CULL_FACE)
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)

    uniforms.u_lightWorldPos = point_light.position

    // Camera Settings
    const camera_mat = m4.lookAt(camera.position, camera.forward, camera.up)
    const view = m4.inverse(camera_mat)
    const viewProjection = m4.multiply(camera.projection, view)

    let world = m4.identity()
    my_uniforms.V = view
    my_uniforms.P = camera.projection

    uniforms.u_viewInverse = camera_mat

    /* Use custom bump shader here
    gl.useProgram(bumpProgramInfo.program)
    // Move the box
    world = box.transformMatrix
    my_uniforms.M = world
    my_uniforms.V = view
    my_uniforms.N = m4.transpose(m4.inverse(world))
    my_uniforms.P = camera.projection
    my_uniforms.texture_0 = tex
    */

    // Move the box
    world = box.transformMatrix
    /* Depth parameter
    var lightDir = v3.subtract(point_light.position, box.position)
    var dProjection = m4.ortho(-10, 10, -10, 10, -10, 20)
    var dView = m4.lookAt(lightDir, [0, 0, 0], [0, 1, 0])
    var dModel = m4.identity()
    var depthMVP = m4.multiply(dProjection, m4.multiply(dView, dModel))
    uniforms.u_depth_worldViewProjection = depthMVP
    uniforms.u_world = world
    uniforms.u_worldInverseTranspose = m4.transpose(m4.inverse(world))
    uniforms.u_worldViewProjection = m4.multiply(viewProjection, world)
    uniforms.u_diffuse = tex
    */
    my_uniforms.light_pos = point_light.position
    my_uniforms.M = world
    my_uniforms.N = m4.transpose(m4.inverse(world))
    my_uniforms.diffuse_color = box.material.diffuse
    my_uniforms.ambient_color = box.material.ambient
    my_uniforms.specular_color = box.material.specular
    my_uniforms.shininess = box.material.shininess
    my_uniforms.texture_0 = tex

    // Draw the box
    gl.useProgram(bumpProgramInfo.program)
    twgl.setBuffersAndAttributes(gl, bumpProgramInfo, bufferInfo)
    twgl.setUniforms(bumpProgramInfo, my_uniforms)
    gl.drawElements(gl.TRIANGLES, bufferInfo.numElements, gl.UNSIGNED_SHORT, 0)
    
    gl.useProgram(programInfo.program)
    // Move the floor
    world = m4.translation([0, 0, 0])
    uniforms.u_world = world
    uniforms.u_worldInverseTranspose = m4.transpose(m4.inverse(world))
    uniforms.u_worldViewProjection = m4.multiply(viewProjection, world)
    uniforms.u_diffuse = twgl.createTexture(gl, {
        min: gl.NEAREST,
        mag: gl.NEAREST,
        src: [
            24,
            24,
            180,
            255
        ],
    })

    // Draw the floor
    let plane_buffer_info = twgl.primitives.createPlaneBufferInfo(gl, 10, 10)
    twgl.setBuffersAndAttributes(gl, programInfo, plane_buffer_info)
    twgl.setUniforms(programInfo, uniforms)
    twgl.drawBufferInfo(gl, plane_buffer_info)

    // Move the red wall
    world = m4.translation([5, 5, 0])
    m4.multiply(world, m4.rotationZ(glMatrix.toRadian(90)), world)
    uniforms.u_world = world
    uniforms.u_worldInverseTranspose = m4.transpose(m4.inverse(world))
    uniforms.u_worldViewProjection = m4.multiply(viewProjection, world)
    uniforms.u_diffuse = twgl.createTexture(gl, {
        min: gl.NEAREST,
        mag: gl.NEAREST,
        src: [
            180,
            24,
            24,
            255
        ],
    })

    // Draw the red wall
    plane_buffer_info = twgl.primitives.createPlaneBufferInfo(gl, 10, 10)
    twgl.setBuffersAndAttributes(gl, programInfo, plane_buffer_info)
    twgl.setUniforms(programInfo, uniforms)
    twgl.drawBufferInfo(gl, plane_buffer_info)

    // Move the gree wall
    world = m4.translation([0, 5, 5])
    m4.multiply(world, m4.rotationX(glMatrix.toRadian(-90)), world)
    uniforms.u_world = world
    uniforms.u_worldInverseTranspose = m4.transpose(m4.inverse(world))
    uniforms.u_worldViewProjection = m4.multiply(viewProjection, world)
    uniforms.u_diffuse = twgl.createTexture(gl, {
        min: gl.NEAREST,
        mag: gl.NEAREST,
        src: [
            24,
            180,
            24,
            255
        ],
    })

    // Draw the green wall
    plane_buffer_info = twgl.primitives.createPlaneBufferInfo(gl, 10, 10)
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