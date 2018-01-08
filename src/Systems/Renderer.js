import * as twgl from "twgl.js"
const m4 = twgl.m4
const v3 = twgl.v3

export class Renderer {
    constructor(canvas /*: HTMLCanvasElement */ ) {
        this.canvas = document.createElement("canvas") || canvas
        this.gl /*: WebGLRenderingContext */ = undefined

        // Shader programs
        this.colorProgramInfo = undefined
        this.rsmProgramInfo = undefined
        this.indirectLightingProgramInfo = undefined
        this.directLightingProgramInfo = undefined
        this.lightHintProgramInfo = undefined

        // Object buffer info
        this.bufferInfo = undefined

        // Frame buffer infos
        this.rsmFrameBufferInfo = undefined
        this.gFrameBufferInfo = undefined

        // Sampling texture for RSM
        this.samplesTexture = undefined

        this.default_uniforms = {
            M: m4.identity(),
            N: m4.identity(),
            V: m4.identity(),
            P: m4.identity(),
        }

        this.dirLight_uniforms = {
            "dirLight.dir": v3.create(),
            "dirLight.color": [0, 0, 0, 1],
            "dirLight.power": 0,
        }
        this.pointLight_uniforms = {
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
        this.spotLight_uniforms = {
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

        this.depth_uniforms = {}
        this.light_hint_uniforms = {}
        this.rsm_uniforms = {}
        this.direct_lighting_uniforms = {}
        this.indirect_lighting_uniforms = {}
        this.init()
    }

    init() {
        const shadowDepthTextureSize = 1024

        // Import shaders
        let defaultVertex = require("../shader/default.vert")
        let defaultFragment = require("../shader/default.frag")
        let lightHintVertex = require("../shader/light_hint.vert")
        let lightHintFragment = require("../shader/light_hint.frag")
        let rsmVertex = require("../shader/rsm.vert")
        let rsmFragment = require("../shader/rsm.frag")
        let indirectLightingFragment = require("../shader/indirect_lighting.frag")
        let directLightingFragment = require("../shader/direct_lighting.frag")
        let fullScreenVertex = require("../shader/full_screen.vert")

        this.canvas.width = 800
        this.canvas.height = 600
        document.body.appendChild(this.canvas)

        this.gl = this.canvas.getContext("webgl2")

        const gl /*: WebGLRenderingContext */ = this.gl
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

        // Initialize shaders
        this.colorProgramInfo = twgl.createProgramInfo(gl, [defaultVertex, defaultFragment])
        this.rsmProgramInfo = twgl.createProgramInfo(gl, [rsmVertex, rsmFragment])
        this.directLightingProgramInfo = twgl.createProgramInfo(gl, [fullScreenVertex, directLightingFragment])
        this.indirectLightingProgramInfo = twgl.createProgramInfo(gl, [fullScreenVertex, indirectLightingFragment])
        this.lightHintProgramInfo = twgl.createProgramInfo(gl, [lightHintVertex, lightHintFragment])

        this.depth_uniforms = {
            depthMVP: m4.identity()
        }
        this.light_hint_uniforms = {
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

        this.indirect_lighting_uniforms["NUMBER_SAMPLES"] = NUMBER_SAMPLES
        this.indirect_lighting_uniforms["SAMPLES_TEX_SIZE"] = SAMPLES_TEX_SIZE

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
        this.samplesTexture = twgl.createTexture(gl, {
            width: SAMPLES_TEX_SIZE,
            height: 1,
            minMag: gl.NEAREST,
            internalFormat: gl.RGBA32F,
            format: gl.RGBA,
            type: gl.FLOAT,
            src: dat
        })

        this.rsmFrameBufferInfo = twgl.createFramebufferInfo(gl, [{
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

        gl.bindFramebuffer(gl.FRAMEBUFFER, this.rsmFrameBufferInfo.framebuffer)
        gl.drawBuffers([
            gl.COLOR_ATTACHMENT0,
            gl.COLOR_ATTACHMENT1,
            gl.COLOR_ATTACHMENT2,
            gl.COLOR_ATTACHMENT3
        ])

        gl.bindFramebuffer(gl.FRAMEBUFFER, null)

        // Set a geometry frame buffer
        this.gFrameBufferInfo = twgl.createFramebufferInfo(gl, [{
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
        ], this.canvas.width, this.canvas.height)

        gl.bindFramebuffer(gl.FRAMEBUFFER, this.gFrameBufferInfo.framebuffer)
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
    }

    resetLighting(scene) {
        if (scene.directional_light != undefined) {
            this.dirLight_uniforms = {
                "dirLight.dir": scene.directional_light.forward,
                "dirLight.color": scene.directional_light.color,
                "dirLight.power": scene.directional_light.power,
            }
        } else {
            this.dirLight_uniforms = {
                "dirLight.dir": v3.create(),
                "dirLight.color": [0, 0, 0, 1],
                "dirLight.power": 0,
            }
        }

        this.pointLight_uniforms = {
            pointLights_num: 0,
            pointLights_color: [],
            pointLights_position: [],
            pointLights_power: [],
            pointLights_constant: [],
            pointLights_linear: [],
            pointLights_exp: [],
        }

        this.spotLight_uniforms = {
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
    }

    draw(time) {}

    drawShadow(scene) {
        const gl /*: WebGLRenderingContext */ = this.gl

        let light_inv_dir = [-scene.directional_light.forward[0], -scene.directional_light.forward[1], -scene.directional_light.forward[2], ]

        let world = m4.identity()
        /* Shadow mapping frame buffer */
        twgl.bindFramebufferInfo(gl, this.rsmFrameBufferInfo)

        gl.enable(gl.DEPTH_TEST)
        gl.enable(gl.CULL_FACE)
        gl.cullFace(gl.BACK)

        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)

        //gl.useProgram(depthProgramInfo.program)
        gl.useProgram(this.rsmProgramInfo.program)

        let depth_M = m4.identity()
        let depth_P = scene.directional_light.projection //m4.ortho(-10, 10, -10, 10, -10, 20)
        //let depth_P = m4.perspective(glMatrix.toRadian(45), 1, 2, 50)
        let depth_V = m4.inverse(
            //m4.lookAt(point_light.position, v3.subtract(point_light.position, light_inv_dir), [0, 1, 0])
            m4.lookAt(light_inv_dir, [0, 0, 0], [0, 1, 0])
        )
        let depth_MVP = m4.identity()

        // Shadow pass (Directional light)
        this.rsm_uniforms["light_P"] = depth_P
        this.rsm_uniforms["light_V"] = depth_V
        scene.object_list.forEach(element => {
            if (!element.cast_shadow) {
                return
            }
            world = element.transformMatrix
            depth_M = world

            depth_MVP = m4.multiply(m4.multiply(depth_P, depth_V), depth_M)
            this.rsm_uniforms["do_reflection"] = element.material.do_reflection
            this.rsm_uniforms["M"] = world
            //console.log(element.name + ": " + element.material.flux)

            this.rsm_uniforms["color"] = element.material.flux
            this.rsm_uniforms["N"] = m4.transpose(m4.inverse(m4.multiply(depth_V, depth_M)))

            this.bufferInfo = element.bufferInfo
            twgl.setBuffersAndAttributes(gl, this.rsmProgramInfo, this.bufferInfo)
            twgl.setUniforms(this.rsmProgramInfo, this.rsm_uniforms)
            twgl.drawBufferInfo(gl, this.bufferInfo)

            //console.log(pixels)
        })
    }

    drawColor(scene) {
        const gl /*: WebGLRenderingContext */ = this.gl
        const bias_matrix = [
            0.5, 0.0, 0.0, 0.0,
            0.0, 0.5, 0.0, 0.0,
            0.0, 0.0, 0.5, 0.0,
            0.5, 0.5, 0.5, 1.0
        ]

        let world = m4.identity()

        /* Phong shader */
        gl.enable(gl.POLYGON_OFFSET_FILL)
        gl.polygonOffset(1.0, 2.0)
        twgl.bindFramebufferInfo(gl, this.gFrameBufferInfo)
        //gl.bindFramebuffer(gl.FRAMEBUFFER, null)
        gl.viewport(0, 0, this.canvas.width, this.canvas.height)

        gl.cullFace(gl.BACK)
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)

        gl.useProgram(this.colorProgramInfo.program)

        // Camera Settings
        const camera_mat = m4.lookAt(scene.camera.position, scene.camera.forward, scene.camera.up)
        const view = m4.inverse(camera_mat)
        const viewProjection = m4.multiply(scene.camera.projection, view)

        this.default_uniforms.V = view
        this.default_uniforms.P = scene.camera.projection
        this.default_uniforms.cam_pos = scene.camera.position

        // RSM texture
        this.default_uniforms.depth_texture = this.rsmFrameBufferInfo.attachments[0]
        //bump_uniforms.depth_cube_texture = depth_cube_tex

        /* Scene render pass */
        scene.object_list.forEach(element => {
            world = element.transformMatrix

            this.default_uniforms.M = world
            this.default_uniforms.N = m4.transpose(m4.inverse(m4.multiply(view, world)))
            this.default_uniforms.diffuse_color = element.material.diffuse
            this.default_uniforms.ambient_color = element.material.ambient
            this.default_uniforms.specular_color = element.material.specular
            this.default_uniforms.shininess = element.material.shininess

            this.default_uniforms.texture_0 = element.textures[0] // rsmFrameBufferInfo.attachments[0] 

            if (element.recive_shadow && scene.directional_light != undefined) {
                let light_inv_dir = [-scene.directional_light.forward[0], -scene.directional_light.forward[1], -scene.directional_light.forward[2], ]

                let depth_M = world
                let depth_P = scene.directional_light.projection
                //let depth_P = m4.perspective(glMatrix.toRadian(45), 1, 2, 50)
                let depth_V = m4.inverse(
                    //m4.lookAt(point_light.position, v3.subtract(point_light.position, light_inv_dir), [0, 1, 0])
                    m4.lookAt(light_inv_dir, [0, 0, 0], [0, 1, 0])
                )
                let depth_MVP = m4.multiply(m4.multiply(depth_P, depth_V), depth_M)
                this.default_uniforms.light_P = depth_P
                this.default_uniforms.light_V = depth_V
                this.default_uniforms.depthBiasMVP = m4.multiply(bias_matrix, depth_MVP)
            }

            this.bufferInfo = element.bufferInfo
            twgl.setBuffersAndAttributes(gl, this.colorProgramInfo, this.bufferInfo)

            var uniforms_list = [this.default_uniforms, this.dirLight_uniforms]
            if (this.pointLight_uniforms.pointLights_num > 0) {
                uniforms_list.push(this.pointLight_uniforms)
            }
            if (this.spotLight_uniforms.spotLights_num > 0) {
                uniforms_list.push(this.spotLight_uniforms)
            }

            twgl.setUniforms(this.colorProgramInfo, uniforms_list)
            twgl.drawBufferInfo(gl, this.bufferInfo)
        })
    }

    render(scene /*: Scene*/ ) {
        const gl /*: WebGLRenderingContext */ = this.gl

        twgl.resizeCanvasToDisplaySize(gl.canvas)

        /* Setting the light */
        this.resetLighting(scene)

        /* Update the point light uniform */
        scene.point_lights.forEach(point_light => {
            this.pointLight_uniforms = point_light.getNewUniform(this.pointLight_uniforms)
        })

        /* Update the spot light uniform */
        scene.spot_lights.forEach(spot_light => {
            this.spotLight_uniforms = spot_light.getNewUniform(this.spotLight_uniforms)
        })

        if (scene.directional_light != undefined) {
            this.drawShadow(scene)
        }

        this.drawColor(scene)

        // Draw the light hint, we don't need this for now
        /*
        let world = m4.translation(point_light.position)
        light_hint_uniforms.uniform_MVP = m4.multiply(viewProjection, world)

        gl.useProgram(lightHintProgramInfo.program)

        bufferInfo = twgl.primitives.createSphereBufferInfo(gl, 0.1, 8, 8)
        twgl.setBuffersAndAttributes(gl, lightHintProgramInfo, bufferInfo)
        twgl.setUniforms(lightHintProgramInfo, light_hint_uniforms)
        twgl.drawBufferInfo(gl, bufferInfo)
        */

        gl.bindFramebuffer(gl.FRAMEBUFFER, null)

        // Final touch
        gl.enable(gl.BLEND)
        gl.blendFunc(gl.ONE, gl.ONE_MINUS_CONSTANT_ALPHA)

        this.bufferInfo = twgl.primitives.createXYQuadBufferInfo(gl)

        // Draw scene
        gl.useProgram(this.directLightingProgramInfo.program)

        this.direct_lighting_uniforms = {
            color_texture: this.gFrameBufferInfo.attachments[0]
        }
        twgl.setBuffersAndAttributes(gl, this.directLightingProgramInfo, this.bufferInfo)
        twgl.setUniforms(this.directLightingProgramInfo, this.direct_lighting_uniforms)
        twgl.drawBufferInfo(gl, this.bufferInfo)

        /* Reflection */
        let light_inv_dir = [-scene.directional_light.forward[0], -scene.directional_light.forward[1], -scene.directional_light.forward[2], ]        
        let depth_P = scene.directional_light.projection //m4.ortho(-10, 10, -10, 10, -10, 20)
        //let depth_P = m4.perspective(glMatrix.toRadian(45), 1, 2, 50)
        let depth_V = m4.inverse(
            //m4.lookAt(point_light.position, v3.subtract(point_light.position, light_inv_dir), [0, 1, 0])
            m4.lookAt(light_inv_dir, [0, 0, 0], [0, 1, 0])
        )
        
        gl.useProgram(this.indirectLightingProgramInfo.program)

        this.indirect_lighting_uniforms["g_normal_texture"] = this.gFrameBufferInfo.attachments[1]
        this.indirect_lighting_uniforms["g_worldPos_texture"] = this.gFrameBufferInfo.attachments[2]

        this.indirect_lighting_uniforms["depth_texture"] = this.rsmFrameBufferInfo.attachments[0]
        this.indirect_lighting_uniforms["normal_texture"] = this.rsmFrameBufferInfo.attachments[1]
        this.indirect_lighting_uniforms["flux_texture"] = this.rsmFrameBufferInfo.attachments[2]
        this.indirect_lighting_uniforms["worldPos_texture"] = this.rsmFrameBufferInfo.attachments[3]

        this.indirect_lighting_uniforms["samples_texture"] = this.samplesTexture

        this.indirect_lighting_uniforms["light_P"] = depth_P
        this.indirect_lighting_uniforms["light_V"] = depth_V
        this.indirect_lighting_uniforms["light_power"] = scene.directional_light.power

        twgl.setBuffersAndAttributes(gl, this.indirectLightingProgramInfo, this.bufferInfo)
        twgl.setUniforms(this.indirectLightingProgramInfo, this.indirect_lighting_uniforms)
        twgl.drawBufferInfo(gl, this.bufferInfo)
        /**/

        gl.disable(gl.BLEND)

        gl.useProgram(null)

    }
}