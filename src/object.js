import * as twgl from "twgl.js"
import * as MinimalGLTFLoader from "minimal-gltf-loader"
//import { vec3 } from "gl-matrix"
const m4 = twgl.m4
const v3 = twgl.v3

const glTFLoader = new MinimalGLTFLoader.glTFLoader()

class BaseObject {
    constructor() {
        this.name = "no_name"
        this.scale = v3.create(1, 1, 1)
        this.position = v3.create()
        this.rotation = v3.create()
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

    translate(value/*: number[3]*/){
        v3.add(this.position, value, this.position)
    }

    rotate(value/*: number[3]*/){
        v3.add(this.rotation, value, this.rotation)
    }
}

export class ModelObject extends BaseObject {
    constructor() {
        super()
        //this.uniform = {}
        this.model_data = {
            position: [],
            normal: [],
            texcoord: [],
            indices: [],
        }
        this.textures = []
        this.material = {
            diffuse: [1, 1, 1, 1],
            ambient: [0.1, 0.1, 0.1, 1],
            specular: [1, 1, 1, 1],
            shininess: 8,
        }
        this.bufferInfo = undefined
        this.childern/*: ModelObject[]*/ = []
        this.cast_shadow = true
        this.recive_shadow = true
        //this.shaderProgramInfo = {}
        /*
        glTFLoader.loadGLTF( file_path, ( glTF ) =>
            this.setUpGLTF( glTF )
        )
        */
    }
    /*
    setUpGLTF( glTF ){
        var i = 0
        var current_scene = glTF.scenes[glTF.defaultScene]
        var tmp_v3_translate = v3.create()

        var mesh
        
    }
    */
}

export class BasicLightObject extends BaseObject {
    constructor() {
        super()
        this.name = "BasicLight"
        this.color = [1, 1, 1, 1]
        this.power = 50.0
        //this.ambient = [0, 0, 0, 1]

    }
}

export class DirectionalLightObject extends BasicLightObject {
    constructor() {
        super()
        this.name = "DirectionalLight"
        //this.direction = [0, -1, 0]
        //this.ambient = [0, 0, 0, 1]

    }

    get direction() {
        var x = Math.cos(this.rotation[0]) * Math.cos(this.rotation[1])
        var y = Math.sin(this.rotation[0])
        var z = - Math.cos(this.rotation[0]) * Math.sin(this.rotation[1])

        return v3.create(x, y, z)
    }
}

export class PointLightObject extends BasicLightObject {
    constructor() {
        super()
        this.name = "PointLight"
        this.constant = 1.0
        this.linear = 1.0
        this.exp = 1.0
        //this.ambient = [0, 0, 0, 1]

    }
}

export class CameraObject extends BaseObject {
    constructor() {
        super()

        this.name = "Camera"
        this.fov_angle = 30
        this.aspect = 4 / 3
        this.zNear = 0.5
        this.zFar = 10
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

    get forward() {
        var x = this.position[0] + Math.cos(this.rotation[0]) * Math.cos(this.rotation[1])
        var y = this.position[1] + Math.sin(this.rotation[0])
        var z = this.position[2] - Math.cos(this.rotation[0]) * Math.sin(this.rotation[1])

        return v3.create(x, y, z)
    }
}