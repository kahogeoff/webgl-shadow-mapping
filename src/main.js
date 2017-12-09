import * as twgl from "twgl.js"
import * as MinimalGLTFLoader from "minimal-gltf-loader"
import {
    glMatrix
} from "gl-matrix"

import * as keyboardjs from "keyboardjs"

import {
    ModelObject,
    PointLightObject,
    DirectionalLightObject,
    CameraObject
} from "./object"
const m4 = twgl.m4
const v3 = twgl.v3

let canvas /*: HTMLCanvasElement */ = undefined
let gl /*: WebGLRenderingContext */ = undefined

let glTFLoader = new MinimalGLTFLoader.glTFLoader()

const shadowDepthTextureSize = 1024

let defaultVertex = require("./shader/default.vert")
let defaultFragment = require("./shader/default.frag")
let lightHintVertex = require("./shader/light_hint.vert")
let lightHintFragment = require("./shader/light_hint.frag")
let bumpVertex = require("./shader/bump.vert")
let bumpFragment = require("./shader/bump.frag")
let depthVertex = require("./shader/depth.vert")
let depthFragment = require("./shader/depth.frag")

let programInfo = undefined
let depthProgramInfo = undefined
let bumpProgramInfo = undefined
let lightHintProgramInfo = undefined
let bufferInfo = undefined

let frameBuffer = undefined
//let renderBufferID = undefined

// Set up a box
let box = new ModelObject()
box.name = "A freaking box"
//box.scale = v3.create(0.5, 0.5, 0.5)
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

let obj2 = new ModelObject()
obj2.name = "Object2"
obj2.position = v3.create(3, 3, 3)
obj2.rotation = v3.create(glMatrix.toRadian(90), 0, 0)
obj2.textures.push([
    16, 220, 220, 255,
    220, 220, 16, 255,
    220, 16, 220, 255
])

let floor = new ModelObject()
floor.name = "Floor"
floor.cast_shadow = false
floor.textures.push([
    24, 24, 255, 255,
])

let g_wall = new ModelObject()
g_wall.name = "Green Wall"
g_wall.cast_shadow = false
g_wall.position = v3.create(0, 5, 5)
g_wall.rotation = v3.create(glMatrix.toRadian(-90), 0, 0)
g_wall.textures.push([
    24, 180, 24, 255,
])

let r_wall = new ModelObject()
r_wall.name = "Red Wall"
r_wall.cast_shadow = false
r_wall.position = v3.create(5, 5, 0)
r_wall.rotation = v3.create(0, 0, glMatrix.toRadian(90))
r_wall.textures.push([
    180, 24, 24, 255,
])

let g_wall_2 = new ModelObject()
g_wall_2.name = "Green Wall 2"
g_wall_2.cast_shadow = false
g_wall_2.position = v3.create(0, 5, -5)
g_wall_2.rotation = v3.create(glMatrix.toRadian(90), 0, 0)
g_wall_2.textures.push([
    24, 180, 24, 255,
])

let r_wall_2 = new ModelObject()
r_wall_2.name = "Red Wall 2"
r_wall_2.cast_shadow = false
r_wall_2.position = v3.create(-5, 5, 0)
r_wall_2.rotation = v3.create(0, 0, glMatrix.toRadian(-90))
r_wall_2.textures.push([
    180, 24, 24, 255,
])

// Set up a directional light
let directional_light = new DirectionalLightObject()
//directional_light.position = v3.create(1, 3, -2)
directional_light.name = "MyLittleDirectionalLight"
directional_light.color = [0.8, 0.8, 0.8, 1]
directional_light.power = 1

// Set up a point light
let point_light = new PointLightObject()
//directional_light.position = v3.create(1, 3, -2)
point_light.name = "MyLittlePointLight"
point_light.position = v3.create(1, 3, -2)
point_light.color = [0.8, 0.8, 0.8, 1]
point_light.power = 2
point_light.exp = 5

// Set up a camera
let camera = new CameraObject()
camera.name = "MyLittleCamera"
camera.position = v3.create(-2, 5, -6)
camera.rotation = v3.create(-0.4, -1.2, 0)
camera.fov_angle = 60
camera.zFar = 300

let object_list = []

let depth_tex = {}
let depth_cube_tex = []
let bump_uniforms = {
    M: m4.identity(),
    N: m4.identity(),
    V: m4.identity(),
    P: m4.identity(),
    //light_color: directional_light.color,
    //light_power: directional_light.power,
}
let dirLight_uniforms = {
    dirLight_dir: v3.create(),
    dirLight_color: [1, 1, 1, 1],
    dirLight_power: 1,
}
let pointLight_uniforms = {
    pointLights_num: 1,
    pointLights_color: [],
    pointLights_position: [],
    pointLights_power: [],
    pointLights_constant: [],
    pointLights_linear: [],
    pointLights_exp: [],
}
let depth_uniforms = {}
let light_hint_uniforms = {}

let previous_time = 0
let delta_time = 0

