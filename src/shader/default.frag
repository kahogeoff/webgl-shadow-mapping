#version 300 es
#define MAX_POINT_LIGHTS 16
#define MAX_SPOT_LIGHTS 16
#define NUMBER_SAMPLES 32
#define SAMPLES_TEX_SIZE 128
#define texelSize 1.0 / 1024.0

precision mediump float;

in vec4 v_position;
in vec3 v_normal;
in vec2 v_texcoord;
in vec4 v_shadowcoord;

//in vec3 v_lightToEye_cam_dir;
//in vec3 v_eye_cam_dir;
in vec3 v_worldPos;
in vec3 v_worldCamPos;

in float v_light_dist;
in mat4 v_V;
in mat4 v_M;

uniform sampler2D texture_0;
uniform sampler2D depth_texture;
uniform sampler2D normal_texture;
uniform sampler2D flux_texture;
uniform sampler2D worldPos_texture;
uniform sampler2D samples_texture;
//uniform samplerCube depth_cube_texture;

//uniform vec3 cam_pos;
struct DirectionalLight {
	vec3 dir;
	vec4 color;
	float power;	
};
uniform DirectionalLight dirLight;

uniform vec4 diffuse_color;
uniform vec4 ambient_color;
uniform vec4 specular_color;
uniform float shininess;

/*
struct PointLight{
	vec3 position;
	vec4 color;
	float power;
	float constant;
	float linear;
	float exp_factor;
};
uniform PointLight pointLights[MAX_POINT_LIGHTS];
*/
uniform int pointLights_num;
uniform vec4 pointLights_color[MAX_POINT_LIGHTS];
uniform vec3 pointLights_position[MAX_POINT_LIGHTS];
uniform float pointLights_power[MAX_POINT_LIGHTS];
uniform float pointLights_constant[MAX_POINT_LIGHTS];
uniform float pointLights_linear[MAX_POINT_LIGHTS];
uniform float pointLights_exp[MAX_POINT_LIGHTS];

/*
struct SpotLight{
	vec3 position;
	vec3 direction;
	vec4 color;
	float power;
	float cutoff;
	float constant;
	float linear;
	float exp_factor;
};
uniform SpotLight sointLights[MAX_SPOT_LIGHTS];
*/
uniform int spotLights_num;
uniform vec4 spotLights_color[MAX_SPOT_LIGHTS];
uniform vec3 spotLights_position[MAX_SPOT_LIGHTS];
uniform vec3 spotLights_direction[MAX_SPOT_LIGHTS];
uniform float spotLights_power[MAX_SPOT_LIGHTS];
uniform float spotLights_cutoff[MAX_SPOT_LIGHTS];
uniform float spotLights_constant[MAX_SPOT_LIGHTS];
uniform float spotLights_linear[MAX_SPOT_LIGHTS];
uniform float spotLights_exp[MAX_SPOT_LIGHTS];

uniform mat4 light_P;
uniform mat4 light_V;

out vec4 outColor;

const vec2 poissonDisk[4] = vec2[](
   	vec2( -0.94201624, -0.39906216 ), 
   	vec2( 0.94558609, -0.76890725 ), 
   	vec2( -0.094184101, -0.92938870 ), 
   	vec2( 0.34495938, 0.29387760 )
);

/*
float random(vec3 co, int index){
	vec4 seed4 = vec4(co,index);
	float dot_product = dot(seed4, vec4(12.9898,78.233,45.164,94.673));
	return fract(sin(dot_product) * 43758.5453);
}
*/

vec4 CalcLightInternal(vec4 l_color, float l_power, vec3 l_direction, vec3 normal, float visibility)
{
	vec4 ambient = ambient_color * diffuse_color;
	float diffuse_factor = clamp(dot(normal, -l_direction), 0.0, 1.0);

	vec4 diffuse = vec4(0.0, 0.0, 0.0, 0.0);
    vec4 specular = vec4(0.0, 0.0, 0.0, 0.0);

	if(diffuse_factor > 0.0){
		diffuse = l_color * l_power * diffuse_color * diffuse_factor;
		vec3 vertexToEye = normalize(v_worldCamPos - v_worldPos);
		vec3 l_reflect = normalize(reflect(l_direction, normal));
		float specular_factor = dot(vertexToEye, l_reflect);
		if(specular_factor > 0.0){
			specular_factor = pow(specular_factor, shininess);
			specular = l_color * l_power * specular_color * specular_factor;
		} 
	}

	return (ambient + visibility*(diffuse + specular));
}

