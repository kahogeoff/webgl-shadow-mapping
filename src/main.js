import * as twgl from "twgl.js"
import * as MinimalGLTFLoader from "minimal-gltf-loader"
import {
    glMatrix,
    vec2
} from "gl-matrix"

import * as keyboardjs from "keyboardjs"

import {
    ModelObject,
    PointLightObject,
    DirectionalLightObject,
    SpotLightObject,
    BasicCameraObject
} from "./object"
const m4 = twgl.m4
const v3 = twgl.v3

// variable
let canvas /*: HTMLCanvasElement */ = undefined
let gl /*: WebGLRenderingContext */ = undefined

let glTFLoader = new MinimalGLTFLoader.glTFLoader()

const shadowDepthTextureSize = 1024

// Import shaders
let defaultVertex = require("./shader/default.vert")
let defaultFragment = require("./shader/default.frag")
let lightHintVertex = require("./shader/light_hint.vert")
let lightHintFragment = require("./shader/light_hint.frag")
let rsmVertex = require("./shader/rsm.vert")
let rsmFragment = require("./shader/rsm.frag")
let indirectLightingFragment = require("./shader/indirect_lighting.frag")
let directLightingFragment = require("./shader/direct_lighting.frag")
let fullScreenVertex = require("./shader/full_screen.vert")

// Shader Programs
let programInfo = undefined
let rsmProgramInfo = undefined
let indirectLightingProgramInfo = undefined
let directLightingProgramInfo = undefined
let lightHintProgramInfo = undefined

let bufferInfo = undefined

// Frame buffers
let rsmFrameBufferInfo = undefined
let gFrameBufferInfo = undefined

let samplesTexture = undefined

// Set up a box
let box = new ModelObject()
box.name = "A freaking box"
box.model_data.push({
    position: [1, 1, -1, 1, 1, 1, 1, -1, 1, 1, -1, -1, -1, 1, 1, -1, 1, -1, -1, -1, -1, -1, -1, 1, -1, 1, 1, 1, 1, 1, 1, 1, -1, -1, 1, -1, -1, -1, -1, 1, -1, -1, 1, -1, 1, -1, -1, 1, 1, 1, 1, -1, 1, 1, -1, -1, 1, 1, -1, 1, -1, 1, -1, 1, 1, -1, 1, -1, -1, -1, -1, -1],
    normal: [1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1],
    texcoord: [1, 0, 0, 0, 0, 1, 1, 1, 1, 0, 0, 0, 0, 1, 1, 1, 1, 0, 0, 0, 0, 1, 1, 1, 1, 0, 0, 0, 0, 1, 1, 1, 1, 0, 0, 0, 0, 1, 1, 1, 1, 0, 0, 0, 0, 1, 1, 1],
    indices: [0, 1, 2, 0, 2, 3, 4, 5, 6, 4, 6, 7, 8, 9, 10, 8, 10, 11, 12, 13, 14, 12, 14, 15, 16, 17, 18, 16, 18, 19, 20, 21, 22, 20, 22, 23],
})
box.position = v3.create(0, 1, 0)
box.rotation = v3.create(0, glMatrix.toRadian(45), 0)
box.material.do_reflection = false
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
//obj2.cast_shadow = false
obj2.material.do_reflection = false
obj2.rotation = v3.create(glMatrix.toRadian(90), 0, 0)
obj2.textures.push([
    16, 220, 220, 255,
    220, 220, 16, 255,
    220, 16, 220, 255
])

let floor = new ModelObject()
floor.name = "Floor"
//floor.cast_shadow = false
floor.material.shininess = 1
floor.textures.push([
    24, 24, 255, 255,
])
floor.material.flux = [0.1, 0.1, 0.9, 1.0]

let g_wall = new ModelObject()
g_wall.name = "Green Wall"
//g_wall.cast_shadow = false
g_wall.position = v3.create(0, 5, 5)
g_wall.rotation = v3.create(glMatrix.toRadian(-90), 0, 0)
g_wall.textures.push([
    24, 180, 24, 255,
])
g_wall.material.flux = [0.1, 0.9, 0.1, 1.0]

