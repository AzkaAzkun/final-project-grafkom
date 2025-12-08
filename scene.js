import * as THREE from "three";
import { PointerLockControls } from "three/addons/controls/PointerLockControls.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";

export class LabScene {
  constructor() {
    this.camera = null;
    this.scene = null;
    this.renderer = null;
    this.controls = null;
    this.moveForward = false;
    this.moveBackward = false;
    this.moveLeft = false;
    this.moveRight = false;
    this.prevTime = performance.now();
    this.velocity = new THREE.Vector3();
    this.direction = new THREE.Vector3();
  }

  init() {
    this.setupRenderer();
    this.setupScene();
    this.setupCamera();
    this.setupLights();
    this.buildRoom();
    this.setupControls();
    this.loadModels();

    window.addEventListener("resize", () => this.onWindowResize());
  }

  setupRenderer() {
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 0.3;
    document.body.appendChild(this.renderer.domElement);
  }

  setupScene() {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0xcccccc);
    this.scene.fog = new THREE.Fog(0xcccccc, 10, 60);

    const pmremGenerator = new THREE.PMREMGenerator(this.renderer);
    const roomEnv = new RoomEnvironment();
    this.scene.environment = pmremGenerator.fromScene(roomEnv, 0.04).texture;
    this.scene.environmentIntensity = 0.5;
  }

  setupCamera() {
    this.camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    this.camera.position.set(0, 1.6, 10);
  }

  setupLights() {
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.2);
    this.scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 0.5);
    dirLight.position.set(10, 20, 10);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 2048;
    dirLight.shadow.mapSize.height = 2048;
    this.scene.add(dirLight);
  }

  buildRoom() {
    const floorW = 19.5;
    const floorH = 32;
    const wallHeight = 8;

    const wallMat = new THREE.MeshStandardMaterial({
      color: 0xe0e0e0,
      side: THREE.DoubleSide,
    });

    const floorMat = new THREE.MeshStandardMaterial({
      color: 0xd6d2c4,
      roughness: 0.3,
      metalness: 0.0,
    });

    // Lantai UTAMA
    const floor = new THREE.Mesh(
      new THREE.PlaneGeometry(floorW, floorH),
      floorMat
    );
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    this.scene.add(floor);

    const gridHelper = new THREE.GridHelper(
      Math.max(floorW, floorH),
      50,
      0x888888,
      0x888888
    );
    gridHelper.position.y = 0.01;
    this.scene.add(gridHelper);

    // === RUANGAN BELAKANG ===
    this.buildBackRoom(floorW, floorH, wallHeight, floorMat, wallMat);

    // Dinding depan
    const frontWall = new THREE.Mesh(
      new THREE.PlaneGeometry(floorW, wallHeight),
      wallMat
    );
    frontWall.position.set(0, wallHeight / 2, -floorH / 2);
    frontWall.receiveShadow = true;
    this.scene.add(frontWall);
  }

  buildBackRoom(floorW, floorH, wallHeight, floorMat, wallMat) {
    const backRoomDepth = 6;
    const backRoomWidth = floorW;
    const doorWidth = 1.5;
    const sekatWidth = 0.2;

    // Lantai ruangan belakang
    const backRoomFloor = new THREE.Mesh(
      new THREE.PlaneGeometry(backRoomWidth, backRoomDepth),
      floorMat
    );
    backRoomFloor.rotation.x = -Math.PI / 2;
    backRoomFloor.position.set(0, 0, floorH / 2 + backRoomDepth / 2);
    backRoomFloor.receiveShadow = true;
    this.scene.add(backRoomFloor);

    // Grid untuk ruangan belakang
    const backRoomGrid = new THREE.GridHelper(
      Math.max(backRoomWidth, backRoomDepth),
      50,
      0x888888,
      0x888888
    );
    backRoomGrid.position.set(0, 0.01, floorH / 2 + backRoomDepth / 2);
    this.scene.add(backRoomGrid);

    // Dinding paling belakang
    const backRoomBackWall = new THREE.Mesh(
      new THREE.PlaneGeometry(backRoomWidth, wallHeight),
      wallMat
    );
    backRoomBackWall.position.set(
      0,
      wallHeight / 2,
      floorH / 2 + backRoomDepth
    );
    backRoomBackWall.receiveShadow = true;
    this.scene.add(backRoomBackWall);

    // Dinding belakang ruangan utama dengan pintu
    const mainBackWallWidth = (backRoomWidth - doorWidth * 2 - sekatWidth) / 2;

    const mainBackWallLeft = new THREE.Mesh(
      new THREE.PlaneGeometry(mainBackWallWidth, wallHeight),
      wallMat
    );
    mainBackWallLeft.position.set(
      -backRoomWidth / 2 + mainBackWallWidth / 2,
      wallHeight / 2,
      floorH / 2
    );
    mainBackWallLeft.receiveShadow = true;
    this.scene.add(mainBackWallLeft);

    const mainBackWallRight = new THREE.Mesh(
      new THREE.PlaneGeometry(mainBackWallWidth, wallHeight),
      wallMat
    );
    mainBackWallRight.position.set(
      backRoomWidth / 2 - mainBackWallWidth / 2,
      wallHeight / 2,
      floorH / 2
    );
    mainBackWallRight.receiveShadow = true;
    this.scene.add(mainBackWallRight);

    // Dinding atas pintu kiri
    const mainDoorLeftTop = new THREE.Mesh(
      new THREE.PlaneGeometry(doorWidth, wallHeight - 2.2),
      wallMat
    );
    mainDoorLeftTop.position.set(
      -sekatWidth / 2 - doorWidth / 2,
      wallHeight - (wallHeight - 2.2) / 2,
      floorH / 2
    );
    mainDoorLeftTop.receiveShadow = true;
    this.scene.add(mainDoorLeftTop);

    // Dinding atas pintu kanan
    const mainDoorRightTop = new THREE.Mesh(
      new THREE.PlaneGeometry(doorWidth, wallHeight - 2.2),
      wallMat
    );
    mainDoorRightTop.position.set(
      sekatWidth / 2 + doorWidth / 2,
      wallHeight - (wallHeight - 2.2) / 2,
      floorH / 2
    );
    mainDoorRightTop.receiveShadow = true;
    this.scene.add(mainDoorRightTop);

    // SEKAT TENGAH
    const sekatMat = new THREE.MeshStandardMaterial({
      color: 0xe0e0e0,
      side: THREE.DoubleSide,
    });

    const sekatDepth1 = backRoomDepth / 2 - doorWidth;
    const sekatFront = new THREE.Mesh(
      new THREE.BoxGeometry(sekatWidth, wallHeight, sekatDepth1),
      sekatMat
    );
    sekatFront.position.set(0, wallHeight / 2, floorH / 2 + sekatDepth1 / 2);
    sekatFront.receiveShadow = true;
    sekatFront.castShadow = true;
    this.scene.add(sekatFront);

    // Sekat atas pintu kiri
    const doorLeftTop = new THREE.Mesh(
      new THREE.BoxGeometry(sekatWidth, wallHeight - 2.2, doorWidth),
      sekatMat
    );
    doorLeftTop.position.set(
      0,
      wallHeight - (wallHeight - 2.2) / 2,
      floorH / 2 + backRoomDepth / 2 - doorWidth / 2
    );
    doorLeftTop.receiveShadow = true;
    doorLeftTop.castShadow = true;
    this.scene.add(doorLeftTop);

    // Sekat atas pintu kanan
    const doorRightTop = new THREE.Mesh(
      new THREE.BoxGeometry(sekatWidth, wallHeight - 2.2, doorWidth),
      sekatMat
    );
    doorRightTop.position.set(
      0,
      wallHeight - (wallHeight - 2.2) / 2,
      floorH / 2 + backRoomDepth / 2 + doorWidth / 2
    );
    doorRightTop.receiveShadow = true;
    doorRightTop.castShadow = true;
    this.scene.add(doorRightTop);

    // Dinding kiri
    const leftWall = new THREE.Mesh(
      new THREE.PlaneGeometry(floorH + backRoomDepth, wallHeight),
      wallMat
    );
    leftWall.position.set(-floorW / 2, wallHeight / 2, backRoomDepth / 2);
    leftWall.rotation.y = Math.PI / 2;
    leftWall.receiveShadow = true;
    this.scene.add(leftWall);

    // Dinding kanan
    const rightWall = new THREE.Mesh(
      new THREE.PlaneGeometry(floorH + backRoomDepth, wallHeight),
      wallMat
    );
    rightWall.position.set(floorW / 2, wallHeight / 2, backRoomDepth / 2);
    rightWall.rotation.y = -Math.PI / 2;
    rightWall.receiveShadow = true;
    this.scene.add(rightWall);
  }

  setupControls() {
    this.controls = new PointerLockControls(this.camera, document.body);
    const blocker = document.getElementById("blocker");
    const instructions = document.getElementById("instructions");

    instructions.addEventListener("click", () => this.controls.lock());

    this.controls.addEventListener("lock", () => {
      instructions.style.display = "none";
      blocker.style.display = "none";
    });

    this.controls.addEventListener("unlock", () => {
      blocker.style.display = "flex";
      instructions.style.display = "block";
    });

    this.scene.add(this.controls.getObject());

    document.addEventListener("keydown", (e) => this.onKeyDown(e));
    document.addEventListener("keyup", (e) => this.onKeyUp(e));
  }

  onKeyDown(e) {
    switch (e.code) {
      case "KeyW":
        this.moveForward = true;
        break;
      case "KeyA":
        this.moveLeft = true;
        break;
      case "KeyS":
        this.moveBackward = true;
        break;
      case "KeyD":
        this.moveRight = true;
        break;
    }
  }

  onKeyUp(e) {
    switch (e.code) {
      case "KeyW":
        this.moveForward = false;
        break;
      case "KeyA":
        this.moveLeft = false;
        break;
      case "KeyS":
        this.moveBackward = false;
        break;
      case "KeyD":
        this.moveRight = false;
        break;
    }
  }

  loadModels() {
    const loader = new GLTFLoader();

    loader.load(
      "assets/meja-azka.glb",
      (gltf) => {
        const modelAsli = gltf.scene;

        modelAsli.traverse((node) => {
          if (node.isMesh) {
            node.castShadow = true;
            node.receiveShadow = true;
            node.material.metalness = 0.0;
            node.material.roughness = 0.8;
            if (node.material.map) node.material.map.anisotropy = 16;
          }
        });

        modelAsli.scale.set(1, 1, 1);
        document.getElementById("loading").style.display = "none";

        this.createDesks(modelAsli);
        this.createPlatforms();
      },
      undefined,
      (error) => {
        console.error("Error:", error);
        const l = document.getElementById("loading");
        if (l) {
          l.innerText = "Error: Cek Folder Assets";
          l.style.color = "red";
        }
      }
    );
  }

  createDesks(modelAsli) {
    const rows = 9;
    const colsPerSide = 3;
    const aisleGap = 1.5;
    const deskSpacingX = 2.23;
    const deskSpacingZ = 2.0;

    // Meja kiri
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < colsPerSide; c++) {
        const meja = modelAsli.clone();
        const x = -(aisleGap / 2) - c * deskSpacingX - 1.0;
        const z = -10 + r * deskSpacingZ;
        meja.position.set(x, 0, z);
        this.scene.add(meja);
      }
    }

    // Meja kanan
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < colsPerSide; c++) {
        const meja = modelAsli.clone();
        const x = aisleGap / 2 + c * deskSpacingX + 1.0;
        const z = -10 + r * deskSpacingZ;
        meja.position.set(x, 0, z);
        this.scene.add(meja);
      }
    }
  }

  createPlatforms() {
    const platformMat = new THREE.MeshStandardMaterial({
      color: 0x808080,
      roughness: 0.6,
    });

    // Platform kiri
    const platformLeft = new THREE.Mesh(
      new THREE.BoxGeometry(2.5, 0.15, 18),
      platformMat
    );
    platformLeft.position.set(-8.5, 0.075, -1);
    platformLeft.receiveShadow = true;
    platformLeft.castShadow = true;
    this.scene.add(platformLeft);

    // Platform kanan
    const platformRight = new THREE.Mesh(
      new THREE.BoxGeometry(2.5, 0.15, 18),
      platformMat
    );
    platformRight.position.set(8.5, 0.075, -1);
    platformRight.receiveShadow = true;
    platformRight.castShadow = true;
    this.scene.add(platformRight);

    // Platform depan
    const frontPlatform = new THREE.Mesh(
      new THREE.BoxGeometry(13, 0.5, 8.3),
      platformMat
    );
    frontPlatform.position.set(0, 0.25, -14.5);
    frontPlatform.receiveShadow = true;
    frontPlatform.castShadow = true;
    this.scene.add(frontPlatform);

    // Platform mini
    const frontPlatformMini = new THREE.Mesh(
      new THREE.BoxGeometry(1, 0.25, 1),
      platformMat
    );
    frontPlatformMini.position.set(0, 0.125, -10.5);
    frontPlatformMini.receiveShadow = true;
    frontPlatformMini.castShadow = true;
    this.scene.add(frontPlatformMini);
  }

  onWindowResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  animate() {
    requestAnimationFrame(() => this.animate());

    const time = performance.now();
    if (this.controls.isLocked === true) {
      const delta = (time - this.prevTime) / 1000;
      this.velocity.x -= this.velocity.x * 10.0 * delta;
      this.velocity.z -= this.velocity.z * 10.0 * delta;
      this.direction.z = Number(this.moveForward) - Number(this.moveBackward);
      this.direction.x = Number(this.moveRight) - Number(this.moveLeft);
      this.direction.normalize();

      if (this.moveForward || this.moveBackward)
        this.velocity.z -= this.direction.z * 100.0 * delta;
      if (this.moveLeft || this.moveRight)
        this.velocity.x -= this.direction.x * 100.0 * delta;

      this.controls.moveRight(-this.velocity.x * delta);
      this.controls.moveForward(-this.velocity.z * delta);
    }
    this.prevTime = time;
    this.renderer.render(this.scene, this.camera);
  }
}
