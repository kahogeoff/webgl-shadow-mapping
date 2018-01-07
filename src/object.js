import * as twgl from "twgl.js"
import * as MinimalGLTFLoader from "minimal-gltf-loader"
import {
    vec3
} from "gl-matrix"
//import { vec3 } from "gl-matrix"
const m4 = twgl.m4
const v3 = twgl.v3

const glTFLoader = new MinimalGLTFLoader.glTFLoader()

class BaseObject {
    constructor(args) {
        let _args = {}
        if (args != undefined) {
            _args = args
        }
        this.name = _args.name || "no_name"
        this.scale = _args.scale || v3.create(1, 1, 1)
        this.position = _args.position || v3.create()
        this.rotation = _args.rotation || v3.create()
    }

    get transformMatrix() {
        var mat = m4.identity()

        m4.multiply(mat, m4.scaling(this.scale), mat)
        m4.multiply(mat, m4.translation(this.position), mat)
        m4.multiply(mat, m4.rotationZ(this.rotation[2]), mat)
        m4.multiply(mat, m4.rotationY(this.rotation[1]), mat)
        m4.multiply(mat, m4.rotationX(this.rotation[0]), mat)

        return mat
    }

    get forward() {
        var x = this.position[0] + Math.cos(this.rotation[0]) * Math.cos(this.rotation[1])
        var y = this.position[1] + Math.sin(this.rotation[0])
        var z = this.position[2] - Math.cos(this.rotation[0]) * Math.sin(this.rotation[1])

        return v3.create(x, y, z)
    }

    translate(value /*: number[3]*/ ) {
        v3.add(this.position, value, this.position)
    }

    rotate(value /*: number[3]*/ ) {
        v3.add(this.rotation, value, this.rotation)
    }
}

export class ModelObject extends BaseObject {
    constructor(args) {
        super(args)
        let _args = {}
        if (args != undefined) {
            _args = args
        }

        //this.uniform = {}
        this.glTF_path = _args.glTF_path || ""
        this.mesh_data = []
        this.textures_src = _args.textures_src || []
        this.textures = []
        if (_args.material != undefined) {
            this.material = {
                do_reflection: (_args.material.do_reflection != (null||undefined)? _args.material.do_reflection : true),
                diffuse: _args.material.diffuse || [1, 1, 1, 1],
                ambient: _args.material.ambient || [0.1, 0.1, 0.1, 1],
                specular: _args.material.specular || [1, 1, 1, 1],
                flux: _args.material.flux || [1, 1, 1, 1], // Lazy flux
                shininess: _args.material.shininess || 8,
            }
        } else {
            this.material = {
                do_reflection: true,
                diffuse: [1, 1, 1, 1],
                ambient: [0.1, 0.1, 0.1, 1],
                specular: [1, 1, 1, 1],
                flux: [1, 1, 1, 1], // Lazy flux
                shininess: 8,
            }
        }
        this.bufferInfo = undefined
        //this.shaderProgramInfo = undefined

        this.childern /*: ModelObject[]*/ = _args.childern || []
        this.cast_shadow = _args.cast_shadow || true
        this.recive_shadow = _args.recive_shadow || true
    }

    static loadGLTF(object, glTF) {
        //console.log(glTF)

        var i = 0
        var current_scene = glTF.scenes[glTF.defaultScene]
        var tmp_v3_translate = v3.create()

        for (var mid = 0, meshes_num = glTF.meshes.length; mid < meshes_num; mid++) {
            var mesh = glTF.meshes[mid]

            for (var i = 0, len = mesh.primitives.length; i < len; ++i) {
                var primitive = mesh.primitives[i]
                //var indices = primitive.indices
                var data = {
                    indices: new Uint16Array(glTF.accessors[primitive.indices].bufferView.data),
                    position: new Float32Array(primitive.attributes.POSITION.bufferView.data, primitive.attributes.POSITION.byteOffset),
                    normal: new Float32Array(primitive.attributes.NORMAL.bufferView.data, primitive.attributes.NORMAL.byteOffset)
                }

                if (primitive.attributes.TEXCOORD_0) {
                    console.log("I have texture")
                    data["texcoord"] = new Float32Array(primitive.attributes.TEXCOORD_0.bufferView.data)

                } else {
                    console.log("No I don't")
                }
                //var position = new Float32Array (primitive.attributes.NORMAL.bufferView.data)

                object.mesh_data.push(data)

                if (glTF.images) {
                    object.textures_src.push(glTF.images[0].currentSrc)
                } else {
                    //object.textures_src.push([255, 255, 255, 255])
                }

            }
        }
    }

    static setBufferInfo(object, bufferInfo){
        console.log(bufferInfo)
        
        object.bufferInfo = bufferInfo
        
    }
}

