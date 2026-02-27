#version 330

#moj_import <include/globals.glsl>
#moj_import <include/dynamictransforms.glsl>
#moj_import <include/projection.glsl>

in vec3 Position;
in vec4 Color;
in float LineWidth;

out vec4 vertexColor;

void main() {
    gl_Position = ProjMat * ModelViewMat * vec4(Position, 1.0);

    vertexColor = Color;
    gl_PointSize = LineWidth;
}
