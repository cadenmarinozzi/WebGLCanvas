function initShaderProgram(webgl, vsSource, fsSource) {
	const vertexShader = loadShader(webgl, webgl.VERTEX_SHADER, vsSource);
	const fragmentShader = loadShader(webgl, webgl.FRAGMENT_SHADER, fsSource);

	const shaderProgram = webgl.createProgram();
	webgl.attachShader(shaderProgram, vertexShader);
	webgl.attachShader(shaderProgram, fragmentShader);
	webgl.linkProgram(shaderProgram);

	if (!webgl.getProgramParameter(shaderProgram, webgl.LINK_STATUS)) {
		console.error(
			`Unable to initialize the shader program: ${webgl.getProgramInfoLog(
				shaderProgram
			)}`
		);

		return;
	}

	return shaderProgram;
}

function loadShader(webgl, type, source) {
	const shader = webgl.createShader(type);
	webgl.shaderSource(shader, source);
	webgl.compileShader(shader);

	if (!webgl.getShaderParameter(shader, webgl.COMPILE_STATUS)) {
		console.error(
			`An error occurred compiling the shaders: ${webgl.getShaderInfoLog(
				shader
			)}`
		);
		webgl.deleteShader(shader);

		return;
	}

	return shader;
}

function initPositionBuffer(webgl) {
	const positionBuffer = webgl.createBuffer();
	webgl.bindBuffer(webgl.ARRAY_BUFFER, positionBuffer);

	const fovRadians = (45 * Math.PI) / 180;
	const aspect = webgl.canvas.clientWidth / webgl.canvas.clientHeight;
	const yFov = Math.tan(fovRadians / 2) * 2;
	const positions = [
		2 * yFov * aspect,
		2 * yFov,
		2 * -yFov * aspect,
		2 * yFov,
		2 * yFov * aspect,
		2 * -yFov,
		2 * -yFov * aspect,
		2 * -yFov,
	];
	webgl.bufferData(
		webgl.ARRAY_BUFFER,
		new Float32Array(positions),
		webgl.STATIC_DRAW
	);

	return positionBuffer;
}

function setPositionAttribute(webgl, buffers, programInfo) {
	const numComponents = 2;
	const type = webgl.FLOAT;
	const normalize = false;
	const stride = 0;
	const offset = 0;

	webgl.bindBuffer(webgl.ARRAY_BUFFER, buffers.position);
	webgl.vertexAttribPointer(
		programInfo.attribLocations.vertexPosition,
		numComponents,
		type,
		normalize,
		stride,
		offset
	);
	webgl.enableVertexAttribArray(programInfo.attribLocations.vertexPosition);
}

class WebGLCanvas {
	constructor(canvas, vertexShaderSource, fragmentShaderSource) {
		this.initCanvas(canvas);
		this.initWebGL();
		this.initShaderProgram(vertexShaderSource, fragmentShaderSource);

		this.programInfo = {
			program: this.shaderProgram,
			attribLocations: {
				vertexPosition: this.webgl.getAttribLocation(
					this.shaderProgram,
					'aVertexPosition'
				),
			},
			uniformLocations: {
				projectionMatrix: this.webgl.getUniformLocation(
					this.shaderProgram,
					'uProjectionMatrix'
				),
				modelViewMatrix: this.webgl.getUniformLocation(
					this.shaderProgram,
					'uModelViewMatrix'
				),
			},
		};

		this.initBuffers(this.webgl);
		this.drawScene();
	}

	initShaderProgram(vertexShaderSource, fragmentShaderSource) {
		this.shaderProgram = initShaderProgram(
			this.webgl,
			vertexShaderSource,
			fragmentShaderSource
		);
	}

	initCanvas(canvas) {
		if (!canvas) {
			console.warn(
				'A canvas element was not specified. Creating a new canvas element.'
			);

			canvas = document.createElement('canvas');
			document.body.appendChild(canvas);
		}

		this.canvas = canvas;
	}

	initWebGL() {
		this.webgl = this.canvas.getContext('webgl');

		if (!this.webgl) {
			console.error('WebGL is not supported by your browser.');
		}
	}

	initBuffers() {
		const positionBuffer = initPositionBuffer(this.webgl);

		this.buffers = {
			position: positionBuffer,
		};
	}

	drawScene() {
		this.webgl.clearColor(0.0, 0.0, 0.0, 1.0);
		this.webgl.clearDepth(1.0);
		this.webgl.enable(this.webgl.DEPTH_TEST);
		this.webgl.depthFunc(this.webgl.LEQUAL);

		this.webgl.clear(
			this.webgl.COLOR_BUFFER_BIT | this.webgl.DEPTH_BUFFER_BIT
		);

		const fieldOfView = (45 * Math.PI) / 180;
		const aspect =
			this.webgl.canvas.clientWidth / this.webgl.canvas.clientHeight;
		const zNear = 0.1;
		const zFar = 100.0;
		const projectionMatrix = glMatrix.mat4.create();

		glMatrix.mat4.perspective(
			projectionMatrix,
			fieldOfView,
			aspect,
			zNear,
			zFar
		);

		const modelViewMatrix = glMatrix.mat4.create();

		glMatrix.mat4.translate(
			modelViewMatrix,
			modelViewMatrix,
			[0.0, 0.0, -4.0]
		);

		setPositionAttribute(this.webgl, this.buffers, this.programInfo);

		this.webgl.useProgram(this.programInfo.program);

		this.webgl.uniformMatrix4fv(
			this.programInfo.uniformLocations.projectionMatrix,
			false,
			projectionMatrix
		);
		this.webgl.uniformMatrix4fv(
			this.programInfo.uniformLocations.modelViewMatrix,
			false,
			modelViewMatrix
		);

		{
			const offset = 0;
			const vertexCount = 4;
			this.webgl.drawArrays(
				this.webgl.TRIANGLE_STRIP,
				offset,
				vertexCount
			);
		}
	}
}
