#version 300 es

#define texelSize 1.0 / 1024.0

precision mediump float;

in vec2 v_texcoord;

uniform int NUMBER_SAMPLES;
uniform int SAMPLES_TEX_SIZE;

uniform sampler2D g_normal_texture;
uniform sampler2D g_worldPos_texture;

uniform sampler2D depth_texture;
uniform sampler2D normal_texture;
uniform sampler2D flux_texture;
uniform sampler2D worldPos_texture;
uniform sampler2D samples_texture;

uniform mat4 light_P;
uniform mat4 light_V;

out vec4 outColor;

vec3 getIndirectLighting(){
	vec3 P = texture(g_worldPos_texture, v_texcoord).xyz;
	vec3 N = texture(g_normal_texture, v_texcoord).xyz;
	vec4 texPos = light_P * light_V * vec4(P, 1.0);
	vec3 indirect_factor = vec3(0.0, 0.0, 0.0);
	texPos.xyz = texPos.xyz * 0.5 + 0.5;

	float sampleRadius = 300.0;

	for(int i = 0; i < NUMBER_SAMPLES; i++){
		vec3 s = texture(samples_texture, vec2( float(i) / float(SAMPLES_TEX_SIZE), 0.0 )).xyz;
		vec2 offset = s.xy;
		float weight = s.z;

		vec2 coords = texPos.xy + offset * sampleRadius * texelSize;

		vec3 vplPos = texture(worldPos_texture, coords).xyz;
		vec3 vplNormal = texture(normal_texture, coords).xyz;
		vec3 vplFlux = texture(flux_texture, coords).xyz;

		vec3 result = vplFlux * (
			max(0.0, dot( vplNormal, normalize(P - vplPos)))
			* max(0.0, dot( N, normalize(vplPos - P)))
		);

		result *= weight * weight;
      	result *= (1.0 / float(NUMBER_SAMPLES));
		indirect_factor += result;
	}
	return clamp(indirect_factor * 3.0, 0.0, 1.0);
}

void main(){
    outColor = vec4(getIndirectLighting() , 1.0);
}