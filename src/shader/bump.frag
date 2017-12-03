#version 300 es

precision mediump float;

in vec4 v_worldPosition;
in vec4 v_position;
in vec3 v_normal;

in vec3 v_camDir;
in vec3 v_lightDir;

in vec2 v_texCoord;

in float v_distance;

uniform sampler2D u_diffuse; //Aka diffuse texture
uniform vec4 u_lightColor;

out vec4 color;

void main() {
    vec3 n = normalize(v_normal);
    vec3 l = normalize(v_lightDir);
    float theta = clamp( dot( n,l ), 0.0, 1.0 );

    vec4 diffuse =  vec4(1, 1, 1, 1) * u_lightColor * theta / (v_distance * v_distance); //texture(u_diffuse, v_texCoord) 

    vec4 ambient = vec4(0.1, 0.1, 0.1, 1) * vec4(1, 1, 1, 1);

    color = ambient * diffuse;//vec4(0.2, 0.2, 0.2, 1);
}