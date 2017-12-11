#version 300 es

precision mediump float;

//in float distanceToLight;
layout(location = 0) out float fragmentdepth;

void main(){
    fragmentdepth = gl_FragCoord.z;
    //fragmentdepth = distanceToLight;//gl_FragCoord.z;
}