let r_wall = new ModelObject()
r_wall.name = "Red Wall"
//r_wall.cast_shadow = false
r_wall.position = v3.create(5, 5, 0)
r_wall.rotation = v3.create(0, 0, glMatrix.toRadian(90))
r_wall.textures.push([
    180, 24, 24, 255,
])
r_wall.material.flux = [0.9, 0.1, 0.1, 1.0]

let g_wall_2 = new ModelObject()
g_wall_2.name = "Green Wall 2"
//g_wall_2.cast_shadow = false
g_wall_2.position = v3.create(0, 5, -5)
g_wall_2.rotation = v3.create(glMatrix.toRadian(90), 0, 0)
g_wall_2.textures.push([
    24, 180, 24, 255,
])
g_wall_2.material.flux = [0.1, 0.9, 0.1, 1.0]

let r_wall_2 = new ModelObject()
r_wall_2.name = "Red Wall 2"
//r_wall_2.cast_shadow = false
r_wall_2.position = v3.create(-5, 5, 0)
r_wall_2.rotation = v3.create(0, 0, glMatrix.toRadian(-90))
r_wall_2.textures.push([
    180, 24, 24, 255,
])
r_wall_2.material.flux = [0.9, 0.1, 0.1, 1.0]

// Set up a directional light
let directional_light = new DirectionalLightObject()
directional_light.name = "MyLittleDirectionalLight"
directional_light.color = [0.8, 0.8, 0.8, 1]
directional_light.power = 0.5

/* Set up a point light */
let point_light = new PointLightObject()
point_light.name = "MyLittlePointLight"
point_light.position = v3.create(1, 2.5, 1)
point_light.color = [0.9, 0.9, 0.1, 1]
point_light.power = 0
point_light.exp = 0.6
/**/

/**/
let spot_light = new SpotLightObject()
spot_light.name = "MyLittleSpotLight"
spot_light.position = v3.create(1, 1, -1)
spot_light.color = [0.9, 0.1, 0.1, 1]
spot_light.power = 0
spot_light.exp = 0.6
spot_light.cutoff = 0.9
/**/

// Set up a camera
let camera = new BasicCameraObject()
camera.name = "MyLittleCamera"
camera.position = v3.create(-2, 5, -6)
camera.rotation = v3.create(-0.4, -1.2, 0)
camera.fov_angle = 60
camera.zFar = 300

let object_list = []

let depth_tex = {}
let normal_tex = {}
let flux_tex = {}
let worldPos_tex = {}
//let depth_cube_tex = []

let bump_uniforms = {
    M: m4.identity(),
    N: m4.identity(),
    V: m4.identity(),
    P: m4.identity(),
}
let dirLight_uniforms = {
    "dirLight.dir": v3.create(),
    "dirLight.color": [1, 1, 1, 1],
    "dirLight.power": 1,
}
let pointLight_uniforms = {
    pointLights_num: 0,
    pointLights_color: [],
    pointLights_position: [],
    pointLights_power: [],
    pointLights_constant: [],
    pointLights_linear: [],
    pointLights_exp: [],
}
/*
let pointLight_struct_uniforms = {
    pointLights_num: 0
}
*/
let spotLight_uniforms = {
    spotLights_num: 0,
    spotLights_color: [],
    spotLights_position: [],
    spotLights_direction: [],
    spotLights_power: [],
    spotLights_constant: [],
    spotLights_linear: [],
    spotLights_exp: [],
    spotLights_cutoff: [],
}
let depth_uniforms = {}
let light_hint_uniforms = {}
let rsm_uniforms = {}
let direct_lighting_uniforms = {}
let indirect_lighting_uniforms = {}

let previous_time = 0
let delta_time = 0

let bias_matrix = [
    0.5, 0.0, 0.0, 0.0,
    0.0, 0.5, 0.0, 0.0,
    0.0, 0.0, 0.5, 0.0,
    0.5, 0.5, 0.5, 1.0
]

let canMove = false
let previousMousePosition = vec2.create()
let cameraMoveDirection = vec2.create()

