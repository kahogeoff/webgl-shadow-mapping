#version 300 es

precision mediump float;

in vec4 v_position;
in vec3 v_normal;
in vec2 v_texcoord;
//out vec3 tangent;
//out vec3 bitangent;
in vec4 v_shadowcoord;

in vec3 v_lightToEye_cam_dir;
in vec3 v_eye_cam_dir;

//out vec3 light_tan_dir;
//out vec3 eye_tan_dir;

in float v_light_dist;
in vec3 v_lightToVertex_dir;


uniform sampler2D texture_0;
uniform sampler2D depth_texture;
//uniform samplerCube depth_cube_texture;
//uniform sampler2D normal_map;

uniform bool bump_mode;

uniform vec4 light_color;
uniform float light_power;

uniform vec4 diffuse_color;
uniform vec4 ambient_color;
uniform vec4 specular_color;
uniform float shininess;

out vec4 outColor;

const vec2 poissonDisk[16] = vec2[](
   	vec2( -0.94201624, -0.39906216 ), 
   	vec2( 0.94558609, -0.76890725 ), 
   	vec2( -0.094184101, -0.92938870 ), 
   	vec2( 0.34495938, 0.29387760 ), 
   	vec2( -0.91588581, 0.45771432 ), 
   	vec2( -0.81544232, -0.87912464 ), 
   	vec2( -0.38277543, 0.27676845 ), 
   	vec2( 0.97484398, 0.75648379 ), 
   	vec2( 0.44323325, -0.97511554 ), 
	vec2( 0.53742981, -0.47373420 ), 
	vec2( -0.26496911, -0.41893023 ), 
	vec2( 0.79197514, 0.19090188 ), 
	vec2( -0.24188840, 0.99706507 ), 
	vec2( -0.81409955, 0.91437590 ), 
	vec2( 0.19984126, 0.78641367 ), 
	vec2( 0.14383161, -0.14100790 ) 
);

float random(vec3 co, int index){
	vec4 seed4 = vec4(co,index);
	float dot_product = dot(seed4, vec4(12.9898,78.233,45.164,94.673));
	return fract(sin(dot_product) * 43758.5453);
}

void main()
{
	vec3 n = normalize(v_normal);
	//vec3 tan_n = normalize(texture2D(normal_map, texcoord).rgb*2.0 - 1.0);
	
	vec3 l = normalize(v_lightToEye_cam_dir);
	//vec3 tan_l = normalize(light_tan_dir);

	float lambertian = max(dot(l,n), 0.0);
	//float tan_lambertian = max(dot(tan_l, tan_n), 0.0);

	float specular = 0.0;
	//float tan_specular = 0.0;

	if(lambertian > 0.0 ) {
		vec3 r = reflect(-l, n);
		vec3 v = normalize(v_eye_cam_dir);

		float specular_angle = max(dot(r, v), 0.0);

		specular = pow(specular_angle, shininess);
	}
	/*
	if(tan_lambertian > 0.0 ) {
		vec3 tan_r = reflect(-tan_l, tan_n);
		vec3 tan_v = normalize(eye_tan_dir);

		float tan_specular_angle = max(dot(tan_r, tan_v), 0.0);

		tan_specular = pow(tan_specular_angle, shininess);
	}
	*/

	vec4 texColor = texture(texture_0, v_texcoord);

	/*
	if(!bump_mode)
	{
		outColor = 
			ambient_color * diffuse_color *  texColor
			+ diffuse_color * texColor * lambertian / (light_dist * light_dist)
			+ specular_color * specular / (light_dist * light_dist);
	
	}else{
		outColor = 
			ambient_color * diffuse_color *  texColor
			+ diffuse_color * texColor * tan_lambertian / (light_dist * light_dist)
			+ specular_color * tan_specular / (light_dist * light_dist);
	}
	*/
	//outColor.xyz = light_tan_dir;
	
	//float visibility = texture( depth_texture, v_shadowcoord.xy ).r;
	float bias = 0.005 * tan(acos(lambertian));
	bias = clamp(bias, 0.0, 0.01);

	float visibility = 1.0;
	for (int i=0;i<4;i++){
		//int index = int(16.0 * random(gl_FragCoord.xyy, i)) % 16;
		if ( texture( depth_texture, (v_shadowcoord.xy + poissonDisk[i]/700.0)/v_shadowcoord.w ).r < (v_shadowcoord.z-bias)/v_shadowcoord.w ){
			visibility-=0.2;
		}
	}
	//visibility = clamp(visibility, 0.0, 1.0);
	//float shadow_place = texture( depth_texture, v_shadowcoord.xy ).r - v_shadowcoord.z;
	

	outColor =
		ambient_color * diffuse_color *  texColor +
		light_color * light_power * visibility * (
			+ diffuse_color * texColor * lambertian
			+ specular_color * specular
		) / (v_light_dist * v_light_dist);
}