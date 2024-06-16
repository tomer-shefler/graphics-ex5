import { OrbitControls } from './OrbitControls.js';

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);
scene.background = new THREE.Color('ForestGreen');

const crossBarLength = 6;
const angleBetweenPosts = 35;
const cylinderRadius = 0.05;
const ballDistanceFromGoal = calculateFrontPostLength() * 0.8;

const goalMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.DoubleSide });
const netMaterial = new THREE.MeshBasicMaterial({ color: 0xd3d3d3, side: THREE.DoubleSide });
const ballMaterial = new THREE.MeshBasicMaterial({ color: 0, side: THREE.DoubleSide });

let optionOneEnabled = false;
let optionTwoEnabled = false;
let animationSpeed = 2;

function degreesToRadians(degrees) {
	return degrees * (Math.PI / 180);
}

function calculateGoalDepth() {
	return (crossBarLength / 3) * Math.tan(degreesToRadians(angleBetweenPosts));
}

function calculateBackPostLength() {
	return (crossBarLength / 3) / Math.cos(degreesToRadians(angleBetweenPosts));
}

function calculateFrontPostLength() {
	return crossBarLength / 3;
}

function createCylinder(barLength) {
	const geometry = new THREE.CylinderGeometry(cylinderRadius, cylinderRadius, barLength, 32);
	return new THREE.Mesh(geometry, goalMaterial);
}

function createSidePost(isRight, size = null) {
	const post = createCylinder(size || calculateFrontPostLength());
	const direction = isRight ? 1 : -1;
	post.applyMatrix4(new THREE.Matrix4().makeTranslation(direction * (crossBarLength / 2), 0, 0));
	return post;
}

function createBackPost(isRight) {
	const post = createSidePost(isRight, calculateBackPostLength());
	post.applyMatrix4(new THREE.Matrix4().makeRotationX(degreesToRadians(angleBetweenPosts)));
	post.applyMatrix4(new THREE.Matrix4().makeTranslation(0, 0, -calculateGoalDepth() / 2));
	return post;
}

function createCrossBar() {
	const crossBar = createCylinder(crossBarLength);
	crossBar.applyMatrix4(new THREE.Matrix4().makeRotationZ(degreesToRadians(90)));
	crossBar.applyMatrix4(new THREE.Matrix4().makeTranslation(0, calculateFrontPostLength() / 2, 0));
	return crossBar;
}

function createTorus() {
	const geometry = new THREE.TorusGeometry(cylinderRadius, cylinderRadius, 16, 100);
	return new THREE.Mesh(geometry, goalMaterial);
}

function createFrontRing(isRight) {
	const ring = createTorus();
	ring.applyMatrix4(new THREE.Matrix4().makeRotationX(degreesToRadians(90)));
	const direction = isRight ? 1 : -1;
	ring.applyMatrix4(new THREE.Matrix4().makeTranslation(direction * (crossBarLength / 2), 0, 0));
	ring.applyMatrix4(new THREE.Matrix4().makeTranslation(0, -calculateFrontPostLength() / 2, 0));
	return ring;
}

function createBackRing(isRight) {
	const ring = createFrontRing(isRight);
	ring.applyMatrix4(new THREE.Matrix4().makeTranslation(0, 0, -calculateGoalDepth()));
	return ring;
}

function createTriangleMesh(a, b, c) {
	const shape = new THREE.Shape([a, b, c]);
	const geometry = new THREE.ShapeGeometry(shape);
	return new THREE.Mesh(geometry, netMaterial);
}

function createBackNet() {
	const geometry = new THREE.PlaneGeometry(crossBarLength, calculateBackPostLength(), 32);
	const net = new THREE.Mesh(geometry, netMaterial);
	net.applyMatrix4(new THREE.Matrix4().makeRotationX(degreesToRadians(angleBetweenPosts)));
	net.applyMatrix4(new THREE.Matrix4().makeTranslation(0, 0, -calculateGoalDepth() / 2));
	return net;
}

function createSideNet(isRight) {
	const triangle = createTriangleMesh(
		new THREE.Vector2(0, 0),
		new THREE.Vector2(0, calculateFrontPostLength()),
		new THREE.Vector2(calculateGoalDepth(), 0)
	);

	triangle.applyMatrix4(new THREE.Matrix4().makeRotationY(degreesToRadians(90)));
	const direction = isRight ? 1 : -1;
	triangle.applyMatrix4(new THREE.Matrix4().makeTranslation(direction * crossBarLength / 2, -calculateFrontPostLength() / 2, 0));
	return triangle;
}

