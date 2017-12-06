#version 300 es

precision mediump float;

layout(location = 0) out vec4 fragmentdepth;

void main(){
    fragmentdepth = vec4(gl_FragCoord.z,gl_FragCoord.z,gl_FragCoord.z,1.0);
}