let bias_matrix = [
    0.5, 0.0, 0.0, 0.0,
    0.0, 0.5, 0.0, 0.0,
    0.0, 0.0, 0.5, 0.0,
    0.5, 0.5, 0.5, 1.0
]

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
    depthProgramInfo = twgl.createProgramInfo(gl, [depthVertex, depthFragment])
    bumpProgramInfo = twgl.createProgramInfo(gl, [bumpVertex, bumpFragment])
    lightHintProgramInfo = twgl.createProgramInfo(gl, [lightHintVertex, lightHintFragment])
    //console.log(bufferInfo)

    dirLight_uniforms = {
        dirLight_dir: directional_light.direction,
        dirLight_color: directional_light.color,
        dirLight_power: directional_light.power,
    }

    pointLight_uniforms = {
        pointLights_num: 1,
        pointLights_color: [],
        pointLights_position: [],
        pointLights_power: [],
        pointLights_constant: [],
        pointLights_linear: [],
        pointLights_exp: [],
    }

    depth_uniforms = {
        depthMVP: m4.identity()
    }
    light_hint_uniforms = {
        uniform_MVP: m4.identity()
    }

    // Set frame buffer
    frameBuffer = gl.createFramebuffer()
    gl.bindFramebuffer(gl.FRAMEBUFFER, frameBuffer)

    // Set depth texture
    depth_tex = twgl.createTexture(gl, {
        width: shadowDepthTextureSize,
        height: shadowDepthTextureSize,
        minMag: gl.NEAREST,
        internalFormat: gl.DEPTH_COMPONENT16,
        format: gl.DEPTH_COMPONENT,
        warp: gl.CLAMP_TO_EDGE
    })
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.TEXTURE_2D, depth_tex, 0)

    /*
        depth_cube_tex = twgl.createTexture(gl, {
            target: gl.TEXTURE_CUBE_MAP,
            width: shadowDepthTextureSize,
            height: shadowDepthTextureSize,
            minMag: gl.NEAREST,
            internalFormat: gl.DEPTH_COMPONENT16,
            format: gl.DEPTH_COMPONENT,
            warp: gl.CLAMP_TO_EDGE
        })
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.TEXTURE_CUBE_MAP_POSITIVE_X, depth_cube_tex, 0)
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.TEXTURE_CUBE_MAP_NEGATIVE_X, depth_cube_tex, 0)
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.TEXTURE_CUBE_MAP_POSITIVE_Y, depth_cube_tex, 0)
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.TEXTURE_CUBE_MAP_NEGATIVE_Y, depth_cube_tex, 0)
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.TEXTURE_CUBE_MAP_POSITIVE_Z, depth_cube_tex, 0)
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.TEXTURE_CUBE_MAP_NEGATIVE_Z, depth_cube_tex, 0)
    */
    if (gl.checkFramebufferStatus(gl.FRAMEBUFFER) != gl.FRAMEBUFFER_COMPLETE) {
        return false
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
    let world = m4.identity()

    // Frame buffer
    gl.bindFramebuffer(gl.FRAMEBUFFER, frameBuffer)
    gl.viewport(0, 0, shadowDepthTextureSize, shadowDepthTextureSize)

    gl.enable(gl.DEPTH_TEST)
    gl.enable(gl.CULL_FACE)
    gl.cullFace(gl.BACK)
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)

    gl.useProgram(depthProgramInfo.program)

    dirLight_uniforms = {
        dirLight_dir: directional_light.direction,
        dirLight_color: directional_light.color,
        dirLight_power: directional_light.power,
    }
    pointLight_uniforms = {
        pointLights_num: 1,
        pointLights_color: [],
        pointLights_position: [],
        pointLights_power: [],
        pointLights_constant: [],
        pointLights_linear: [],
        pointLights_exp: [],
    }

    pointLight_uniforms.pointLights_color =
        pointLight_uniforms.pointLights_color.concat(point_light.color)
    pointLight_uniforms.pointLights_position =
        pointLight_uniforms.pointLights_position.concat(Array.from(point_light.position))
    pointLight_uniforms.pointLights_power.push(point_light.power)
    pointLight_uniforms.pointLights_linear.push(point_light.linear)
    pointLight_uniforms.pointLights_exp.push(point_light.exp)
    pointLight_uniforms.pointLights_constant.push(point_light.constant)

    let light_inv_dir = [
        -directional_light.direction[0], 
        -directional_light.direction[1],
        -directional_light.direction[2],
    ]

    let depth_M = m4.identity()
    let depth_P = m4.ortho(-10, 10, -10, 10, -10, 20)
    //let depth_P = m4.perspective(glMatrix.toRadian(45), 1, 2, 50)
    let depth_V = m4.inverse(
        //m4.lookAt(point_light.position, v3.subtract(point_light.position, light_inv_dir), [0, 1, 0])
        m4.lookAt(light_inv_dir, [0, 0, 0], [0, 1, 0])
    )
    let depth_MVP = m4.identity()

    // Shadow pass (Directional light)
    object_list.forEach(element => {
        if (!element.cast_shadow) {
            return
        }
        world = element.transformMatrix
        depth_M = world

        depth_MVP = m4.multiply(m4.multiply(depth_P, depth_V), depth_M)

        depth_uniforms.depthMVP = depth_MVP
        //depth_uniforms.depth_M = world
        //depth_uniforms.lightPos = point_light.position

        bufferInfo = element.bufferInfo
        twgl.setBuffersAndAttributes(gl, depthProgramInfo, bufferInfo)
        twgl.setUniforms(depthProgramInfo, depth_uniforms)
        twgl.drawBufferInfo(gl, bufferInfo)
    })

    // Phong shader
    //gl.disable(gl.POLYGON_OFFSET_FILL)
    gl.enable(gl.POLYGON_OFFSET_FILL)
    gl.polygonOffset(1.0, 2.0)
    gl.bindFramebuffer(gl.FRAMEBUFFER, null)
    gl.viewport(0, 0, canvas.width, canvas.height)

    gl.cullFace(gl.BACK)
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)

    gl.useProgram(programInfo.program)
    //gl.useProgram(bumpProgramInfo.program)

    // Camera Settings
    const camera_mat = m4.lookAt(camera.position, camera.forward, camera.up)
    const view = m4.inverse(camera_mat)
    const viewProjection = m4.multiply(camera.projection, view)

    bump_uniforms.V = view
    bump_uniforms.P = camera.projection
    bump_uniforms.cam_pos = camera.position
    bump_uniforms.depth_texture = depth_tex
    //bump_uniforms.depth_cube_texture = depth_cube_tex

    // Scene render pass
    object_list.forEach(element => {
        world = element.transformMatrix

        bump_uniforms.M = world
        bump_uniforms.N = m4.transpose(m4.inverse(m4.multiply(view, world)))
        bump_uniforms.diffuse_color = element.material.diffuse
        bump_uniforms.ambient_color = element.material.ambient
        bump_uniforms.specular_color = element.material.specular
        bump_uniforms.shininess = element.material.shininess
        bump_uniforms.texture_0 = twgl.createTexture(gl, {
            min: gl.NEAREST,
            mag: gl.NEAREST,
            src: element.textures[0]
        })
        depth_M = world
        depth_MVP = m4.multiply(m4.multiply(depth_P, depth_V), depth_M)
        bump_uniforms.depthBiasMVP = m4.multiply(bias_matrix, depth_MVP)

        bufferInfo = element.bufferInfo
        twgl.setBuffersAndAttributes(gl, programInfo, bufferInfo)
        twgl.setUniforms(programInfo, [bump_uniforms, dirLight_uniforms, pointLight_uniforms])
        twgl.drawBufferInfo(gl, bufferInfo)
    })

    // Draw the light hint
    world = m4.translation(point_light.position)
    light_hint_uniforms.uniform_MVP = m4.multiply(viewProjection, world)

    gl.useProgram(lightHintProgramInfo.program)

    bufferInfo = twgl.primitives.createSphereBufferInfo(gl, 0.1, 8, 8)
    twgl.setBuffersAndAttributes(gl, lightHintProgramInfo, bufferInfo)
    twgl.setUniforms(lightHintProgramInfo, light_hint_uniforms)
    twgl.drawBufferInfo(gl, bufferInfo)

    gl.useProgram(null)

    update(delta_time)
    requestAnimationFrame(render)
}