export class BasicLightObject extends BaseObject {
    constructor(args) {
        super(args)
        let _args = {}
        if (args != undefined) {
            _args = args
        }

        this.name = _args.name || "BasicLight"
        this.color = _args.color || [1, 1, 1, 1]
        this.power = _args.power || 50.0
        //this.ambient = [0, 0, 0, 1]

    }
}

export class DirectionalLightObject extends BasicLightObject {

    constructor(args) {
        super(args)
        let _args = {}
        if (args != undefined) {
            _args = args
        }

        this.name = _args.name || "DirectionalLight"
        //this.direction = [0, -1, 0]
        //this.ambient = [0, 0, 0, 1]

    }

    get projection() {
        return m4.ortho(-10, 10, -10, 10, -10, 20)
    }
}

global.nextPointLightID = 0
global.nextSpotLightID = 0

export class PointLightObject extends BasicLightObject {
    constructor(args) {
        super(args)
        let _args = {}
        if (args != undefined) {
            _args = args
        }
        
        this.id = global.nextPointLightID
        this.name = _args.name || "PointLight"
        this.constant = _args.constant || 1.0
        this.linear = _args.linear || 1.0
        this.exp = _args.exp || 1.0
        //this.ambient = [0, 0, 0, 1]

        global.nextPointLightID++

    }

    getNewUniform(uniform, prefix /*: string*/ = "pointLights") {
        var new_uniform = uniform
        new_uniform[prefix + "_color"] = new_uniform[prefix + "_color"].concat(this.color)
        new_uniform[prefix + "_position"] = new_uniform[prefix + "_position"].concat(Array.from(this.position))
        new_uniform[prefix + "_power"].push(this.power)
        new_uniform[prefix + "_linear"].push(this.linear)
        new_uniform[prefix + "_exp"].push(this.exp)
        new_uniform[prefix + "_constant"].push(this.constant)
        new_uniform[prefix + "_num"] += 1
        return new_uniform
    }

    /*
    updateUniform(uniform, prefix = "pointLights"){
        //var new_uniform = uniform

        uniform[`${prefix}[${this.id}].color`] = this.color
        uniform[`${prefix}[${this.id}].position`] = this.position
        uniform[`${prefix}[${this.id}].power`] = this.power
        uniform[`${prefix}[${this.id}].linear`] = this.linear
        uniform[`${prefix}[${this.id}].exp_factor`] = this.exp
        uniform[`${prefix}[${this.id}].constant`] = this.constant
    }
    */
}

export class SpotLightObject extends PointLightObject {
    
    constructor(args) {
        super(args)
        let _args = {}
        if (args != undefined) {
            _args = args
        }

        this.id = global.nextSpotLightID
        this.name = _args.name || "SpotLight"
        this.cutoff = _args.cutoff || 1.0
        //this.ambient = [0, 0, 0, 1]
        global.nextSpotLightID++
    }

    get direction() {
        return v3.subtract(this.position, this.forward)
    }

    getNewUniform(uniform, prefix /*: string*/ = "spotLights") {
        var new_uniform = super.getNewUniform(uniform, prefix)
        new_uniform[prefix + "_direction"] = new_uniform[prefix + "_direction"].concat(Array.from(this.direction))
        new_uniform[prefix + "_cutoff"].push(this.cutoff)

        return new_uniform
    }

    /*
    updateUniform(uniform, prefix = "spotLights"){
        super.getNewUniform(uniform, prefix)
        uniform[`${prefix}[${this.id}].direction`] = this.direction
        uniform[`${prefix}[${this.id}].cutoff`] = this.cutoff
        
    }
    */
}

export class BasicCameraObject extends BaseObject {
    constructor(args) {
        super(args)
        let _args = {}
        if (args != undefined) {
            _args = args
        }
        this.name = _args.name || "Camera"
        this.fov_angle = _args.fov_angle || 30
        this.aspect = _args.aspect || (4 / 3)
        this.zNear = _args.zNear || 0.5
        this.zFar = _args.zFar || 10
        this.target = this.forward
        this.up = [0, 1, 0]
        //this.ambient = [0, 0, 0, 1]

    }

    get projection() {
        return m4.perspective(
            this.fov,
            this.aspect,
            this.zNear,
            this.zFar
        )
    }

    get fov() {
        return this.fov_angle * Math.PI / 180
    }

    /*
    get forward() {
        var x = this.position[0] + Math.cos(this.rotation[0]) * Math.cos(this.rotation[1])
        var y = this.position[1] + Math.sin(this.rotation[0])
        var z = this.position[2] - Math.cos(this.rotation[0]) * Math.sin(this.rotation[1])

        return v3.create(x, y, z)
    }
    */
}