/* Keyboard control */
document.addEventListener("keydown", function (event) {
    if (event.keyCode == 32) {
        console.log(camera.rotation)
    }

    // Light position control
    if (event.keyCode == 65) {
        point_light.translate([0.1, 0, 0])
        //console.log("Left")
    } else if (event.keyCode == 87) {
        point_light.translate([0, 0, 0.1])
        //console.log("Up")
    } else if (event.keyCode == 68) {
        point_light.translate([-0.1, 0, 0])
        //console.log("Right")
    } else if (event.keyCode == 83) {
        point_light.translate([0, 0, -0.1])
        //console.log("Up")
    } else if (event.keyCode == 33) {
        point_light.translate([0, 0.1, 0])
        //console.log("Up")
    } else if (event.keyCode == 34) {
        point_light.translate([0, -0.1, 0])
    }

    // Camera rotation control
    if (event.keyCode == 38) {
        camera.rotate([0.1, 0.0, 0.0])
    } else if (event.keyCode == 40) {
        camera.rotate([-0.1, 0.0, 0.0])
    } else if (event.keyCode == 37) {
        camera.rotate([0.0, 0.1, 0.0])
    } else if (event.keyCode == 39) {
        camera.rotate([0.0, -0.1, 0.0])
    }
})

function init() {
    canvas = document.createElement("canvas")
    canvas.width = 800
    canvas.height = 600
    document.body.appendChild(canvas)
    canvas.requestPointerLock = canvas.requestPointerLock

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

    twgl.addExtensionsToContext(gl)

    programInfo = twgl.createProgramInfo(gl, [defaultVertex, defaultFragment])
    rsmProgramInfo = twgl.createProgramInfo(gl, [rsmVertex, rsmFragment])
    directLightingProgramInfo = twgl.createProgramInfo(gl, [fullScreenVertex, directLightingFragment])
    indirectLightingProgramInfo = twgl.createProgramInfo(gl, [fullScreenVertex, indirectLightingFragment])
    lightHintProgramInfo = twgl.createProgramInfo(gl, [lightHintVertex, lightHintFragment])
    //console.log(bufferInfo)

    dirLight_uniforms = {
        "dirLight.dir": directional_light.forward,
        "dirLight.color": directional_light.color,
        "dirLight.power": directional_light.power,
    }

    pointLight_uniforms = {
        pointLights_num: 0,
        pointLights_color: [],
        pointLights_position: [],
        pointLights_power: [],
        pointLights_constant: [],
        pointLights_linear: [],
        pointLights_exp: [],
    }

    spotLight_uniforms = {
        spotLights_num: 0,
        spotLights_color: [],
        spotLights_position: [],
        spotLights_direction: [],
        spotLights_power: [],
        spotLights_constant: [],
        spotLights_linear: [],
        spotLights_exp: [],
        spotLights_cutoff: [],
    }

    depth_uniforms = {
        depthMVP: m4.identity()
    }
    light_hint_uniforms = {
        uniform_MVP: m4.identity()
    }

    // Make a samples texture
    const NUMBER_SAMPLES = 128
    let samples = []
    for (var i = 0; i < NUMBER_SAMPLES; i++) {
        let xi1 = Math.random()
        let xi2 = Math.random()

        let x = xi1 * Math.sin(2 * Math.PI * xi2)
        let y = xi1 * Math.cos(2 * Math.PI * xi2)

        samples.push([x, y, xi1])
    }
    let SAMPLES_TEX_SIZE = 1
    while (SAMPLES_TEX_SIZE < NUMBER_SAMPLES) {
        SAMPLES_TEX_SIZE *= 2
    }

    indirect_lighting_uniforms["NUMBER_SAMPLES"] = NUMBER_SAMPLES
    indirect_lighting_uniforms["SAMPLES_TEX_SIZE"] = SAMPLES_TEX_SIZE

    let dat = []
    for (var i = 0; i < SAMPLES_TEX_SIZE; i++) {
        var p
        if (i < NUMBER_SAMPLES) {
            p = samples[i]
        } else {
            p = [0.0, 0.0, 0.0]
        }

        dat.push(p[0])
        dat.push(p[1])
        dat.push(p[2])
        dat.push(1.0)
    }

    // Set rsm frame buffer
    samplesTexture = twgl.createTexture(gl, {
        width: SAMPLES_TEX_SIZE,
        height: 1,
        minMag: gl.NEAREST,
        internalFormat: gl.RGBA32F,
        format: gl.RGBA,
        type: gl.FLOAT,
        src: dat
    })

    rsmFrameBufferInfo = twgl.createFramebufferInfo(gl, [{
            internalFormat: gl.RGBA32F,
            format: gl.RGBA,
            type: gl.FLOAT
        }, //depth
        {
            internalFormat: gl.RGBA32F,
            format: gl.RGBA,
            type: gl.FLOAT
        }, //normal
        {
            internalFormat: gl.RGBA32F,
            format: gl.RGBA,
            type: gl.FLOAT
        }, //flux
        {
            internalFormat: gl.RGBA32F,
            format: gl.RGBA,
            type: gl.FLOAT
        }, //world position
        {
            internalFormat: gl.DEPTH_COMPONENT24,
            format: gl.DEPTH_COMPONENT
        } //Enable depth
    ], shadowDepthTextureSize, shadowDepthTextureSize)

    gl.bindFramebuffer(gl.FRAMEBUFFER, rsmFrameBufferInfo.framebuffer)
    gl.drawBuffers([
        gl.COLOR_ATTACHMENT0,
        gl.COLOR_ATTACHMENT1,
        gl.COLOR_ATTACHMENT2,
        gl.COLOR_ATTACHMENT3
    ])

    gl.bindFramebuffer(gl.FRAMEBUFFER, null)

    // Set a geometry frame buffer
    gFrameBufferInfo = twgl.createFramebufferInfo(gl, [{
            internalFormat: gl.RGBA32F,
            format: gl.RGBA,
            type: gl.FLOAT
        }, //color
        {
            internalFormat: gl.RGBA32F,
            format: gl.RGBA,
            type: gl.FLOAT
        }, //normal
        {
            internalFormat: gl.RGBA32F,
            format: gl.RGBA,
            type: gl.FLOAT
        }, //world position 
        {
            internalFormat: gl.DEPTH_COMPONENT24,
            format: gl.DEPTH_COMPONENT
        }
    ], canvas.width, canvas.height)

    gl.bindFramebuffer(gl.FRAMEBUFFER, gFrameBufferInfo.framebuffer)
    gl.drawBuffers([
        gl.COLOR_ATTACHMENT0,
        gl.COLOR_ATTACHMENT1,
        gl.COLOR_ATTACHMENT2
    ])

    gl.bindFramebuffer(gl.FRAMEBUFFER, null)

    // Check frame buffer complete
    if (gl.checkFramebufferStatus(gl.FRAMEBUFFER) != gl.FRAMEBUFFER_COMPLETE) {
        return false
    }

    // Mouse test
    canvas.addEventListener("mousedown", (e) => {
        var rect = canvas.getBoundingClientRect()
        //canvas.requestPointerLock()
        console.log((e.clientX - rect.left) + ", " + (e.clientY - rect.top))
    })
}

