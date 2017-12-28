#version 300 es

in vec2 position;

out vec2 v_texcoord;

void main(){
    v_texcoord = 0.5 * (position + 1.0);
    gl_Position = vec4(position, 0.0, 1.0);
}