function createGoal() {
	const goal = new THREE.Group();
	goal.add(createCrossBar());
	goal.add(createSidePost(true));
	goal.add(createSidePost(false));
	goal.add(createBackPost(true));
	goal.add(createBackPost(false));
	goal.add(createFrontRing(true));
	goal.add(createFrontRing(false));
	goal.add(createBackRing(true));
	goal.add(createBackRing(false));
	goal.add(createBackNet());
	goal.add(createSideNet(true));
	goal.add(createSideNet(false));
	return goal;
}

const goal = createGoal();
scene.add(goal);

function createBall() {
	const ballRadius = calculateFrontPostLength() / 16;
	const geometry = new THREE.SphereGeometry(ballRadius, 32, 32);
	const ball = new THREE.Mesh(geometry, ballMaterial);
	ball.applyMatrix4(new THREE.Matrix4().makeTranslation(0, 0, ballDistanceFromGoal));
	return ball;
}

const ball = createBall();
scene.add(ball);

function getSceneChildren(scene) {
	let children = [];
	scene.children.forEach(child => {
		if (child.children.length > 0) {
			children = children.concat(getSceneChildren(child));
		} else {
			children.push(child);
		}
	});
	return children;
}

const cameraTranslate = new THREE.Matrix4();
cameraTranslate.makeTranslation(0, 0, 5);
camera.applyMatrix4(cameraTranslate);

renderer.render(scene, camera);

const controls = new OrbitControls(camera, renderer.domElement);
let isOrbitEnabled = true;

const toggleOrbit = (e) => {
	if (e.key === 'o') {
		isOrbitEnabled = !isOrbitEnabled;
	} else if (e.key === 'w') {
		getSceneChildren(scene).forEach(object => {
			object.material.wireframe = !object.material.wireframe;
		});
	} else if (e.key === '-' || e.key === 'ArrowDown') {
		animationSpeed /= 1.1;
	} else if (e.key === '+' || e.key === 'ArrowUp') {
		animationSpeed *= 1.1;
	} else if (e.key === '1' && isOrbitEnabled) {
		optionOneEnabled = !optionOneEnabled;
	} else if (e.key === '2' && isOrbitEnabled) {
		optionTwoEnabled = !optionTwoEnabled;
	} else if (e.key === '3') {
		goal.scale.multiplyScalar(0.95);
	}
};

function animateOne() {
	if (optionOneEnabled) {
		ball.applyMatrix4(new THREE.Matrix4().makeRotationX(degreesToRadians(animationSpeed)));
	}
}

function animateTwo() {
	if (optionTwoEnabled) {
		ball.applyMatrix4(new THREE.Matrix4().makeRotationY(degreesToRadians(animationSpeed)));
	}
}

function animations() {
	animateOne();
	animateTwo();
}

document.addEventListener('keydown', toggleOrbit);
controls.update();

function animate() {
	requestAnimationFrame(animate);
	controls.enabled = isOrbitEnabled;
	controls.update();
	animations();
	renderer.render(scene, camera);
}

animate();

function createSeatsWithFans(row, numSeats) {
	const rowGroup = new THREE.Group();
	for (let i = 0; i < numSeats; i++) {
		const seat = new THREE.Mesh(
			new THREE.BoxGeometry(0.5, 0.5, 0.5),
			new THREE.MeshBasicMaterial({ color: 0xffffff })
		);
		seat.position.set(i * 0.6 - numSeats * 0.3, row * 0.7, -5);

		const fan = new THREE.Mesh(
			new THREE.SphereGeometry(0.2, 32, 32),
			new THREE.MeshBasicMaterial({ color: 0xffe0bd })
		);
		fan.position.set(i * 0.6 - numSeats * 0.3, row * 0.7 + 0.4, -5);

		rowGroup.add(seat);
		rowGroup.add(fan);
	}
	return rowGroup;
}

function createStadium(numRows, numSeats) {
	const stadium = new THREE.Group();
	for (let i = 0; i < numRows; i++) {
		stadium.add(createSeatsWithFans(i, numSeats));
	}
	return stadium;
}

const stadium = createStadium(10, 70);
stadium.position.set(0, 0, -10);
scene.add(stadium);

function createBody(bodyHeight) {
	const bodyGeometry = new THREE.CylinderGeometry(0.2, 0.2, bodyHeight, 32);
	const bodyMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff });
	return new THREE.Mesh(bodyGeometry, bodyMaterial);
}