//var pixels
function render(time) {

    time *= 0.001
    delta_time = time - previous_time
    previous_time = time

    twgl.resizeCanvasToDisplaySize(gl.canvas)

    /* Setting the light */
    dirLight_uniforms = {
        "dirLight.dir": directional_light.forward,
        "dirLight.color": directional_light.color,
        "dirLight.power": directional_light.power,
    }
    // Reset the uniforms
    pointLight_uniforms = {
        pointLights_num: 0,
        pointLights_color: [],
        pointLights_position: [],
        pointLights_power: [],
        pointLights_constant: [],
        pointLights_linear: [],
        pointLights_exp: [],
    }
    spotLight_uniforms = {
        spotLights_num: 0,
        spotLights_color: [],
        spotLights_position: [],
        spotLights_direction: [],
        spotLights_power: [],
        spotLights_constant: [],
        spotLights_linear: [],
        spotLights_exp: [],
        spotLights_cutoff: [],
    }

    /* Update the point light uniform */
    pointLight_uniforms = point_light.getNewUniform(pointLight_uniforms)
    /* Update the spot light uniform */
    spotLight_uniforms = spot_light.getNewUniform(spotLight_uniforms)

    let light_inv_dir = [-directional_light.forward[0], -directional_light.forward[1], -directional_light.forward[2], ]

    let world = m4.identity()

    /* Shadow mapping frame buffer */
    twgl.bindFramebufferInfo(gl, rsmFrameBufferInfo)

    gl.enable(gl.DEPTH_TEST)
    gl.enable(gl.CULL_FACE)
    gl.cullFace(gl.BACK)

    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)

    //gl.useProgram(depthProgramInfo.program)
    gl.useProgram(rsmProgramInfo.program)

    let depth_M = m4.identity()
    let depth_P = m4.ortho(-10, 10, -10, 10, -10, 20)
    //let depth_P = m4.perspective(glMatrix.toRadian(45), 1, 2, 50)
    let depth_V = m4.inverse(
        //m4.lookAt(point_light.position, v3.subtract(point_light.position, light_inv_dir), [0, 1, 0])
        m4.lookAt(light_inv_dir, [0, 0, 0], [0, 1, 0])
    )
    let depth_MVP = m4.identity()

    // Shadow pass (Directional light)
    rsm_uniforms["light_P"] = depth_P
    rsm_uniforms["light_V"] = depth_V
    object_list.forEach(element => {
        if (!element.cast_shadow) {
            return
        }
        world = element.transformMatrix
        depth_M = world

        depth_MVP = m4.multiply(m4.multiply(depth_P, depth_V), depth_M)
        rsm_uniforms["do_reflection"] = element.material.do_reflection
        rsm_uniforms["M"] = world
        rsm_uniforms["color"] = element.material.flux
        rsm_uniforms["N"] = m4.transpose(m4.inverse(m4.multiply(depth_V, depth_M)))

        bufferInfo = element.bufferInfo
        twgl.setBuffersAndAttributes(gl, rsmProgramInfo, bufferInfo)
        twgl.setUniforms(rsmProgramInfo, rsm_uniforms)
        twgl.drawBufferInfo(gl, bufferInfo)

        //console.log(pixels)
    })

    /* Phong shader */
    gl.enable(gl.POLYGON_OFFSET_FILL)
    gl.polygonOffset(1.0, 2.0)
    twgl.bindFramebufferInfo(gl, gFrameBufferInfo)
    //gl.bindFramebuffer(gl.FRAMEBUFFER, null)
    gl.viewport(0, 0, canvas.width, canvas.height)

    gl.cullFace(gl.BACK)
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)

    gl.useProgram(programInfo.program)

    // Camera Settings
    const camera_mat = m4.lookAt(camera.position, camera.forward, camera.up)
    const view = m4.inverse(camera_mat)
    const viewProjection = m4.multiply(camera.projection, view)

    bump_uniforms.V = view
    bump_uniforms.P = camera.projection
    bump_uniforms.cam_pos = camera.position

    // RSM texture
    bump_uniforms.depth_texture = rsmFrameBufferInfo.attachments[0]
    //bump_uniforms.depth_cube_texture = depth_cube_tex

    /* Scene render pass */
    object_list.forEach(element => {
        world = element.transformMatrix

        bump_uniforms.M = world
        bump_uniforms.N = m4.transpose(m4.inverse(m4.multiply(view, world)))
        bump_uniforms.diffuse_color = element.material.diffuse
        bump_uniforms.ambient_color = element.material.ambient
        bump_uniforms.specular_color = element.material.specular
        bump_uniforms.shininess = element.material.shininess
        bump_uniforms.texture_0 = twgl.createTexture(gl, {
            minMag: gl.NEAREST,
            src: element.textures[0]
        }) // rsmFrameBufferInfo.attachments[0] 

        if (element.recive_shadow) {
            depth_M = world
            depth_MVP = m4.multiply(m4.multiply(depth_P, depth_V), depth_M)
            bump_uniforms.light_P = depth_P
            bump_uniforms.light_V = depth_V
            bump_uniforms.depthBiasMVP = m4.multiply(bias_matrix, depth_MVP)
        }

        bufferInfo = element.bufferInfo
        twgl.setBuffersAndAttributes(gl, programInfo, bufferInfo)

        var uniforms_list = [bump_uniforms, dirLight_uniforms]
        if (pointLight_uniforms.pointLights_num > 0) {
            uniforms_list.push(pointLight_uniforms)
        }
        if (spotLight_uniforms.spotLights_num > 0) {
            uniforms_list.push(spotLight_uniforms)
        }

        twgl.setUniforms(programInfo, uniforms_list)
        twgl.drawBufferInfo(gl, bufferInfo)
    })

    // Draw the light hint
    world = m4.translation(point_light.position)
    //world = m4.translation(point_light.position)
    light_hint_uniforms.uniform_MVP = m4.multiply(viewProjection, world)

    gl.useProgram(lightHintProgramInfo.program)

    bufferInfo = twgl.primitives.createSphereBufferInfo(gl, 0.1, 8, 8)
    twgl.setBuffersAndAttributes(gl, lightHintProgramInfo, bufferInfo)
    twgl.setUniforms(lightHintProgramInfo, light_hint_uniforms)
    twgl.drawBufferInfo(gl, bufferInfo)

    gl.bindFramebuffer(gl.FRAMEBUFFER, null)

    // Draw scene
    //gl.enable(gl.BLEND)
    //gl.blendFunc(gl.ONE, gl.ONE_MINUS_CONSTANT_ALPHA)
    gl.useProgram(directLightingProgramInfo.program)

    direct_lighting_uniforms = {
        color_texture: gFrameBufferInfo.attachments[0]
    }

    bufferInfo = twgl.primitives.createXYQuadBufferInfo(gl)
    twgl.setBuffersAndAttributes(gl, directLightingProgramInfo, bufferInfo)
    twgl.setUniforms(directLightingProgramInfo, direct_lighting_uniforms)
    twgl.drawBufferInfo(gl, bufferInfo)

    /* Reflection
    gl.useProgram(indirectLightingProgramInfo.program)

    indirect_lighting_uniforms["g_normal_texture"] = gFrameBufferInfo.attachments[1]
    indirect_lighting_uniforms["g_worldPos_texture"] = gFrameBufferInfo.attachments[2]
    
    indirect_lighting_uniforms["depth_texture"] = rsmFrameBufferInfo.attachments[0],
    indirect_lighting_uniforms["normal_texture"] = rsmFrameBufferInfo.attachments[1]
    indirect_lighting_uniforms["flux_texture"] = rsmFrameBufferInfo.attachments[2]
    indirect_lighting_uniforms["worldPos_texture"] = rsmFrameBufferInfo.attachments[3]
    
    indirect_lighting_uniforms["samples_texture"] = samplesTexture

    indirect_lighting_uniforms["light_P"] = depth_P
    indirect_lighting_uniforms["light_V"] = depth_V

    twgl.setBuffersAndAttributes(gl, indirectLightingProgramInfo, bufferInfo)
    twgl.setUniforms(indirectLightingProgramInfo, indirect_lighting_uniforms)
    twgl.drawBufferInfo(gl, bufferInfo)
    */

    gl.disable(gl.BLEND)

    gl.useProgram(null)

    /* Updating shit */
    update(delta_time)
    requestAnimationFrame(render)
}

function start() {

    // Adding object
    let file_path = "assets/Duck/Duck.gltf"
    glTFLoader.loadGLTF(file_path, (glTF) => {
        ModelObject.loadGLTF(box, glTF)

    })
    console.log(box.model_data)
    box.bufferInfo = twgl.createBufferInfoFromArrays(gl, box.model_data[0])
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
    spot_light.rotation = v3.create(-0.4, -1.2, 0)

    pointLight_uniforms = point_light.getNewUniform(pointLight_uniforms)
    spotLight_uniforms = spot_light.getNewUniform(spotLight_uniforms)
}

function update(dt) {

    obj2.rotate([dt, 0, 0])
    spot_light.rotate([0, dt, 0])
    directional_light.rotate([0, -dt / 4, 0])

    if (canMove) {
        //camera.rotate([-cameraMoveDirection[1]* dt, -cameraMoveDirection[0]* dt, 0])
        if (vec2.length(cameraMoveDirection) > 0) {
            //vec2.sub(cameraMoveDirection, cameraMoveDirection , [cameraMoveDirection[0] * dt, cameraMoveDirection[1] * dt])
        }

    }
}

init()
start()
requestAnimationFrame(render)