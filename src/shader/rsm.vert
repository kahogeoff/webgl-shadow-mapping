#version 300 es

in vec4 position;
in vec3 normal;

uniform mat4 light_P;
uniform mat4 light_V;
uniform mat4 M;
uniform mat4 N;

out vec3 v_position;
out vec3 v_normal;
out vec3 v_worldPosition;

void main(){
    vec4 worldSpacePos = M * position;
    vec4 p = light_P * light_V * worldSpacePos;
    v_normal = normalize((N * vec4(normal, 0.0)).xyz);

    v_position = p.xyz / p.w;
    v_worldPosition = worldSpacePos.xyz;
    gl_Position = p;
}