function start() {

    // Adding object
    box.bufferInfo = twgl.createBufferInfoFromArrays(gl, box.model_data)
    obj2.bufferInfo = twgl.primitives.createTorusBufferInfo(gl, 1, 0.5, 16, 16)
    floor.bufferInfo = twgl.primitives.createPlaneBufferInfo(gl, 10, 10)
    r_wall.bufferInfo = twgl.primitives.createPlaneBufferInfo(gl, 10, 10)
    g_wall.bufferInfo = twgl.primitives.createPlaneBufferInfo(gl, 10, 10)
    r_wall_2.bufferInfo = twgl.primitives.createPlaneBufferInfo(gl, 10, 10)
    g_wall_2.bufferInfo = twgl.primitives.createPlaneBufferInfo(gl, 10, 10)

    object_list.push(box)
    object_list.push(obj2)
    object_list.push(floor)
    object_list.push(r_wall)
    object_list.push(g_wall)
    object_list.push(r_wall_2)
    object_list.push(g_wall_2)
    
    directional_light.rotation = v3.create(-0.4, -1.2, 0)

    pointLight_uniforms.pointLights_color =
        pointLight_uniforms.pointLights_color.concat(point_light.color)
    pointLight_uniforms.pointLights_position =
        pointLight_uniforms.pointLights_position.concat(Array.from(point_light.position))
    pointLight_uniforms.pointLights_power.push(point_light.power)
    pointLight_uniforms.pointLights_linear.push(point_light.linear)
    pointLight_uniforms.pointLights_exp.push(point_light.exp)
    pointLight_uniforms.pointLights_constant.push(point_light.constant)
}

function update(delta_time) {
    obj2.rotate([delta_time, 0, 0])
    //directional_light.rotate([0, delta_time/2, 0])
}

init()
start()
requestAnimationFrame(render)