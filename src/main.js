import * as twgl from "twgl.js"
import * as MinimalGLTFLoader from "minimal-gltf-loader"
import {
    glMatrix,
    vec2
} from "gl-matrix"

import * as keyboardjs from "keyboardjs"

const m4 = twgl.m4
const v3 = twgl.v3

import { Renderer, BasicScene } from "./Systems"
import { BasicState } from "./States"
import {
    ModelObject,
    PointLightObject,
    DirectionalLightObject,
    SpotLightObject,
    BasicCameraObject
} from "./object"

let glTFLoader = new MinimalGLTFLoader.glTFLoader()

// Set up a box
let box = new ModelObject({
    glTF_path: "assets/Duck/Duck.gltf",
    name: "A freaking box",
    position: v3.create(0, 1, 0),
    rotation: v3.create(0, glMatrix.toRadian(45), 0),
    scale: v3.create(0.02, 0.02, 0.02),
    material: {
        do_reflection: false
    },
})

let obj2 = new ModelObject({
    name: "Object2",
    position: v3.create(3, 3, 3),
    rotation: v3.create(glMatrix.toRadian(90), 0, 0),
    textures_src: [
        [
            16, 220, 220, 255,
            220, 220, 16, 255,
            220, 16, 220, 255
        ]
    ],
    material: {
        do_reflection: false
    },
    //cast_shadow: false,
})

let floor = new ModelObject({
    name: "Floor",
    textures_src: [
        [60, 135, 255, 255, ]
    ],
    material: {
        shininess: 1,
        flux: [0.23, 0.53, 0.9, 1.0]
    },
    cast_shadow: true
})

let g_wall = new ModelObject({
    name: "Green Wall",
    position: v3.create(0, 5, 5),
    rotation: v3.create(glMatrix.toRadian(-90), 0, 0),
    textures_src: [
        [54, 218, 100, 255]
    ],
    material: {
        flux: [0.1, 0.9, 0.1, 1.0],
    },
    //cast_shadow = false
})

let r_wall = new ModelObject({
    name: "Red Wall",
    position: v3.create(5, 5, 0),
    rotation: v3.create(0, 0, glMatrix.toRadian(90)),
    textures_src: [
        [180, 24, 24, 255, ]
    ],
    material: {
        flux: [0.9, 0.1, 0.1, 1.0],
    },
    //cast_shadow = false
})

let g_wall_2 = new ModelObject({
    name: "Green Wall 2",
    position: v3.create(0, 5, -5),
    rotation: v3.create(glMatrix.toRadian(90), 0, 0),
    textures_src: [
        [54, 218, 100, 255]
    ],
    material: {
        flux: [0.1, 0.9, 0.1, 1.0],
    },
    //cast_shadow = false
})

let r_wall_2 = new ModelObject({
    name: "Red Wall 2",
    position: v3.create(-5, 5, 0),
    rotation: v3.create(0, 0, glMatrix.toRadian(-90)),
    textures_src: [
        [180, 24, 24, 255, ]
    ],
    material: {
        flux: [0.9, 0.1, 0.1, 1.0],
    },
    //cast_shadow = false
})

// Set up a directional light
let directional_light = new DirectionalLightObject({
    name: "MyLittleDirectionalLight",
    color: [0.8, 0.8, 0.8, 1],
    power: 0.6,
})

/* Set up a point light */
let point_light = new PointLightObject({
    name: "MyLittlePointLight",
    position: v3.create(-4, 1, 4),
    color: [0.9, 0.9, 0.1, 1],
    power: 0.6,
    exp: 0.6
})
/**/

/* Set up a spot light */
let spot_light = new SpotLightObject({
    name: "MyLittleSpotLight",
    position: v3.create(1, 1, -1),
    color: [0.9, 0.9, 0.1, 1],
    power: 10.0,
    exp: 0.6,
    cutoff: 0.9
})
/**/

