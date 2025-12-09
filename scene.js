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

    // === TEMBOK UNTUK TV (KIRI DAN KANAN) - DIANTARA AC ===
    const tvWallDepth = 1.5;  // Kedalaman tembok dari dinding depan
    const tvWallWidth = 2.5;   // Lebar tembok
    
    // AC berada di z = -5 dan z = 5, jadi tembok ada di tengah (z = 0)
    const tvWallZPosition = 0;  // Posisi Z tembok (diantara kedua AC)

    // Tembok kiri untuk TV (tegak lurus dengan dinding samping)
    const tvWallLeft = new THREE.Mesh(
      new THREE.BoxGeometry(0.2, wallHeight, tvWallDepth),
      wallMat
    );
    tvWallLeft.position.set(-floorW / 2 + tvWallDepth, wallHeight / 2, tvWallZPosition);
    tvWallLeft.receiveShadow = true;
    tvWallLeft.castShadow = true;
    this.scene.add(tvWallLeft);

    // Tembok ujung kiri (menghadap ke dalam ruangan)
    const tvWallLeftFront = new THREE.Mesh(
      new THREE.BoxGeometry(tvWallDepth, wallHeight, 0.2),
      wallMat
    );
    tvWallLeftFront.position.set(-floorW / 2 + tvWallDepth / 2, wallHeight / 2, tvWallZPosition + tvWallDepth / 2);
    tvWallLeftFront.receiveShadow = true;
    tvWallLeftFront.castShadow = true;
    this.scene.add(tvWallLeftFront);

    // Tembok belakang kiri (menghubungkan ke dinding samping)
    const tvWallLeftBack = new THREE.Mesh(
      new THREE.BoxGeometry(tvWallDepth, wallHeight, 0.2),
      wallMat
    );
    tvWallLeftBack.position.set(-floorW / 2 + tvWallDepth / 2, wallHeight / 2, tvWallZPosition - tvWallDepth / 2);
    tvWallLeftBack.receiveShadow = true;
    tvWallLeftBack.castShadow = true;
    this.scene.add(tvWallLeftBack);

    // Tembok kanan untuk TV (tegak lurus dengan dinding samping)
    const tvWallRight = new THREE.Mesh(
      new THREE.BoxGeometry(0.2, wallHeight, tvWallDepth),
      wallMat
    );
    tvWallRight.position.set(floorW / 2 - tvWallDepth, wallHeight / 2, tvWallZPosition);
    tvWallRight.receiveShadow = true;
    tvWallRight.castShadow = true;
    this.scene.add(tvWallRight);

    // Tembok ujung kanan (menghadap ke dalam ruangan)
    const tvWallRightFront = new THREE.Mesh(
      new THREE.BoxGeometry(tvWallDepth, wallHeight, 0.2),
      wallMat
    );
    tvWallRightFront.position.set(floorW / 2 - tvWallDepth / 2, wallHeight / 2, tvWallZPosition + tvWallDepth / 2);
    tvWallRightFront.receiveShadow = true;
    tvWallRightFront.castShadow = true;
    this.scene.add(tvWallRightFront);

    // Tembok belakang kanan (menghubungkan ke dinding samping)
    const tvWallRightBack = new THREE.Mesh(
      new THREE.BoxGeometry(tvWallDepth, wallHeight, 0.2),
      wallMat
    );
    tvWallRightBack.position.set(floorW / 2 - tvWallDepth / 2, wallHeight / 2, tvWallZPosition - tvWallDepth / 2);
    tvWallRightBack.receiveShadow = true;
    tvWallRightBack.castShadow = true;
    this.scene.add(tvWallRightBack);
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

    // Material kaca untuk partisi
    const glassMat = new THREE.MeshPhysicalMaterial({
      color: 0xaaccdd,
      metalness: 0.0,
      roughness: 0.1,
      transmission: 0.9,
      thickness: 0.5,
      transparent: true,
      opacity: 0.3,
      side: THREE.DoubleSide,
    });

    // Material frame aluminium
    const frameMat = new THREE.MeshStandardMaterial({
      color: 0xcccccc,
      metalness: 0.7,
      roughness: 0.3,
    });

    // Dinding belakang ruangan utama dengan pintu (KACA)
    const mainBackWallWidth = (backRoomWidth - doorWidth * 2 - sekatWidth) / 2;

    // Kaca kiri
    const glassLeft = new THREE.Mesh(
      new THREE.PlaneGeometry(mainBackWallWidth, wallHeight),
      glassMat
    );
    glassLeft.position.set(
      -backRoomWidth / 2 + mainBackWallWidth / 2,
      wallHeight / 2,
      floorH / 2
    );
    glassLeft.receiveShadow = true;
    glassLeft.castShadow = true;
    this.scene.add(glassLeft);

    // Frame kiri
    const frameLeftTop = new THREE.Mesh(
      new THREE.BoxGeometry(mainBackWallWidth, 0.1, 0.05),
      frameMat
    );
    frameLeftTop.position.set(
      -backRoomWidth / 2 + mainBackWallWidth / 2,
      wallHeight,
      floorH / 2
    );
    this.scene.add(frameLeftTop);

    const frameLeftBottom = new THREE.Mesh(
      new THREE.BoxGeometry(mainBackWallWidth, 0.1, 0.05),
      frameMat
    );
    frameLeftBottom.position.set(
      -backRoomWidth / 2 + mainBackWallWidth / 2,
      0,
      floorH / 2
    );
    this.scene.add(frameLeftBottom);

    // Kaca kanan
    const glassRight = new THREE.Mesh(
      new THREE.PlaneGeometry(mainBackWallWidth, wallHeight),
      glassMat
    );
    glassRight.position.set(
      backRoomWidth / 2 - mainBackWallWidth / 2,
      wallHeight / 2,
      floorH / 2
    );
    glassRight.receiveShadow = true;
    glassRight.castShadow = true;
    this.scene.add(glassRight);

    // Frame kanan
    const frameRightTop = new THREE.Mesh(
      new THREE.BoxGeometry(mainBackWallWidth, 0.1, 0.05),
      frameMat
    );
    frameRightTop.position.set(
      backRoomWidth / 2 - mainBackWallWidth / 2,
      wallHeight,
      floorH / 2
    );
    this.scene.add(frameRightTop);

    const frameRightBottom = new THREE.Mesh(
      new THREE.BoxGeometry(mainBackWallWidth, 0.1, 0.05),
      frameMat
    );
    frameRightBottom.position.set(
      backRoomWidth / 2 - mainBackWallWidth / 2,
      0,
      floorH / 2
    );
    this.scene.add(frameRightBottom);

    // Kaca atas pintu kiri
    const glassDoorLeftTop = new THREE.Mesh(
      new THREE.PlaneGeometry(doorWidth, wallHeight - 2.2),
      glassMat
    );
    glassDoorLeftTop.position.set(
      -sekatWidth / 2 - doorWidth / 2,
      wallHeight - (wallHeight - 2.2) / 2,
      floorH / 2
    );
    glassDoorLeftTop.receiveShadow = true;
    glassDoorLeftTop.castShadow = true;
    this.scene.add(glassDoorLeftTop);

    // Frame pintu kiri
    const frameDoorLeftTop = new THREE.Mesh(
      new THREE.BoxGeometry(doorWidth, 0.1, 0.05),
      frameMat
    );
    frameDoorLeftTop.position.set(
      -sekatWidth / 2 - doorWidth / 2,
      wallHeight,
      floorH / 2
    );
    this.scene.add(frameDoorLeftTop);

    const frameDoorLeftMiddle = new THREE.Mesh(
      new THREE.BoxGeometry(doorWidth, 0.1, 0.05),
      frameMat
    );
    frameDoorLeftMiddle.position.set(
      -sekatWidth / 2 - doorWidth / 2,
      2.2,
      floorH / 2
    );
    this.scene.add(frameDoorLeftMiddle);

    // Kaca atas pintu kanan
    const glassDoorRightTop = new THREE.Mesh(
      new THREE.PlaneGeometry(doorWidth, wallHeight - 2.2),
      glassMat
    );
    glassDoorRightTop.position.set(
      sekatWidth / 2 + doorWidth / 2,
      wallHeight - (wallHeight - 2.2) / 2,
      floorH / 2
    );
    glassDoorRightTop.receiveShadow = true;
    glassDoorRightTop.castShadow = true;
    this.scene.add(glassDoorRightTop);

    // Frame pintu kanan
    const frameDoorRightTop = new THREE.Mesh(
      new THREE.BoxGeometry(doorWidth, 0.1, 0.05),
      frameMat
    );
    frameDoorRightTop.position.set(
      sekatWidth / 2 + doorWidth / 2,
      wallHeight,
      floorH / 2
    );
    this.scene.add(frameDoorRightTop);

    const frameDoorRightMiddle = new THREE.Mesh(
      new THREE.BoxGeometry(doorWidth, 0.1, 0.05),
      frameMat
    );
    frameDoorRightMiddle.position.set(
      sekatWidth / 2 + doorWidth / 2,
      2.2,
      floorH / 2
    );
    this.scene.add(frameDoorRightMiddle);

    // SEKAT TENGAH (tetap solid)
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

    // Load model meja
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
        modelAsli.scale.set(1, 1, 1.25);

        // Load model kursi
        loader.load(
          "assets/kursi.glb",
          (gltfKursi) => {
            const modelKursi = gltfKursi.scene;
            modelKursi.traverse((node) => {
              if (node.isMesh) {
                node.castShadow = true;
                node.receiveShadow = true;
                node.material.metalness = 0.0;
                node.material.roughness = 0.8;
                if (node.material.map) node.material.map.anisotropy = 16;
              }
            });
            modelKursi.scale.set(1.25, 1.25, 1.25);

            // Load model monitor
            loader.load(
              "assets/monitor.glb",
              (gltfMonitor) => {
                const modelMonitor = gltfMonitor.scene;
                modelMonitor.traverse((node) => {
                  if (node.isMesh) {
                    node.castShadow = true;
                    node.receiveShadow = true;
                    node.material.metalness = 0.0;
                    node.material.roughness = 0.8;
                    if (node.material.map) node.material.map.anisotropy = 16;
                  }
                });
                modelMonitor.scale.set(0.001, 0.001, 0.001);

                // Load model mouse
                loader.load(
                  "assets/mouse.glb",
                  (gltfMouse) => {
                    const modelMouse = gltfMouse.scene;
                    modelMouse.traverse((node) => {
                      if (node.isMesh) {
                        node.castShadow = true;
                        node.receiveShadow = true;
                        node.material.metalness = 0.0;
                        node.material.roughness = 0.8;
                        if (node.material.map) node.material.map.anisotropy = 16;
                      }
                    });
                    modelMouse.scale.set(0.015, 0.015, 0.015);

                    // Load CPU case
                    loader.load(
                      "assets/cpu_case.glb",
                      (gltfCpu) => {
                        const modelCpu = gltfCpu.scene;
                        modelCpu.traverse((node) => {
                          if (node.isMesh) {
                            node.castShadow = true;
                            node.receiveShadow = true;
                            node.material.metalness = 0.0;
                            node.material.roughness = 0.8;
                            if (node.material.map) node.material.map.anisotropy = 16;
                          }
                        });
                        modelCpu.scale.set(1.3, 1.3, 1.3);

                        // Load keyboard
                        loader.load(
                          "assets/keyboard.glb",
                          (gltfKeyboard) => {
                            const modelKeyboard = gltfKeyboard.scene;
                            modelKeyboard.traverse((node) => {
                              if (node.isMesh) {
                                node.castShadow = true;
                                node.receiveShadow = true;
                                node.material.metalness = 0.0;
                                node.material.roughness = 0.8;
                                if (node.material.map) node.material.map.anisotropy = 16;
                              }
                            });
                            modelKeyboard.scale.set(0.04, 0.04, 0.04);

                            // Load AC
                            loader.load(
                              "assets/ac.glb",
                              (gltfAc) => {
                                const modelAc = gltfAc.scene;
                                modelAc.traverse((node) => {
                                  if (node.isMesh) {
                                    node.castShadow = true;
                                    node.receiveShadow = true;
                                    node.material.metalness = 0.0;
                                    node.material.roughness = 0.8;
                                    if (node.material.map) node.material.map.anisotropy = 16;
                                  }
                                });
                                modelAc.scale.set(3, 3, 3);

                                // Load Speaker
                                loader.load(
                                  "assets/speaker.glb",
                                  (gltfSpeaker) => {
                                    const modelSpeaker = gltfSpeaker.scene;
                                    modelSpeaker.traverse((node) => {
                                      if (node.isMesh) {
                                        node.castShadow = true;
                                        node.receiveShadow = true;
                                        node.material.metalness = 0.0;
                                        node.material.roughness = 0.8;
                                        if (node.material.map) node.material.map.anisotropy = 16;
                                      }
                                    });
                                    modelSpeaker.scale.set(0.5, 0.5, 0.5);

                                    // Load TV Screen
                                    loader.load(
                                      "assets/tv_screen.glb",
                                      (gltfTv) => {
                                        const modelTv = gltfTv.scene;
                                        modelTv.traverse((node) => {
                                          if (node.isMesh) {
                                            node.castShadow = true;
                                            node.receiveShadow = true;
                                            node.material.metalness = 0.0;
                                            node.material.roughness = 0.8;
                                            if (node.material.map) node.material.map.anisotropy = 16;
                                          }
                                        });
                                        modelTv.scale.set(0.05, 0.05, 0.05);

                                        document.getElementById("loading").style.display = "none";
                                        this.createDesks(modelAsli, modelKursi, modelMonitor, modelMouse, modelCpu, modelKeyboard);
                                        this.createACs(modelAc);
                                        this.createSpeakers(modelSpeaker);
                                        this.createTVs(modelTv);
                                        this.createPlatforms();
                                      },
                                      undefined,
                                      (error) => {
                                        console.error("Error loading TV Screen:", error);
                                        document.getElementById("loading").style.display = "none";
                                        this.createDesks(modelAsli, modelKursi, modelMonitor, modelMouse, modelCpu, modelKeyboard);
                                        this.createACs(modelAc);
                                        this.createSpeakers(modelSpeaker);
                                        this.createPlatforms();
                                      }
                                    );
                                  },
                                  undefined,
                                  (error) => {
                                    console.error("Error loading Speaker:", error);
                                    document.getElementById("loading").style.display = "none";
                                    this.createDesks(modelAsli, modelKursi, modelMonitor, modelMouse, modelCpu, modelKeyboard);
                                    this.createACs(modelAc);
                                    this.createPlatforms();
                                  }
                                );
                              },
                              undefined,
                              (error) => {
                                console.error("Error loading AC:", error);
                                document.getElementById("loading").style.display = "none";
                                this.createDesks(modelAsli, modelKursi, modelMonitor, modelMouse, modelCpu, modelKeyboard);
                                this.createPlatforms();
                              }
                            );
                          },
                          undefined,
                          (error) => {
                            console.error("Error loading keyboard:", error);
                            document.getElementById("loading").style.display = "none";
                            this.createDesks(modelAsli, modelKursi, modelMonitor, modelMouse, modelCpu, null);
                            this.createPlatforms();
                          }
                        );
                      },
                      undefined,
                      (error) => {
                        console.error("Error loading CPU case:", error);
                        document.getElementById("loading").style.display = "none";
                        this.createDesks(modelAsli, modelKursi, modelMonitor, modelMouse, null, null);
                        this.createPlatforms();
                      }
                    );
                  },
                  undefined,
                  (error) => {
                    console.error("Error loading mouse:", error);
                    document.getElementById("loading").style.display = "none";
                    this.createDesks(modelAsli, modelKursi, modelMonitor, null, null, null);
                    this.createPlatforms();
                  }
                );
              },
              undefined,
              (error) => {
                console.error("Error loading monitor:", error);
                document.getElementById("loading").style.display = "none";
                this.createDesks(modelAsli, modelKursi, null, null, null, null);
                this.createPlatforms();
              }
            );
          },
          undefined,
          (error) => {
            console.error("Error loading kursi:", error);
            document.getElementById("loading").style.display = "none";
            this.createDesks(modelAsli, null, null, null, null, null);
            this.createPlatforms();
          }
        );
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

  createDesks(modelAsli, modelKursi, modelMonitor, modelMouse, modelCpu, modelKeyboard) {
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
        meja.position.set(x, 0, z + 0.3);
        this.scene.add(meja);

        if (modelKursi) {
          const kursi = modelKursi.clone();
          kursi.position.set(x, 0, z + 1.2);
          kursi.rotation.y = 0;
          this.scene.add(kursi);
        }

        if (modelMonitor) {
          const monitor = modelMonitor.clone();
          monitor.position.set(x, 1, z);
          monitor.rotation.y = -190;
          this.scene.add(monitor);
        }

        if (modelMouse) {
          const mouse = modelMouse.clone();
          mouse.position.set(x + 0.6, 0.95, z + 0.4);
          mouse.rotation.y = 135;
          this.scene.add(mouse);
        }

        if (modelCpu) {
          const cpu = modelCpu.clone();
          cpu.position.set(x + 0.65, 0.0, z + 0.4); // di lantai, sisi kanan bawah meja
          cpu.rotation.y = 0;
          this.scene.add(cpu);
        }

        if (modelKeyboard) {
          const keyboard = modelKeyboard.clone();
          keyboard.position.set(x, 1, z + 0.4);
          keyboard.rotation.y = 0;
          this.scene.add(keyboard);
        }
      }
    }

    // Meja kanan
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < colsPerSide; c++) {
        const meja = modelAsli.clone();
        const x = aisleGap / 2 + c * deskSpacingX + 1.0;
        const z = -10 + r * deskSpacingZ;
        meja.position.set(x, 0, z + 0.3);
        this.scene.add(meja);

        if (modelKursi) {
          const kursi = modelKursi.clone();
          kursi.position.set(x, 0, z + 1.2);
          kursi.rotation.y = 0;
          this.scene.add(kursi);
        }

        if (modelMonitor) {
          const monitor = modelMonitor.clone();
          monitor.position.set(x, 1, z);
          monitor.rotation.y = -190;
          this.scene.add(monitor);
        }

        if (modelMouse) {
          const mouse = modelMouse.clone();
          mouse.position.set(x + 0.6, 0.95, z + 0.4);
          mouse.rotation.y = 135;
          this.scene.add(mouse);
        }

        if (modelCpu) {
          const cpu = modelCpu.clone();
          cpu.position.set(x + 0.65, 0.0, z + 0.4);
          cpu.rotation.y = 0;
          this.scene.add(cpu);
        }

        if (modelKeyboard) {
          const keyboard = modelKeyboard.clone();
          keyboard.position.set(x, 1, z + 0.4);
          keyboard.rotation.y = 0;
          this.scene.add(keyboard);
        }
      }
    }
  }

  createACs(modelAc) {
    if (!modelAc) return;

    // AC di dinding kiri
    const acLeft1 = modelAc.clone();
    acLeft1.position.set(-9.5, 5, -5);
    acLeft1.rotation.y = Math.PI / 2;
    this.scene.add(acLeft1);

    const acLeft2 = modelAc.clone();
    acLeft2.position.set(-9.5, 5, 5);
    acLeft2.rotation.y = Math.PI / 2;
    this.scene.add(acLeft2);

    // AC di dinding kanan
    const acRight1 = modelAc.clone();
    acRight1.position.set(9.5, 5, -5);
    acRight1.rotation.y = -Math.PI / 2;
    this.scene.add(acRight1);

    const acRight2 = modelAc.clone();
    acRight2.position.set(9.5, 5, 5);
    acRight2.rotation.y = -Math.PI / 2;
    this.scene.add(acRight2);
  }

  createSpeakers(modelSpeaker) {
    if (!modelSpeaker) return;

    // Speaker pojok kiri atas dinding depan
    const speakerLeft = modelSpeaker.clone();
    speakerLeft.position.set(-8, 3, -15.8);
    speakerLeft.rotation.y = 0;
    this.scene.add(speakerLeft);

    // Speaker pojok kanan atas dinding depan
    const speakerRight = modelSpeaker.clone();
    speakerRight.position.set(7.5, 3, -15.8);
    speakerRight.rotation.y = 0;
    this.scene.add(speakerRight);
  }

  createTVs(modelTv) {
    if (!modelTv) return;

    const floorW = 19.5;
    const tvWallDepth = 1.5;
    const wallThickness = 0.2; // same as wall thickness
    const tvHeight = 4.5;
    const tvZ = 0;
    const offset = wallThickness / 2 + 0.05; // slight float off the wall

    // TV di tembok menonjol kiri, menghadap ke dalam
    const tvLeft = modelTv.clone();
    tvLeft.position.set(-floorW / 2 + tvWallDepth + offset, tvHeight + 1, tvZ + 0.82);
    tvLeft.rotation.y = Math.PI / 5;
    this.scene.add(tvLeft);

    // TV di tembok menonjol kanan, menghadap ke dalam
    const tvRight = modelTv.clone();
    tvRight.position.set(floorW / 2 - tvWallDepth - offset, tvHeight + 1, tvZ + 0.82);
    tvRight.rotation.y = -Math.PI / 5;
    this.scene.add(tvRight);
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