function createHead(bodyHeight) {
	const headRadius = bodyHeight * 0.3;
	const headGeometry = new THREE.SphereGeometry(headRadius, 32, 32);
	const headMaterial = new THREE.MeshBasicMaterial({ color: 0xffe0bd });
	const head = new THREE.Mesh(headGeometry, headMaterial);
	head.position.set(0, bodyHeight / 2 + headRadius, 0);
	return head;
}

function createLegs(bodyHeight, legHeight) {
	const legGeometry = new THREE.CylinderGeometry(0.1, 0.1, legHeight, 32);
	const legMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff });

	const leftLeg = new THREE.Mesh(legGeometry, legMaterial);
	leftLeg.position.set(-0.15, -bodyHeight / 2 - legHeight / 2, 0);

	const rightLeg = new THREE.Mesh(legGeometry, legMaterial);
	rightLeg.position.set(0.15, -bodyHeight / 2 - legHeight / 2, 0);

	return [leftLeg, rightLeg];
}

function createArms(bodyHeight, armHeight) {
	const armGeometry = new THREE.CylinderGeometry(0.1, 0.1, armHeight, 32);
	const armMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff });

	const leftArm = new THREE.Mesh(armGeometry, armMaterial);
	leftArm.position.set(-0.35, bodyHeight / 4, 0);
	leftArm.rotation.z = Math.PI / 4;

	const rightArm = new THREE.Mesh(armGeometry, armMaterial);
	rightArm.position.set(0.35, bodyHeight / 4, 0);
	rightArm.rotation.z = -Math.PI / 4;

	return [leftArm, rightArm];
}

function createPlayer() {
	const goalHeight = calculateFrontPostLength();
	const playerHeight = goalHeight * 0.6;

	const bodyHeight = playerHeight * 0.5;
	const legHeight = playerHeight * 0.4;
	const armHeight = bodyHeight * 0.8;

	const playerGroup = new THREE.Group();

	const body = createBody(bodyHeight);
	playerGroup.add(body);

	const head = createHead(bodyHeight);
	playerGroup.add(head);

	const [leftLeg, rightLeg] = createLegs(bodyHeight, legHeight);
	playerGroup.add(leftLeg);
	playerGroup.add(rightLeg);

	const [leftArm, rightArm] = createArms(bodyHeight, armHeight);
	playerGroup.add(leftArm);
	playerGroup.add(rightArm);

	return playerGroup;
}

const player = createPlayer();
player.position.set(2, 0, ballDistanceFromGoal);
scene.add(player);

function createTrophyBase() {
	const baseGeometry = new THREE.CylinderGeometry(0.5, 0.5, 0.2, 32);
	const baseMaterial = new THREE.MeshBasicMaterial({ color: 0x8B4513 }); // Brown color for base
	return new THREE.Mesh(baseGeometry, baseMaterial);
}

function createTrophyCup() {
	const cupGeometry = new THREE.CylinderGeometry(0.3, 0.3, 0.6, 32);
	const cupMaterial = new THREE.MeshBasicMaterial({ color: 0xffd700 });
	const cup = new THREE.Mesh(cupGeometry, cupMaterial);
	cup.position.y = 0.4;
	return cup;
}

function createTrophyHandles() {
	const handleGeometry = new THREE.TorusGeometry(0.15, 0.05, 16, 100);
	const handleMaterial = new THREE.MeshBasicMaterial({ color: 0xffd700 });
	const handle1 = new THREE.Mesh(handleGeometry, handleMaterial);
	handle1.rotation.x = Math.PI / 2;
	handle1.position.set(-0.3, 0.4, 0);
	const handle2 = new THREE.Mesh(handleGeometry, handleMaterial);
	handle2.rotation.x = Math.PI / 2;
	handle2.position.set(0.3, 0.4, 0);

	return [handle1, handle2];
}

function createTrophy() {
	const trophy = new THREE.Group();
	const base = createTrophyBase();
	trophy.add(base);
	const cup = createTrophyCup();
	trophy.add(cup);
	const [handle1, handle2] = createTrophyHandles();
	trophy.add(handle1);
	trophy.add(handle2);

	return trophy;
}

const trophy = createTrophy();
const goalHeight = calculateFrontPostLength();

trophy.position.set(0, (goalHeight / 2) + 0.5, 0);
scene.add(trophy);

renderer.render(scene, camera);