// Set up a camera
let camera = new BasicCameraObject({
    name: "MyLittleCamera",
    position: v3.create(-2, 5, -6),
    rotation: v3.create(-0.4, -1.2, 0),
    fov_angle: 60,
    zFar: 300
})

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
        camera.translate([0.1, 0, 0])
        //console.log("Left")
    } else if (event.keyCode == 87) {
        camera.translate([0, 0, 0.1])
        //console.log("Up")
    } else if (event.keyCode == 68) {
        camera.translate([-0.1, 0, 0])
        //console.log("Right")
    } else if (event.keyCode == 83) {
        camera.translate([0, 0, -0.1])
        //console.log("Up")
    } else if (event.keyCode == 33) {
        camera.translate([0, 0.1, 0])
        //console.log("Up")
    } else if (event.keyCode == 34) {
        camera.translate([0, -0.1, 0])
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

class TestState extends BasicState {
    constructor(scene, renderer) {
        super()

        this.scene = scene
        this.renderer = renderer

        this.ready = false

    }

    init(scene, renderer) {
        super.init()

        const gl = this.renderer.gl

        //this.scene.object_list.push(box)
        this.scene.object_list.push(obj2)
        this.scene.object_list.push(floor)
        this.scene.object_list.push(r_wall)
        this.scene.object_list.push(g_wall)
        this.scene.object_list.push(r_wall_2)
        this.scene.object_list.push(g_wall_2)

        obj2.bufferInfo = twgl.primitives.createTorusBufferInfo(gl, 1, 0.5, 16, 16)
        floor.bufferInfo = twgl.primitives.createPlaneBufferInfo(gl, 10, 10)
        r_wall.bufferInfo = twgl.primitives.createPlaneBufferInfo(gl, 10, 10)
        g_wall.bufferInfo = twgl.primitives.createPlaneBufferInfo(gl, 10, 10)
        r_wall_2.bufferInfo = twgl.primitives.createPlaneBufferInfo(gl, 10, 10)
        g_wall_2.bufferInfo = twgl.primitives.createPlaneBufferInfo(gl, 10, 10)

        this.scene.object_list.forEach(element => {
            element.textures.push(twgl.createTexture(gl, {
                min: gl.NEAREST_MIPMAP_LINEAR,
                mag: gl.LINEAR,
                warp: gl.REPEAT,
                src: element.textures_src[0]
            }))
        })

        this.scene.camera = camera

        this.scene.directional_light = directional_light
        this.scene.spot_lights.push(spot_light)
        this.scene.point_lights.push(point_light)

        this.start()
    }

    start() {
        super.start()

        directional_light.rotation = v3.create(-0.6, -1.2, 0)
        spot_light.rotation = v3.create(glMatrix.toRadian(0), -1.2, 0)
    }

    update(dt) {
        obj2.rotate([dt, 0, 0])
        //spot_light.rotate([0, dt / 6, 0])
        directional_light.rotate([0, -dt / 4, 0])

        if (canMove) {
            //camera.rotate([-cameraMoveDirection[1]* dt, -cameraMoveDirection[0]* dt, 0])
            if (vec2.length(cameraMoveDirection) > 0) {
                //vec2.sub(cameraMoveDirection, cameraMoveDirection , [cameraMoveDirection[0] * dt, cameraMoveDirection[1] * dt])
            }

        }
    }
}

const main_renderer = new Renderer()
let my_scene = new BasicScene()
let state = new TestState(my_scene, main_renderer)

function init() {
    my_scene.enterNewState(state)

    my_scene.init()

    // Lazy Load
    let file_path = box.glTF_path
    glTFLoader.loadGLTF(file_path, (glTF) => {

        box.loadGLTF(glTF)
        //console.log(box.textures_src)
        box.textures.push(twgl.createTexture(main_renderer.gl, {
            min: main_renderer.gl.NEAREST_MIPMAP_LINEAR,
            mag: main_renderer.gl.LINEAR,
            warp: main_renderer.gl.REPEAT,
            src: box.textures_src[0]
        }))

        box.setBufferInfo(twgl.createBufferInfoFromArrays(main_renderer.gl, box.mesh_data[0]))
        my_scene.object_list.push(box)
        state.ready = true
        requestAnimationFrame(run)
    })
    
}

function run(time) {
    main_renderer.render(my_scene)
    my_scene.update(time)

    requestAnimationFrame(run)
}
init()