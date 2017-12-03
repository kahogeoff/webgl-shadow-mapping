//const THREE = require("three.js")
import * as THREE from "three"
window.THREE = require("three")
require("../lib/GLTFLoader")

let lightVertex = require("./shader/light.vert")
let lightFragment = require("./shader/light.frag")

let scene = {}
let camera = {}
let renderer = {}
let glTF_loader = {}

function init() {
    scene = new THREE.Scene()
    camera = new THREE.PerspectiveCamera(75, 800 / 600, 0.1, 1000)
    renderer = new THREE.WebGLRenderer()
    glTF_loader = new THREE.GLTFLoader()
    if (scene === {} || renderer === {}) {
        console.log("ERROR!")
        return
    }

    renderer.setSize(800, 600)
    document.body.appendChild(renderer.domElement)

}

function start() {

    var ambient = new THREE.AmbientLight(0x222222)
    scene.add(ambient)

    var directionalLight = new THREE.DirectionalLight(0xdddddd)
    directionalLight.position.set(0, 0, 1).normalize()
    console.log(lightVertex)
    scene.add(directionalLight)

    glTF_loader.load(
        "assets/Box/Box.gltf",
        (gltf) => {
            gltf.scene.children[0].children[0].name = "Box"
            gltf.scene.children[0].children[0].material = new THREE.ShaderMaterial({
                defaultAttributeValues:{
                    "vColor": [0.9, 0, 0, 1]
                },
                vertexShader: lightVertex,
                fragmentShader: lightFragment
            })
            scene.add(gltf.scene.children[0].children[0])
        },
        (xhr) => {
            console.log((xhr.loaded / xhr.total * 100) + "% loaded")
        },
        (err) => {
            console.log("ERROR!: " + err)
        }
    )

    camera.position.z = 5
}

function update() {
    requestAnimationFrame(update)

    var cube = scene.getObjectByName("Box")
    cube.rotation.x += 0.01
    cube.rotation.y += 0.01

    renderer.render(scene, camera)
}

init()
start()
update()