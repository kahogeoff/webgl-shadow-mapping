import * as twgl from "twgl.js"
import * as MinimalGLTFLoader from "minimal-gltf-loader"
import {
    vec3,
    quat,
    glMatrix
} from "gl-matrix"
//import { vec3 } from "gl-matrix"
const m4 = twgl.m4
const v3 = twgl.v3

const glTFLoader = new MinimalGLTFLoader.glTFLoader()

class BaseObject {
    constructor() {
        this.name = "no_name"
        this.position = v3.create()
        this.rotation = v3.create()
    }

    get transformMatrix() {
        var mat = m4.identity()

        m4.multiply(mat, m4.translation(this.position), mat)
        m4.multiply(mat, m4.rotationZ(this.rotation[2]), mat)
        m4.multiply(mat, m4.rotationY(this.rotation[1]), mat)
        m4.multiply(mat, m4.rotationX(this.rotation[0]), mat)

        return mat
    }
    /*
    get forward() {
        // TODO
        var forward = m4.identity()

        m4.multiply(forward, m4.translation(this.position), forward)
        m4.multiply(forward, m4.rotationZ(this.rotation[2]), forward)
        m4.multiply(forward, m4.rotationY(this.rotation[1]), forward)
        m4.multiply(forward, m4.rotationX(this.rotation[0]), forward)

        forward = m4.transformDirection(forward, [0,1,0])
        return forward
    }

    lookAt(target) {
        var rot1 = quat.create()
        var rot2 = quat.create()
        var dir = vec3.create()
        var new_up = vec3.create()
        var origin_ori = quat.create()
        var tar_ori = quat.create()
        var slerp_ori = quat.create()

        quat.fromEuler(
            origin_ori,
            this.rotation[0] * 180 /  Math.PI,
            this.rotation[1] * 180 /  Math.PI,
            this.rotation[2] * 180 /  Math.PI
        )

        vec3.subtract(dir, target, this.position)
        vec3.normalize(dir, dir)

        quat.rotationTo(rot1, [0, 0, 1], dir)
        vec3.multiply(new_up, rot1, [0, 1, 0])

        quat.rotationTo(rot2, new_up, [0, 1, 0])
        quat.multiply(tar_ori, rot2, rot1)

        quat.slerp(slerp_ori, origin_ori, tar_ori, 1)
        
        this.rotation[0] = quat.getAxisAngle([1, 0, 0], slerp_ori)
        this.rotation[1] = quat.getAxisAngle([0, 1, 0], slerp_ori)
        this.rotation[2] = quat.getAxisAngle([0, 0, 1], slerp_ori)
    }

    */
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

export class PointLightObject extends BaseObject {
    constructor() {
        super()
        this.name = "PointLight"
        this.color = [1, 1, 1, 1]
        this.power = 50.0
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
}