vec4 CalcDirectionalLight(vec3 normal)
{
	vec3 n = normalize(normal);
	vec3 l = normalize((v_V * vec4(dirLight.dir, 0.0)).xyz);

	float diffuse_factor = clamp(dot(n, -l), 0.0, 1.0);
	float visibility = 1.0;
	
	/* Shadow mapping */
	float bias = 0.001 * tan(acos(diffuse_factor));
	bias = clamp(bias, 0.0, 0.005);
	for (int i=0;i<4;i++){
		//int index = int(16.0 * random(gl_FragCoord.xyy, i)) % 16;
		if ( texture( depth_texture, (v_shadowcoord.xy + poissonDisk[i]/700.0)/v_shadowcoord.w ).r < (v_shadowcoord.z-bias)/v_shadowcoord.w ){
			visibility-=0.15;
		}
	}

    return CalcLightInternal(dirLight.color, dirLight.power, l, n, visibility);
} 
vec4 CalcPointLight(int index, vec3 normal)
{
	//vec3 l_viewPosition = (v_V * vec4(pointLights_position[index], 1.0)).xyz;
	//vec3 viewPosition = (v_V * vec4(v_worldPos, 1.0)).xyz;
	//vec3 l_direction = viewPosition - l_viewPosition;
	vec3 l_direction = v_worldPos - pointLights_position[index];
	float l_distance = distance(v_worldPos, pointLights_position[index]);
	l_direction = (v_V * vec4(l_direction, 0.0)).xyz;
	vec3 l = normalize(l_direction);
	vec3 n = normalize(normal);

	vec4 l_color = CalcLightInternal(
		pointLights_color[index],
		pointLights_power[index],
		l,
		n, 1.0
	);

	float attenuation = 
		pointLights_constant[index] +
		pointLights_linear[index] * l_distance +
		pointLights_exp[index] * l_distance * l_distance;

	return l_color / attenuation;
}

vec4 CalcSpotLight(int index, vec3 normal)
{
	vec3 l_to_pixel = v_worldPos - spotLights_position[index];
	//l_to_pixel = (v_V * vec4(l_to_pixel, 0.0)).xyz;

	l_to_pixel = normalize(l_to_pixel);

	float spotFactor = dot(l_to_pixel, spotLights_direction[index]);
	vec4 outcolor = vec4(0.0, 0.0, 0.0, 0.0);
	if(spotFactor > spotLights_cutoff[index]){
		vec3 l_direction = v_worldPos - spotLights_position[index];
		float l_distance = length(l_direction);
		l_direction = (v_V * vec4(l_direction, 0.0)).xyz;
		vec3 l = normalize(l_direction);
		vec3 n = normalize(normal);

		vec4 l_color = CalcLightInternal(
			spotLights_color[index],
			spotLights_power[index],
			l,
			n, 1.0
		);

		float attenuation = 
			spotLights_constant[index] +
			spotLights_linear[index] * l_distance +
			spotLights_exp[index] * l_distance * l_distance;

		outcolor = l_color / attenuation;
		return outcolor * (1.0 - (1.0 - spotFactor) * 1.0/(1.0 - spotLights_cutoff[index]));
		//return l_color / attenuation;
	}else{
		return outcolor;
	}
}

vec3 getIndirectLighting(){
	vec3 P = texture(worldPos_texture, v_texcoord).xyz;
	vec3 N = texture(normal_texture, v_texcoord).xyz;
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

void main()
{
	vec4 totalColor = CalcDirectionalLight(v_normal);
	vec4 texColor = texture(texture_0, v_texcoord);

	for (int i = 0; i < pointLights_num; i++){
		totalColor += CalcPointLight(i, v_normal);
	}

	for (int i = 0; i < spotLights_num; i++){
		totalColor += CalcSpotLight(i, v_normal);
	}

	outColor = texColor * totalColor ;
	
}