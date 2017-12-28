#version 300 es

precision mediump float;

in vec2 v_texcoord;

uniform sampler2D color_texture;

out vec4 outColor;

void main(){
    outColor = texture(color_texture, v_texcoord);
}