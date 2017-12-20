#version 300 es
#define MAX_POINT_LIGHTS 16

precision mediump float;

in vec4 v_position;
in vec3 v_normal;
in vec2 v_texcoord;
in vec4 v_shadowcoord;

in vec3 v_lightToEye_cam_dir;
in vec3 v_eye_cam_dir;
in vec3 v_worldPos;

in float v_light_dist;
in vec3 v_lightToVertex_dir;

uniform sampler2D texture_0;
uniform sampler2D depth_texture;
//uniform samplerCube depth_cube_texture;

uniform bool bump_mode;

uniform vec3 cam_pos;
uniform vec4 light_color;
uniform float light_power;

uniform vec4 diffuse_color;
uniform vec4 ambient_color;
uniform vec4 specular_color;
uniform float shininess;

uniform int pointLights_num;
uniform vec4 pointLights_color[MAX_POINT_LIGHTS];
uniform vec3 pointLights_position[MAX_POINT_LIGHTS];
uniform float pointLights_power[MAX_POINT_LIGHTS];
uniform float pointLights_constant[MAX_POINT_LIGHTS];
uniform float pointLights_linear[MAX_POINT_LIGHTS];
uniform float pointLights_exp[MAX_POINT_LIGHTS];

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

void main()
{
	vec3 n = normalize(v_normal);
	vec3 l = normalize(v_lightToEye_cam_dir);

	float lambertian = max(dot(l,n), 0.0);

	float specular = 0.0;
	if(lambertian > 0.0 ) {
		vec3 r = reflect(-l, n);
		vec3 v = normalize(v_eye_cam_dir);

		float specular_angle = max(dot(r, v), 0.0);

		specular = pow(specular_angle, shininess);
	}

	float visibility = 1.0;
	/* Shadow mapping */
	float bias = 0.005 * tan(acos(lambertian));
	bias = clamp(bias, 0.0, 0.01);
	for (int i=0;i<4;i++){
		//int index = int(16.0 * random(gl_FragCoord.xyy, i)) % 16;
		if ( texture( depth_texture, (v_shadowcoord.xy + poissonDisk[i]/700.0)/v_shadowcoord.w ).r < (v_shadowcoord.z-bias)/v_shadowcoord.w ){
			visibility-=0.2;
		}
	}

	vec4 texColor = texture(texture_0, v_texcoord);
	outColor =
		ambient_color * diffuse_color *  texColor +
		light_color * light_power * visibility * (
			+ diffuse_color * texColor * lambertian
			+ specular_color * specular
		) / (v_light_dist * v_light_dist);
}