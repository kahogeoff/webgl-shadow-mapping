#version 300 es

precision mediump float;

in vec3 v_position;
in vec3 v_normal;
in vec3 v_worldPosition;

uniform vec4 color;
uniform bool do_reflection;

layout(location = 0) out vec4 depthTex;
layout(location = 1) out vec4 normalTex;
layout(location = 2) out vec4 fluxTex;
layout(location = 3) out vec4 worldPosTex;

void main(){
    depthTex = vec4(vec3(gl_FragCoord.z), 1.0);
    if(do_reflection == true)
    {
        normalTex = vec4(vec3(v_normal.xyz), 1.0);
        fluxTex = vec4(vec3(color.xyz), 1.0);
    }
    //worldPosTex = vec4(vec3(v_worldPosition.xyz), 1.0);
    worldPosTex = vec4(normalize(vec3(v_worldPosition.xyz)), 1.0);
}